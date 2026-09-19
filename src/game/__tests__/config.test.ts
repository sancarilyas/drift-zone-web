import { difficultyForScore } from '../config';

describe('difficultyForScore', () => {
  it('increases the level every 200 points and caps at 8', () => {
    expect(difficultyForScore(0).level).toBe(1);
    expect(difficultyForScore(199).level).toBe(1);
    expect(difficultyForScore(200).level).toBe(2);
    expect(difficultyForScore(50_000).level).toBe(8);
  });

  it('unlocks yellow at level 3 and purple at level 6', () => {
    expect(difficultyForScore(0).availableColors).toHaveLength(3);
    expect(difficultyForScore(400).availableColors).toContain('yellow');
    expect(difficultyForScore(1_000).availableColors).toContain('purple');
  });

  it('never allows a spawn interval below 20 frames', () => {
    expect(difficultyForScore(50_000).spawnIntervalFrames).toBeGreaterThanOrEqual(20);
  });
});
