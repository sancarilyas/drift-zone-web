import { scoreForMatch } from '../rules';

describe('scoreForMatch', () => {
  it('adds five points for every existing combo step', () => {
    expect(scoreForMatch(0)).toBe(10);
    expect(scoreForMatch(1)).toBe(15);
    expect(scoreForMatch(5)).toBe(35);
  });
});
