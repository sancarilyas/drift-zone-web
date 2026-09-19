export function scoreForMatch(currentCombo: number): number {
  return 10 + Math.max(0, currentCombo) * 5;
}
