import { COLORS } from './game/config';
import { GameState } from './game/types';

export interface GameUiHandlers {
  onStart(): void;
  onResume(): void;
  onRestart(): void;
  onMenu(): void;
  onContinueWithAd(): void;
  onDoubleScore(): void;
  onToggleSound(): void;
}

export class GameUi {
  private readonly hud = element('hud');
  private readonly hudScore = element('hudScore');
  private readonly hudBest = element('hudBest');
  private readonly hudLives = element('hudLives');
  private readonly hudDot = element('hudDot');
  private readonly hudCombo = element('hudCombo');
  private readonly menuOverlay = element('menuOverlay');
  private readonly pauseOverlay = element('pauseOverlay');
  private readonly overOverlay = element('overOverlay');
  private readonly finalScore = element('finalScore');
  private readonly overSummary = element('overSummary');
  private readonly continueButton = element<HTMLButtonElement>('continueButton');
  private readonly doubleButton = element<HTMLButtonElement>('doubleButton');
  private readonly soundButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.js-sound-button'),
  );

  private rewardedAvailable = false;

  constructor(handlers: GameUiHandlers) {
    bind('startButton', handlers.onStart);
    bind('resumeButton', handlers.onResume);
    bind('restartButton', handlers.onRestart);
    bind('menuButton', handlers.onMenu);
    bind('continueButton', handlers.onContinueWithAd);
    bind('doubleButton', handlers.onDoubleScore);
    for (const button of this.soundButtons) {
      button.addEventListener('click', () => {
        button.blur();
        handlers.onToggleSound();
      });
    }
  }

  update(state: GameState): void {
    this.hud.hidden = state.phase !== 'playing';
    this.menuOverlay.hidden = state.phase !== 'menu';
    this.pauseOverlay.hidden = state.phase !== 'paused';
    this.overOverlay.hidden = state.phase !== 'over';

    if (state.phase === 'playing') {
      this.hudScore.textContent = String(state.score);
      this.hudBest.textContent = String(state.bestScore);
      this.hudLives.textContent =
        '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, 3 - state.lives));
      this.hudDot.style.backgroundColor = COLORS[state.player.color].main;
      this.hudCombo.hidden = state.combo < 3;
      this.hudCombo.textContent = `🔥 x${state.combo}`;
    }

    if (state.phase === 'over') {
      this.finalScore.textContent = String(state.score);
      this.overSummary.textContent = `En iyi: ${state.bestScore}  •  Maks. kombo: x${state.maxCombo}`;
      this.continueButton.hidden = !(this.rewardedAvailable && !state.rewardedContinueUsed);
      this.doubleButton.hidden = !(this.rewardedAvailable && !state.rewardedDoubleUsed);
    }
  }

  setRewardedAvailable(available: boolean): void {
    this.rewardedAvailable = available;
  }

  setSoundEnabled(enabled: boolean): void {
    for (const button of this.soundButtons) {
      button.textContent = enabled ? 'Ses: Açık' : 'Ses: Kapalı';
    }
  }
}

function bind(id: string, handler: () => void): void {
  const button = element<HTMLButtonElement>(id);
  button.addEventListener('click', () => {
    button.blur();
    handler();
  });
}

function element<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Eksik arayüz öğesi: #${id}`);
  return found as T;
}
