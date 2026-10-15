import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  effectiveReduceMotion,
  loadSettings,
  parseSettings,
  saveSettings,
  type Settings,
} from './settings.ts';
import type { StorageLike } from './progress.ts';

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('parseSettings', () => {
  it('returns defaults for anything that is not an object', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('nope')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid values and falls back field by field for invalid ones', () => {
    expect(
      parseSettings({ colourBlind: true, largeTouch: 'yes', theme: 'dark', reduceMotion: 1 }),
    ).toEqual({ ...DEFAULT_SETTINGS, colourBlind: true, theme: 'dark' });
  });

  it('rejects unknown themes', () => {
    expect(parseSettings({ theme: 'neon' }).theme).toBe('system');
  });
});

describe('loadSettings and saveSettings', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const chosen: Settings = { colourBlind: true, largeTouch: true, theme: 'light', reduceMotion: true };
    saveSettings(chosen, storage);
    expect(loadSettings(storage)).toEqual(chosen);
  });

  it('falls back to defaults on corrupt JSON, missing storage, or storage that throws', () => {
    const corrupt = memoryStorage();
    corrupt.setItem('sort-puzzle:settings:v1', '{oops');
    expect(loadSettings(corrupt)).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);

    const broken: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(loadSettings(broken)).toEqual(DEFAULT_SETTINGS);
    expect(() => saveSettings(DEFAULT_SETTINGS, broken)).not.toThrow();
  });
});

describe('effectiveReduceMotion', () => {
  it('is on when either the player or the OS asks for it', () => {
    expect(effectiveReduceMotion(DEFAULT_SETTINGS, false)).toBe(false);
    expect(effectiveReduceMotion(DEFAULT_SETTINGS, true)).toBe(true);
    expect(effectiveReduceMotion({ ...DEFAULT_SETTINGS, reduceMotion: true }, false)).toBe(true);
  });
});
