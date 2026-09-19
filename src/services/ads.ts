import { AdGateway } from '../game/types';
import { canShowInterstitial } from './adPolicy';

interface AdBreakInfo {
  breakStatus: string;
  breakType?: string;
  breakName?: string;
}

interface AdBreakOptions {
  type: 'next' | 'reward' | 'start' | 'browse';
  name: string;
  beforeAd?: () => void;
  afterAd?: () => void;
  beforeReward?: (showAdFn: () => void) => void;
  adDismissed?: () => void;
  adViewed?: () => void;
  adBreakDone?: (info: AdBreakInfo) => void;
}

interface PreloadOptions {
  preloadAdBreaks: 'on';
  sound: 'on' | 'off';
  onReady?: () => void;
  onError?: (error: unknown) => void;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
    adConfig?: (options: PreloadOptions) => void;
    adBreak?: (options: AdBreakOptions) => void;
  }
}

const DEFAULT_ADSENSE_CLIENT = 'ca-pub-2909351126728508';

export const adSettings = {
  client: (import.meta.env.VITE_ADSENSE_CLIENT ?? DEFAULT_ADSENSE_CLIENT).trim(),
  slotTop: (import.meta.env.VITE_ADSENSE_SLOT_TOP ?? '').trim(),
  slotBottom: (import.meta.env.VITE_ADSENSE_SLOT_BOTTOM ?? '').trim(),
  h5Enabled: import.meta.env.VITE_H5_GAMES_ADS === 'on',
  testMode: import.meta.env.VITE_ADSENSE_TEST === 'on',
};

let adsScriptPromise: Promise<void> | undefined;

function ensureAdsScript(): Promise<void> {
  if (!adSettings.client) return Promise.resolve();
  if (!adsScriptPromise) {
    adsScriptPromise = new Promise((resolve) => {
      window.adsbygoogle = window.adsbygoogle ?? [];
      if (document.querySelector('script[src*="adsbygoogle.js"]')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.driftZoneAds = 'true';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adSettings.client)}`;
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => resolve(), { once: true });
      document.head.appendChild(script);
    });
  }
  return adsScriptPromise;
}

export function mountAdSlot(container: HTMLElement, slotId: string): void {
  container.textContent = '';
  if (!adSettings.client || !slotId) {
    if (import.meta.env.PROD) {
      container.hidden = true;
      return;
    }
    container.classList.add('is-placeholder');
    const label = document.createElement('span');
    label.textContent = 'Reklam alanı';
    const hint = document.createElement('small');
    hint.textContent = 'Yayın için AdSense kimliği ve slot numarası gerekir · Kurulum: README.md';
    container.append(label, hint);
    return;
  }

  container.classList.remove('is-placeholder');
  const ad = document.createElement('ins');
  ad.className = 'adsbygoogle';
  ad.style.display = 'block';
  ad.dataset.adClient = adSettings.client;
  ad.dataset.adSlot = slotId;
  ad.dataset.adFormat = 'auto';
  ad.dataset.fullWidthResponsive = 'true';
  if (adSettings.testMode) ad.dataset.adtest = 'on';
  container.appendChild(ad);

  void ensureAdsScript().then(() => {
    (window.adsbygoogle = window.adsbygoogle ?? []).push({});
  });
}

export interface AdHooks {
  onBreakStart?: () => void;
  onBreakEnd?: () => void;
}

export class WebAdsService implements AdGateway {
  private h5Ready = false;
  private hooks: AdHooks = {};
  private breakActive = false;
  private lastInterstitialAt = 0;

  setHooks(hooks: AdHooks): void {
    this.hooks = hooks;
  }

  async initialize(): Promise<void> {
    if (!adSettings.client || !adSettings.h5Enabled) return;
    await ensureAdsScript();

    const push = (options: Record<string, unknown>): void => {
      (window.adsbygoogle = window.adsbygoogle ?? []).push(options);
    };
    window.adConfig = push as unknown as Window['adConfig'];
    window.adBreak = push as unknown as Window['adBreak'];

    push({
      preloadAdBreaks: 'on',
      sound: 'on',
      onReady: () => {
        this.h5Ready = true;
      },
      onError: () => {
        this.h5Ready = false;
      },
    });
  }

  isRewardedReady(): boolean {
    return this.h5Ready;
  }

  async showRewarded(name = 'rewarded'): Promise<boolean> {
    if (!this.h5Ready || !window.adBreak) return false;
    const adBreak = window.adBreak;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      let earned = false;
      const finish = (value: boolean): void => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      adBreak({
        type: 'reward',
        name,
        beforeAd: () => this.beginBreak(),
        afterAd: () => this.endBreak(),
        beforeReward: (showAdFn) => showAdFn(),
        adViewed: () => {
          earned = true;
        },
        adDismissed: () => {
          this.endBreak();
          finish(false);
        },
        adBreakDone: () => {
          this.endBreak();
          finish(earned);
        },
      });
    });
  }

  shouldShowInterstitial(completedRuns: number, now: number): boolean {
    return canShowInterstitial(completedRuns, now, this.lastInterstitialAt, this.h5Ready);
  }

  async showInterstitial(): Promise<boolean> {
    if (!this.h5Ready || !window.adBreak) return false;
    const adBreak = window.adBreak;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (value: boolean): void => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      adBreak({
        type: 'next',
        name: 'run-end',
        beforeAd: () => this.beginBreak(),
        afterAd: () => this.endBreak(),
        adBreakDone: (info) => {
          this.endBreak();
          if (info.breakStatus === 'viewed') this.lastInterstitialAt = Date.now();
          finish(info.breakStatus === 'viewed');
        },
      });
    });
  }

  async showPrivacyOptions(): Promise<void> {
    window.open('privacy.html', '_blank', 'noopener');
  }

  dispose(): void {
    this.hooks = {};
  }

  private beginBreak(): void {
    if (this.breakActive) return;
    this.breakActive = true;
    this.hooks.onBreakStart?.();
  }

  private endBreak(): void {
    if (!this.breakActive) return;
    this.breakActive = false;
    this.hooks.onBreakEnd?.();
  }
}
