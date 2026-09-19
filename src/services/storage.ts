import { ScoreRepository } from '../game/types';

const BEST_SCORE_KEY = 'driftZoneBest';

export class LocalScoreRepository implements ScoreRepository {
  async getBestScore(): Promise<number> {
    try {
      const stored = localStorage.getItem(BEST_SCORE_KEY);
      const score = Number(stored);
      return Number.isFinite(score) && score > 0 ? Math.floor(score) : 0;
    } catch {
      return 0;
    }
  }

  async setBestScore(score: number): Promise<void> {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(Math.max(0, Math.floor(score))));
    } catch {
      // Özel gezinme modunda depolama engellenebilir; rekor yalnızca oturumda kalır.
    }
  }
}
