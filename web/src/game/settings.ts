import type { StorageLike } from './progress.ts';

// Player options, saved in localStorage. Unknown or invalid values fall back to
// the defaults one field at a time, so an old or hand-edited save can't break the game.

const SETTINGS_KEY = 'sort-puzzle:settings:v1';

export type ThemePref = 'system' | 'light' | 'dark';

export interface Settings {
  /** Shows a shape on every ball, so colours can be told apart without hue. */
  colourBlind: boolean;
  /** Larger tubes and tap targets. */
  largeTouch: boolean;
  theme: ThemePref;
  /** Turns off tilts and drops. The OS "reduce motion" setting also turns this on. */
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  colourBlind: false,
  largeTouch: false,
  theme: 'system',
  reduceMotion: false,
};

const THEMES: readonly ThemePref[] = ['system', 'light', 'dark'];

export function parseSettings(raw: unknown): Settings {
  const data = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    colourBlind: typeof data.colourBlind === 'boolean' ? data.colourBlind : DEFAULT_SETTINGS.colourBlind,
    largeTouch: typeof data.largeTouch === 'boolean' ? data.largeTouch : DEFAULT_SETTINGS.largeTouch,
    theme: THEMES.includes(data.theme as ThemePref) ? (data.theme as ThemePref) : DEFAULT_SETTINGS.theme,
    reduceMotion: typeof data.reduceMotion === 'boolean' ? data.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
  };
}

export function loadSettings(storage: StorageLike | null): Settings {
  try {
    const raw = storage?.getItem(SETTINGS_KEY) ?? null;
    return parseSettings(raw === null ? null : JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings, storage: StorageLike | null): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings then last for this visit only.
  }
}

/** Motion is reduced when the player asks for it or the OS does. */
export function effectiveReduceMotion(settings: Settings, osPrefersReduced: boolean): boolean {
  return settings.reduceMotion || osPrefersReduced;
}

/** Whether the OS asks for reduced motion. False when matchMedia is missing. */
export function osPrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
