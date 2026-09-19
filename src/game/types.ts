export type ColorId = 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export type GamePhase = 'menu' | 'playing' | 'paused' | 'over';

export interface Point {
  x: number;
  y: number;
}

export interface TrailPoint extends Point {
  life: number;
}

export interface Player extends Point {
  targetX: number;
  targetY: number;
  radius: number;
  color: ColorId;
  invulnerableFrames: number;
  trail: TrailPoint[];
}

export interface Zone extends Point {
  active: boolean;
  width: number;
  height: number;
  speed: number;
  color: ColorId;
  opacity: number;
}

export interface Particle extends Point {
  active: boolean;
  velocityX: number;
  velocityY: number;
  radius: number;
  color: ColorId;
  life: number;
  decay: number;
}

export interface DifficultyConfig {
  level: number;
  availableColors: ColorId[];
  spawnIntervalFrames: number;
}

export interface GameState {
  phase: GamePhase;
  score: number;
  bestScore: number;
  combo: number;
  maxCombo: number;
  lives: number;
  frame: number;
  spawnCountdown: number;
  difficulty: DifficultyConfig;
  player: Player;
  zones: Zone[];
  particles: Particle[];
  flashFrames: number;
  shake: number;
  rewardedContinueUsed: boolean;
  rewardedDoubleUsed: boolean;
  completedRuns: number;
}

export type EngineCommand =
  | { type: 'START' }
  | { type: 'MOVE'; x: number; y: number }
  | { type: 'SHIFT_COLOR' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RETURN_TO_MENU' }
  | { type: 'RESTART' }
  | { type: 'REWARDED_CONTINUE' }
  | { type: 'REWARDED_DOUBLE_SCORE' };

export type GameEvent =
  | { type: 'CORRECT'; score: number; combo: number }
  | { type: 'HIT'; lives: number }
  | { type: 'COMBO'; combo: number }
  | { type: 'LEVEL_UP'; level: number }
  | { type: 'SHIFT'; color: ColorId }
  | { type: 'GAME_OVER'; score: number; bestScore: number }
  | { type: 'REWARDED_CONTINUE' }
  | { type: 'REWARDED_DOUBLE_SCORE'; score: number };

export interface RandomSource {
  next(): number;
}

export interface ScoreRepository {
  getBestScore(): Promise<number>;
  setBestScore(score: number): Promise<void>;
}

export type SoundEffect = 'correct' | 'wrong' | 'combo' | 'gameOver' | 'shift';

export interface AudioService {
  preload(): Promise<void>;
  play(effect: SoundEffect): void;
  setActive(active: boolean): Promise<void>;
  dispose(): void;
}

export interface AdGateway {
  initialize(): Promise<void>;
  isRewardedReady(): boolean;
  showRewarded(): Promise<boolean>;
  shouldShowInterstitial(completedRuns: number, now: number): boolean;
  showInterstitial(): Promise<boolean>;
  showPrivacyOptions(): Promise<void>;
  dispose(): void;
}
