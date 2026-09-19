import './styles.css';
import { DESIGN_HEIGHT, DESIGN_WIDTH, FIXED_STEP_MS } from './game/config';
import { GameEngine } from './game/GameEngine';
import { GameEvent } from './game/types';
import { renderGame } from './renderer';
import { WebAdsService, adSettings, mountAdSlot } from './services/ads';
import { WebAudioService } from './services/audio';
import { LocalScoreRepository } from './services/storage';
import { GameUi } from './ui';

const canvas = element<HTMLCanvasElement>('gameCanvas');
const context = requireContext();
const stage = element<HTMLDivElement>('stage');
const stageWrap = element<HTMLDivElement>('stageWrap');

const engine = new GameEngine();
const audio = new WebAudioService();
const ads = new WebAdsService();
const scores = new LocalScoreRepository();

let width = 0;
let height = 0;
let lastTime = performance.now();
let accumulator = 0;

const ui = new GameUi({
  onStart: begin,
  onResume: resume,
  onRestart: () => void completeTransition('restart'),
  onMenu: () => void completeTransition('menu'),
  onContinueWithAd: () => void continueWithAd(),
  onDoubleScore: () => void doubleScoreWithAd(),
  onToggleSound: () => {
    audio.setMuted(!audio.isMuted());
    ui.setSoundEnabled(!audio.isMuted());
  },
});

function syncState(): void {
  ui.update(engine.snapshot());
}

function processEvents(events: GameEvent[]): void {
  for (const event of events) {
    switch (event.type) {
      case 'CORRECT':
        audio.play('correct');
        break;
      case 'HIT':
        audio.play('wrong');
        break;
      case 'COMBO':
        audio.play('combo');
        break;
      case 'SHIFT':
        audio.play('shift');
        break;
      case 'GAME_OVER':
        audio.play('gameOver');
        void scores.setBestScore(event.bestScore);
        break;
      case 'REWARDED_DOUBLE_SCORE':
        void scores.setBestScore(engine.snapshot().bestScore);
        break;
      case 'REWARDED_CONTINUE':
      case 'LEVEL_UP':
        break;
    }
  }
}

function begin(): void {
  engine.dispatch({ type: 'START' });
  syncState();
}

function resume(): void {
  engine.dispatch({ type: 'RESUME' });
  syncState();
}

async function continueWithAd(): Promise<void> {
  const earned = await ads.showRewarded('rewarded-continue');
  if (!earned) return;
  engine.dispatch({ type: 'REWARDED_CONTINUE' });
  syncState();
}

async function doubleScoreWithAd(): Promise<void> {
  const earned = await ads.showRewarded('rewarded-double');
  if (!earned) return;
  engine.dispatch({ type: 'REWARDED_DOUBLE_SCORE' });
  syncState();
}

async function completeTransition(destination: 'restart' | 'menu'): Promise<void> {
  const snapshot = engine.snapshot();
  if (ads.shouldShowInterstitial(snapshot.completedRuns, Date.now())) {
    await ads.showInterstitial();
  }
  engine.dispatch({ type: destination === 'restart' ? 'RESTART' : 'RETURN_TO_MENU' });
  syncState();
}

function moveBy(deltaX: number, deltaY: number): void {
  const player = engine.snapshot().player;
  engine.dispatch({ type: 'MOVE', x: player.targetX + deltaX, y: player.targetY + deltaY });
}

function shiftColor(): void {
  if (engine.snapshot().phase !== 'playing') return;
  engine.dispatch({ type: 'SHIFT_COLOR' });
  processEvents(engine.drainEvents());
  syncState();
}

function togglePause(): void {
  const phase = engine.snapshot().phase;
  if (phase === 'playing') engine.dispatch({ type: 'PAUSE' });
  else if (phase === 'paused') engine.dispatch({ type: 'RESUME' });
  syncState();
}

function resize(): void {
  const availableWidth = Math.max(1, stageWrap.clientWidth);
  const availableHeight = Math.max(1, stageWrap.clientHeight);
  const ratio = DESIGN_WIDTH / DESIGN_HEIGHT;
  let nextHeight = availableHeight;
  let nextWidth = nextHeight * ratio;
  if (nextWidth > availableWidth) {
    nextWidth = availableWidth;
    nextHeight = nextWidth / ratio;
  }
  width = Math.floor(nextWidth);
  height = Math.floor(nextHeight);
  stage.style.width = `${width}px`;
  stage.style.height = `${height}px`;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(height * pixelRatio));
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

let dragging = false;
let lastTapAt = 0;
let lastTapX = 0;
let lastTapY = 0;

function toDesignPoint(event: PointerEvent): { x: number; y: number } {
  const rect = stage.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * DESIGN_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * DESIGN_HEIGHT,
  };
}

canvas.addEventListener('pointerdown', (event) => {
  if (engine.snapshot().phase !== 'playing') return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
  dragging = true;

  const now = performance.now();
  const isDoubleTap =
    now - lastTapAt < 350 && Math.hypot(event.clientX - lastTapX, event.clientY - lastTapY) < 30;
  if (isDoubleTap) {
    lastTapAt = 0;
    shiftColor();
  } else {
    lastTapAt = now;
    lastTapX = event.clientX;
    lastTapY = event.clientY;
  }

  const point = toDesignPoint(event);
  engine.dispatch({ type: 'MOVE', x: point.x, y: point.y });
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const point = toDesignPoint(event);
  engine.dispatch({ type: 'MOVE', x: point.x, y: point.y });
});

function endDrag(event: PointerEvent): void {
  if (!dragging) return;
  dragging = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('keydown', (event) => {
  const phase = engine.snapshot().phase;
  switch (event.code) {
    case 'ArrowLeft':
    case 'KeyA':
      event.preventDefault();
      moveBy(-30, 0);
      break;
    case 'ArrowRight':
    case 'KeyD':
      event.preventDefault();
      moveBy(30, 0);
      break;
    case 'ArrowUp':
    case 'KeyW':
      event.preventDefault();
      moveBy(0, -30);
      break;
    case 'ArrowDown':
    case 'KeyS':
      event.preventDefault();
      moveBy(0, 30);
      break;
    case 'Space':
      event.preventDefault();
      shiftColor();
      break;
    case 'KeyC':
      shiftColor();
      break;
    case 'KeyP':
    case 'Escape':
      togglePause();
      break;
    case 'Enter':
      if (phase === 'menu') begin();
      else if (phase === 'over') void completeTransition('restart');
      break;
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (engine.snapshot().phase === 'playing') engine.dispatch({ type: 'PAUSE' });
    void audio.setActive(false);
    syncState();
    return;
  }
  void audio.setActive(true);
});

async function start(): Promise<void> {
  resize();
  new ResizeObserver(() => resize()).observe(stageWrap);

  const bestScore = await scores.getBestScore();
  engine.setBestScore(bestScore);
  syncState();

  await audio.preload();
  ui.setSoundEnabled(!audio.isMuted());
  mountAdSlot(element('adTop'), adSettings.slotTop);
  mountAdSlot(element('adBottom'), adSettings.slotBottom);

  ads.setHooks({
    onBreakStart: () => {
      void audio.setActive(false);
      if (engine.snapshot().phase === 'playing') engine.dispatch({ type: 'PAUSE' });
      syncState();
    },
    onBreakEnd: () => {
      void audio.setActive(true);
    },
  });
  void ads.initialize();

  setInterval(() => {
    ui.setRewardedAvailable(ads.isRewardedReady());
    if (engine.snapshot().phase === 'over') syncState();
  }, 500);

  const unlockAudio = (): void => {
    void audio.setActive(true);
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  const frame = (now: number): void => {
    const elapsed = Math.min(100, now - lastTime);
    lastTime = now;
    accumulator += elapsed;
    let changed = false;
    while (accumulator >= FIXED_STEP_MS) {
      engine.step();
      accumulator -= FIXED_STEP_MS;
      changed = true;
    }
    const events = engine.drainEvents();
    if (events.length) processEvents(events);
    if (changed || events.length) syncState();
    renderGame(context, engine.snapshot(), width, height);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Eksik arayüz öğesi: #${id}`);
  return found as T;
}

function requireContext(): CanvasRenderingContext2D {
  const found = canvas.getContext('2d');
  if (!found) throw new Error('Canvas 2D desteklenmiyor');
  return found;
}

void start();
