import { Player, Zone } from './types';

export function playerIntersectsZone(player: Player, zone: Zone): boolean {
  if (!zone.active) return false;

  return (
    Math.abs(player.x - zone.x) < zone.width / 2 + player.radius &&
    Math.abs(player.y - zone.y) < zone.height / 2 + player.radius
  );
}
