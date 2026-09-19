import { INTERSTITIAL_COOLDOWN_MS, canShowInterstitial } from '../adPolicy';

describe('canShowInterstitial', () => {
  const now = 500_000;

  it('allows an interstitial on every completed run once the cooldown passed', () => {
    expect(canShowInterstitial(1, now, now - INTERSTITIAL_COOLDOWN_MS, true)).toBe(true);
    expect(canShowInterstitial(2, now, now - INTERSTITIAL_COOLDOWN_MS - 1, true)).toBe(true);
    expect(canShowInterstitial(7, now, 0, true)).toBe(true);
    expect(canShowInterstitial(0, now, 0, true)).toBe(false);
  });

  it('respects the cooldown window', () => {
    expect(canShowInterstitial(1, now, now, true)).toBe(false);
    expect(canShowInterstitial(1, now, now - INTERSTITIAL_COOLDOWN_MS + 1, true)).toBe(false);
  });

  it('never shows an unloaded advertisement', () => {
    expect(canShowInterstitial(3, now, 0, false)).toBe(false);
  });
});
