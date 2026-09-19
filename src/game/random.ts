import { RandomSource } from './types';

export const systemRandom: RandomSource = {
  next: () => Math.random(),
};

export class SeededRandom implements RandomSource {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0x100000000;
  }
}
