export const INTERSTITIAL_RUN_FREQUENCY = 1;
export const INTERSTITIAL_COOLDOWN_MS = 30_000;

export function canShowInterstitial(
  completedRuns: number,
  now: number,
  lastShownAt: number,
  loaded: boolean,
): boolean {
  return (
    loaded &&
    completedRuns > 0 &&
    completedRuns % INTERSTITIAL_RUN_FREQUENCY === 0 &&
    now - lastShownAt >= INTERSTITIAL_COOLDOWN_MS
  );
}
