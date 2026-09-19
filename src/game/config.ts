import { ColorId, DifficultyConfig } from './types';

export const DESIGN_WIDTH = 360;
export const DESIGN_HEIGHT = 800;
export const FIXED_STEP_MS = 1000 / 60;
export const PLAYER_RADIUS = 14;
export const MAX_ZONES = 20;
export const MAX_PARTICLES = 150;
export const STARTING_LIVES = 3;

export const COLORS: Record<
  ColorId,
  { main: string; light: string; dark: string; glow: string }
> = {
  red: { main: '#ff4060', light: '#ff8099', dark: '#8f132d', glow: '#ff4060' },
  blue: { main: '#4080ff', light: '#80b3ff', dark: '#17489f', glow: '#4080ff' },
  green: { main: '#40d070', light: '#80f0a0', dark: '#177a3a', glow: '#40d070' },
  yellow: { main: '#ffb030', light: '#ffd080', dark: '#a36508', glow: '#ffb030' },
  purple: { main: '#a050f0', light: '#c8a0f8', dark: '#5f209e', glow: '#a050f0' },
};

export function difficultyForScore(score: number): DifficultyConfig {
  const level = Math.min(8, Math.floor(score / 200) + 1);
  const availableColors: ColorId[] = ['red', 'blue', 'green'];

  if (level >= 3) availableColors.push('yellow');
  if (level >= 6) availableColors.push('purple');

  return {
    level,
    availableColors,
    spawnIntervalFrames: Math.max(20, 50 - level * 3),
  };
}
