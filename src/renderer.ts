import { COLORS, DESIGN_HEIGHT, DESIGN_WIDTH } from './game/config';
import { GameState } from './game/types';

export function renderGame(
  context: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
): void {
  const scaleX = width / DESIGN_WIDTH;
  const scaleY = height / DESIGN_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  const shakeX = state.shake ? Math.sin(state.frame * 2.17) * state.shake * scaleX * 0.45 : 0;
  const shakeY = state.shake ? Math.cos(state.frame * 1.73) * state.shake * scaleY * 0.35 : 0;
  const playerVisible =
    state.player.invulnerableFrames === 0 ||
    Math.floor(state.player.invulnerableFrames / 4) % 2 === 0;

  context.clearRect(0, 0, width, height);

  const background = context.createRadialGradient(
    width * 0.5,
    height * 0.72,
    0,
    width * 0.5,
    height * 0.72,
    Math.max(width, height) * 0.85,
  );
  background.addColorStop(0, '#17284a');
  background.addColorStop(0.5, '#080d1d');
  background.addColorStop(1, '#03050d');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.14;
  context.strokeStyle = '#65a5ff';
  context.lineWidth = 0.6;
  for (let index = 0; index < 10; index += 1) {
    const x = (width / 9) * index;
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let index = 0; index < 18; index += 1) {
    const y = (height / 17) * index;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }
  context.restore();

  context.save();
  context.translate(shakeX, shakeY);

  for (const zone of state.zones) {
    if (!zone.active) continue;
    const palette = COLORS[zone.color];
    const zoneWidth = zone.width * scaleX;
    const zoneHeight = zone.height * scaleY;
    const x = zone.x * scaleX - zoneWidth / 2;
    const y = zone.y * scaleY - zoneHeight / 2;
    context.save();
    context.globalAlpha = zone.opacity;
    const gradient = context.createLinearGradient(x, y, x, y + zoneHeight);
    gradient.addColorStop(0, palette.light);
    gradient.addColorStop(0.5, palette.main);
    gradient.addColorStop(1, palette.dark);
    context.fillStyle = gradient;
    context.shadowColor = palette.glow;
    context.shadowBlur = 16 * scale;
    context.shadowOffsetY = 3 * scale;
    roundedRect(context, x, y, zoneWidth, zoneHeight, 8 * scale);
    context.fill();
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    context.fillStyle = 'rgba(255,255,255,0.65)';
    roundedRect(
      context,
      x + 5 * scale,
      y + 4 * scale,
      Math.max(1, zoneWidth - 10 * scale),
      2 * scale,
      1 * scale,
    );
    context.fill();
    context.restore();
  }

  context.fillStyle = COLORS[state.player.color].main;
  for (const point of state.player.trail) {
    const radius = state.player.radius * scale * point.life * 0.8;
    if (radius <= 0) continue;
    context.globalAlpha = Math.max(0, point.life) * 0.3;
    context.beginPath();
    context.arc(point.x * scaleX, point.y * scaleY, radius, 0, Math.PI * 2);
    context.fill();
  }

  for (const particle of state.particles) {
    if (!particle.active) continue;
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = COLORS[particle.color].light;
    context.beginPath();
    context.arc(
      particle.x * scaleX,
      particle.y * scaleY,
      Math.max(0.5, particle.radius * scale * particle.life),
      0,
      Math.PI * 2,
    );
    context.fill();
  }
  context.globalAlpha = 1;

  if (playerVisible) {
    const centerX = state.player.x * scaleX;
    const centerY = state.player.y * scaleY;
    const palette = COLORS[state.player.color];
    const playerRadius = state.player.radius * scale;

    context.globalAlpha = 0.16;
    context.fillStyle = palette.glow;
    context.beginPath();
    context.arc(
      centerX,
      centerY,
      (state.player.radius + 10 + Math.sin(state.frame / 8) * 2) * scale,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.globalAlpha = 1;

    const playerGradient = context.createRadialGradient(
      centerX - 5 * scale,
      centerY - 6 * scale,
      0,
      centerX - 5 * scale,
      centerY - 6 * scale,
      playerRadius * 1.6,
    );
    playerGradient.addColorStop(0, '#ffffff');
    playerGradient.addColorStop(0.5, palette.light);
    playerGradient.addColorStop(1, palette.dark);
    context.fillStyle = playerGradient;
    context.shadowColor = palette.glow;
    context.shadowBlur = 13 * scale;
    context.shadowOffsetY = 2 * scale;
    context.beginPath();
    context.arc(centerX, centerY, playerRadius, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
  }

  context.restore();

  if (state.flashFrames > 0) {
    context.globalAlpha = Math.min(0.35, state.flashFrames * 0.04);
    context.fillStyle = state.combo > 0 ? '#ffffff' : '#ff1e3c';
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;
  }
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const safeRadius = Math.max(0, Math.min(radius, safeWidth / 2, safeHeight / 2));
  context.beginPath();
  context.roundRect(x, y, safeWidth, safeHeight, safeRadius);
}
