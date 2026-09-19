import {
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  MAX_PARTICLES,
  MAX_ZONES,
  PLAYER_RADIUS,
  STARTING_LIVES,
  difficultyForScore,
} from './config';
import { playerIntersectsZone } from './collision';
import { systemRandom } from './random';
import { scoreForMatch } from './rules';
import {
  ColorId,
  EngineCommand,
  GameEvent,
  GameState,
  Particle,
  RandomSource,
  Zone,
} from './types';

const makeZone = (): Zone => ({
  active: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  speed: 0,
  color: 'red',
  opacity: 0,
});

const makeParticle = (): Particle => ({
  active: false,
  x: 0,
  y: 0,
  velocityX: 0,
  velocityY: 0,
  radius: 0,
  color: 'red',
  life: 0,
  decay: 0,
});

export class GameEngine {
  private readonly random: RandomSource;
  private readonly events: GameEvent[] = [];
  private state: GameState;

  constructor(random: RandomSource = systemRandom) {
    this.random = random;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      phase: 'menu',
      score: 0,
      bestScore: 0,
      combo: 0,
      maxCombo: 0,
      lives: STARTING_LIVES,
      frame: 0,
      spawnCountdown: 20,
      difficulty: difficultyForScore(0),
      player: {
        x: DESIGN_WIDTH / 2,
        y: DESIGN_HEIGHT * 0.82,
        targetX: DESIGN_WIDTH / 2,
        targetY: DESIGN_HEIGHT * 0.82,
        radius: PLAYER_RADIUS,
        color: 'red',
        invulnerableFrames: 0,
        trail: [],
      },
      zones: Array.from({ length: MAX_ZONES }, makeZone),
      particles: Array.from({ length: MAX_PARTICLES }, makeParticle),
      flashFrames: 0,
      shake: 0,
      rewardedContinueUsed: false,
      rewardedDoubleUsed: false,
      completedRuns: 0,
    };
  }

  setBestScore(score: number): void {
    this.state.bestScore = Math.max(0, Math.floor(score));
  }

  dispatch(command: EngineCommand): void {
    switch (command.type) {
      case 'START':
      case 'RESTART':
        this.start();
        return;
      case 'MOVE':
        this.moveTarget(command.x, command.y);
        return;
      case 'SHIFT_COLOR':
        this.shiftColor();
        return;
      case 'PAUSE':
        if (this.state.phase === 'playing') this.state.phase = 'paused';
        return;
      case 'RESUME':
        if (this.state.phase === 'paused') this.state.phase = 'playing';
        return;
      case 'RETURN_TO_MENU':
        this.state.phase = 'menu';
        return;
      case 'REWARDED_CONTINUE':
        this.continueWithReward();
        return;
      case 'REWARDED_DOUBLE_SCORE':
        this.doubleScoreWithReward();
    }
  }

  start(): void {
    const bestScore = this.state.bestScore;
    const completedRuns = this.state.completedRuns;
    this.state = this.createInitialState();
    this.state.bestScore = bestScore;
    this.state.completedRuns = completedRuns;
    const colors = this.state.difficulty.availableColors;
    this.state.player.color = colors[this.randomIndex(colors.length)];
    this.state.phase = 'playing';
  }

  step(): void {
    if (this.state.phase !== 'playing') return;

    this.state.frame += 1;
    this.updatePlayer();

    this.state.spawnCountdown -= 1;
    if (this.state.spawnCountdown <= 0) {
      this.spawnZone();
      this.state.spawnCountdown = this.state.difficulty.spawnIntervalFrames;
    }

    this.updateZones();
    this.updateParticles();
    this.state.flashFrames = Math.max(0, this.state.flashFrames - 1);
    this.state.shake *= 0.82;
    if (this.state.shake < 0.1) this.state.shake = 0;
  }

  snapshot(): GameState {
    return {
      ...this.state,
      difficulty: {
        ...this.state.difficulty,
        availableColors: [...this.state.difficulty.availableColors],
      },
      player: {
        ...this.state.player,
        trail: this.state.player.trail.map((point) => ({ ...point })),
      },
      zones: this.state.zones.map((zone) => ({ ...zone })),
      particles: this.state.particles.map((particle) => ({ ...particle })),
    };
  }

  drainEvents(): GameEvent[] {
    return this.events.splice(0, this.events.length);
  }

  private moveTarget(x: number, y: number): void {
    this.state.player.targetX = Math.max(PLAYER_RADIUS, Math.min(DESIGN_WIDTH - PLAYER_RADIUS, x));
    this.state.player.targetY = Math.max(80, Math.min(DESIGN_HEIGHT - PLAYER_RADIUS, y));
  }

  private updatePlayer(): void {
    const player = this.state.player;
    player.x += (player.targetX - player.x) * 0.25;
    player.y += (player.targetY - player.y) * 0.25;
    player.invulnerableFrames = Math.max(0, player.invulnerableFrames - 1);

    player.trail = player.trail
      .map((point) => ({ ...point, life: point.life - 0.05 }))
      .filter((point) => point.life > 0);
    player.trail.push({ x: player.x, y: player.y, life: 1 });
    if (player.trail.length > 20) player.trail.shift();
  }

  private spawnZone(): void {
    const zone = this.state.zones.find((candidate) => !candidate.active);
    if (!zone) return;

    zone.width = 60 + this.random.next() * 90;
    zone.height = 30 + this.random.next() * 40;
    zone.x = zone.width / 2 + this.random.next() * (DESIGN_WIDTH - zone.width);
    zone.y = -zone.height / 2;
    zone.speed = 1 + this.state.difficulty.level * 0.35 + this.random.next() * 0.6;
    zone.color = this.randomColor();
    zone.opacity = 0;
    zone.active = true;
  }

  private updateZones(): void {
    for (const zone of this.state.zones) {
      if (!zone.active) continue;

      zone.y += zone.speed;
      zone.opacity = Math.min(1, zone.opacity + 0.06);

      if (zone.y - zone.height / 2 > DESIGN_HEIGHT) {
        zone.active = false;
        continue;
      }

      if (
        this.state.player.invulnerableFrames === 0 &&
        playerIntersectsZone(this.state.player, zone)
      ) {
        this.resolveCollision(zone);
      }
    }
  }

  private resolveCollision(zone: Zone): void {
    zone.active = false;

    if (zone.color === this.state.player.color) {
      const gained = scoreForMatch(this.state.combo);
      this.state.score += gained;
      this.state.combo += 1;
      this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
      this.spawnParticles(zone.x, zone.y, zone.color, 9);
      this.events.push({ type: 'CORRECT', score: this.state.score, combo: this.state.combo });

      if (this.state.combo % 5 === 0) {
        this.state.flashFrames = 5;
        this.events.push({ type: 'COMBO', combo: this.state.combo });
      }

      const previousLevel = this.state.difficulty.level;
      this.state.difficulty = difficultyForScore(this.state.score);
      if (this.state.difficulty.level !== previousLevel) {
        this.events.push({ type: 'LEVEL_UP', level: this.state.difficulty.level });
      }
      return;
    }

    this.state.lives -= 1;
    this.state.combo = 0;
    this.state.player.invulnerableFrames = 40;
    this.state.flashFrames = 12;
    this.state.shake = 20;
    this.spawnParticles(zone.x, zone.y, 'red', 18);
    this.events.push({ type: 'HIT', lives: this.state.lives });

    if (this.state.lives <= 0) this.finishRun();
  }

  private finishRun(): void {
    this.state.phase = 'over';
    if (!this.state.rewardedContinueUsed) this.state.completedRuns += 1;
    this.state.bestScore = Math.max(this.state.bestScore, this.state.score);
    this.state.shake = 20;
    this.spawnParticles(this.state.player.x, this.state.player.y, 'red', 30);
    this.events.push({
      type: 'GAME_OVER',
      score: this.state.score,
      bestScore: this.state.bestScore,
    });
  }

  private continueWithReward(): void {
    if (this.state.phase !== 'over' || this.state.rewardedContinueUsed) return;

    this.state.phase = 'playing';
    this.state.lives = 1;
    this.state.rewardedContinueUsed = true;
    this.state.player.invulnerableFrames = 90;
    this.state.flashFrames = 0;
    this.state.shake = 0;
    for (const zone of this.state.zones) {
      if (Math.abs(zone.y - this.state.player.y) < 150) zone.active = false;
    }
    this.events.push({ type: 'REWARDED_CONTINUE' });
  }

  private doubleScoreWithReward(): void {
    if (this.state.phase !== 'over' || this.state.rewardedDoubleUsed) return;

    this.state.score *= 2;
    this.state.rewardedDoubleUsed = true;
    this.state.bestScore = Math.max(this.state.bestScore, this.state.score);
    this.events.push({ type: 'REWARDED_DOUBLE_SCORE', score: this.state.score });
  }

  private shiftColor(): void {
    if (this.state.phase !== 'playing') return;

    const colors = this.state.difficulty.availableColors;
    const currentIndex = colors.indexOf(this.state.player.color);
    this.state.player.color = colors[(currentIndex + 1) % colors.length];
    this.state.player.invulnerableFrames = Math.max(
      10,
      this.state.player.invulnerableFrames,
    );
    this.spawnParticles(
      this.state.player.x,
      this.state.player.y,
      this.state.player.color,
      12,
    );
    this.events.push({ type: 'SHIFT', color: this.state.player.color });
  }

  private spawnParticles(x: number, y: number, color: ColorId, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const particle =
        this.state.particles.find((candidate) => !candidate.active) ??
        this.state.particles.reduce((oldest, candidate) =>
          candidate.life < oldest.life ? candidate : oldest,
        );
      const angle = this.random.next() * Math.PI * 2;
      const speed = 1.5 + this.random.next() * 4.5;
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.velocityX = Math.cos(angle) * speed;
      particle.velocityY = Math.sin(angle) * speed;
      particle.radius = 1.5 + this.random.next() * 3.5;
      particle.color = color;
      particle.life = 1;
      particle.decay = 0.015 + this.random.next() * 0.025;
    }
  }

  private updateParticles(): void {
    for (const particle of this.state.particles) {
      if (!particle.active) continue;
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityX *= 0.98;
      particle.velocityY *= 0.98;
      particle.life -= particle.decay;
      if (particle.life <= 0) particle.active = false;
    }
  }

  private randomColor(): ColorId {
    const colors = this.state.difficulty.availableColors;
    return colors[this.randomIndex(colors.length)];
  }

  private randomIndex(length: number): number {
    return Math.min(length - 1, Math.floor(this.random.next() * length));
  }
}
