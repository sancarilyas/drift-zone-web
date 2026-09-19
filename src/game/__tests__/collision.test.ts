import { playerIntersectsZone } from '../collision';
import { Player, Zone } from '../types';

const player: Player = {
  x: 100,
  y: 100,
  targetX: 100,
  targetY: 100,
  radius: 14,
  color: 'red',
  invulnerableFrames: 0,
  trail: [],
};

const zone: Zone = {
  active: true,
  x: 140,
  y: 100,
  width: 60,
  height: 30,
  speed: 1,
  color: 'red',
  opacity: 1,
};

describe('playerIntersectsZone', () => {
  it('uses the specified circle-vs-rectangle AABB rule', () => {
    expect(playerIntersectsZone(player, zone)).toBe(true);
    expect(playerIntersectsZone(player, { ...zone, x: 145 })).toBe(false);
  });

  it('ignores inactive zones', () => {
    expect(playerIntersectsZone(player, { ...zone, active: false })).toBe(false);
  });
});
