import { GameEngine } from '../GameEngine';
import { SeededRandom } from '../random';

describe('GameEngine', () => {
  it('is deterministic for an equal random seed and command stream', () => {
    const first = new GameEngine(new SeededRandom(42));
    const second = new GameEngine(new SeededRandom(42));
    first.dispatch({ type: 'START' });
    second.dispatch({ type: 'START' });
    first.dispatch({ type: 'MOVE', x: 80, y: 430 });
    second.dispatch({ type: 'MOVE', x: 80, y: 430 });
    for (let index = 0; index < 200; index += 1) {
      first.step();
      second.step();
    }
    expect(first.snapshot()).toEqual(second.snapshot());
  });

  it('pauses simulation and resumes it explicitly', () => {
    const engine = new GameEngine(new SeededRandom(1));
    engine.dispatch({ type: 'START' });
    engine.step();
    engine.dispatch({ type: 'PAUSE' });
    const pausedFrame = engine.snapshot().frame;
    engine.step();
    expect(engine.snapshot().frame).toBe(pausedFrame);
    engine.dispatch({ type: 'RESUME' });
    engine.step();
    expect(engine.snapshot().frame).toBe(pausedFrame + 1);
  });

  it('cycles through the currently unlocked colors', () => {
    const engine = new GameEngine(new SeededRandom(4));
    engine.dispatch({ type: 'START' });
    const initial = engine.snapshot().player.color;
    engine.dispatch({ type: 'SHIFT_COLOR' });
    engine.dispatch({ type: 'SHIFT_COLOR' });
    engine.dispatch({ type: 'SHIFT_COLOR' });
    expect(engine.snapshot().player.color).toBe(initial);
    expect(engine.snapshot().player.invulnerableFrames).toBe(10);
  });

  it('allows a rewarded continue only once after three hits', () => {
    const engine = new GameEngine(new SeededRandom(19));
    engine.dispatch({ type: 'START' });

    for (let frame = 0; frame < 15_000 && engine.snapshot().phase === 'playing'; frame += 1) {
      const snapshot = engine.snapshot();
      if (snapshot.player.invulnerableFrames === 0) {
        const wrongZone = snapshot.zones.find(
          (zone) => zone.active && zone.color !== snapshot.player.color && zone.y > 20,
        );
        if (wrongZone) {
          engine.dispatch({ type: 'MOVE', x: wrongZone.x, y: wrongZone.y });
        }
      }
      engine.step();
    }

    expect(engine.snapshot().phase).toBe('over');
    expect(engine.snapshot().lives).toBe(0);
    engine.dispatch({ type: 'REWARDED_CONTINUE' });
    expect(engine.snapshot().phase).toBe('playing');
    expect(engine.snapshot().lives).toBe(1);
    expect(engine.snapshot().rewardedContinueUsed).toBe(true);
    engine.dispatch({ type: 'REWARDED_CONTINUE' });
    expect(engine.snapshot().lives).toBe(1);
  });

  it('applies the rewarded score double exactly once after a run ends', () => {
    const engine = new GameEngine(new SeededRandom(19));
    engine.dispatch({ type: 'START' });

    for (let frame = 0; frame < 15_000 && engine.snapshot().phase === 'playing'; frame += 1) {
      const snapshot = engine.snapshot();
      if (snapshot.player.invulnerableFrames === 0) {
        const wrongZone = snapshot.zones.find(
          (zone) => zone.active && zone.color !== snapshot.player.color && zone.y > 20,
        );
        if (wrongZone) {
          engine.dispatch({ type: 'MOVE', x: wrongZone.x, y: wrongZone.y });
        }
      }
      engine.step();
    }

    const finalScore = engine.snapshot().score;
    expect(engine.snapshot().phase).toBe('over');
    expect(engine.snapshot().rewardedDoubleUsed).toBe(false);

    engine.dispatch({ type: 'REWARDED_DOUBLE_SCORE' });
    expect(engine.snapshot().score).toBe(finalScore * 2);
    expect(engine.snapshot().rewardedDoubleUsed).toBe(true);
    expect(engine.drainEvents().some((event) => event.type === 'REWARDED_DOUBLE_SCORE')).toBe(true);

    engine.dispatch({ type: 'REWARDED_DOUBLE_SCORE' });
    expect(engine.snapshot().score).toBe(finalScore * 2);
    expect(engine.drainEvents()).toHaveLength(0);
  });
});
