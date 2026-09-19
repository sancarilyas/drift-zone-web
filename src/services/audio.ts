import { AudioService, SoundEffect } from '../game/types';

const SOURCES: Record<SoundEffect, string> = {
  correct: 'correct.wav',
  wrong: 'wrong.wav',
  combo: 'combo.wav',
  gameOver: 'game-over.wav',
  shift: 'shift.wav',
};

const MUTE_KEY = 'driftZoneMuted';

export class WebAudioService implements AudioService {
  private context?: AudioContext;
  private readonly buffers = new Map<SoundEffect, AudioBuffer>();
  private muted = false;

  async preload(): Promise<void> {
    this.muted = safeStorageGet(MUTE_KEY) === 'on';
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    this.context = context;
    const base = `${import.meta.env.BASE_URL}audio/`;

    await Promise.all(
      (Object.entries(SOURCES) as [SoundEffect, string][]).map(async ([effect, file]) => {
        const response = await fetch(`${base}${file}`);
        if (!response.ok) throw new Error(`Ses dosyası yüklenemedi: ${file}`);
        const data = await response.arrayBuffer();
        const buffer = await context.decodeAudioData(data);
        this.buffers.set(effect, buffer);
      }),
    ).catch(() => {
      this.buffers.clear();
    });
  }

  play(effect: SoundEffect): void {
    if (this.muted) return;
    const context = this.context;
    if (!context) return;
    if (context.state === 'suspended') {
      void context.resume().then(() => this.playBuffer(effect));
      return;
    }
    this.playBuffer(effect);
  }

  async setActive(active: boolean): Promise<void> {
    const context = this.context;
    if (!context) return;
    try {
      if (active && context.state === 'suspended') await context.resume();
      if (!active && context.state === 'running') await context.suspend();
    } catch {
      // Tarayıcı ses bağlamını askıya almayı reddedebilir; sonraki etkileşimde tekrar denenir.
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? 'on' : 'off');
    } catch {
      // Depolama kapalıysa ses tercihi yalnızca bu oturum için geçerli olur.
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  dispose(): void {
    this.buffers.clear();
    void this.context?.close();
    this.context = undefined;
  }

  private playBuffer(effect: SoundEffect): void {
    const context = this.context;
    if (!context || this.muted) return;
    const buffer = this.buffers.get(effect);
    if (!buffer) return;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const gain = context.createGain();
    gain.gain.value = effect === 'wrong' ? 0.6 : 0.75;
    source.connect(gain);
    gain.connect(context.destination);
    source.start();
  }
}

function safeStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
