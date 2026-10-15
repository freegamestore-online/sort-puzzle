import { describe, expect, it } from 'vitest';
import { createState, colourSortReducer, type ColourSortState } from './colourSortState.ts';
import { generateLevel, DIFFICULTY_TIERS, type Level } from './level.ts';
import { createRng } from './rng.ts';
import {
  loadBestMoves,
  restoreState,
  saveBestMoves,
  saveState,
  type StorageLike,
} from './progress.ts';

const DATE = '2026-10-15';
const KEY = 'sort-puzzle:progress:v1';

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

/** Plays `steps` random taps (and extra-tube uses) and returns the state. */
function playSome(level: Level, steps: number, seed: string): ColourSortState {
  const rng = createRng(seed);
  let state = createState(level);
  for (let i = 0; i < steps && !state.solved; i++) {
    if (rng.next() < 0.1) {
      state = colourSortReducer(state, { type: 'extraTube' });
    } else {
      state = colourSortReducer(state, { type: 'tap', index: rng.int(state.tubes.length) });
    }
    if (state.pour) state = colourSortReducer(state, { type: 'pourEnd' });
  }
  return state;
}

const level = generateLevel(DIFFICULTY_TIERS.medium, 'progress-test');

describe('save and restore', () => {
  it('restores the same game after a reload', () => {
    const storage = memoryStorage();
    const played = playSome(level, 25, 'resume');
    expect(played.history.length).toBeGreaterThan(0);

    saveState(played, DATE, storage);
    const restored = restoreState(level, DATE, storage);

    expect(restored.tubes).toEqual(played.tubes);
    expect(restored.moves).toBe(played.moves);
    expect(restored.extraTubeUsed).toBe(played.extraTubeUsed);
    expect(restored.history).toEqual(played.history);
    expect(restored.solved).toBe(played.solved);
    // Transient UI state never comes back from storage.
    expect(restored.selected).toBeNull();
    expect(restored.pour).toBeNull();
  });

  it('keeps undo working after a reload', () => {
    const storage = memoryStorage();
    const played = playSome(level, 15, 'undo-after-reload');
    saveState(played, DATE, storage);
    const undone = colourSortReducer(restoreState(level, DATE, storage), { type: 'undo' });
    expect(undone.moves).toBe(Math.max(0, played.moves - 1));
  });

  it('starts fresh when nothing is saved', () => {
    expect(restoreState(level, DATE, memoryStorage())).toEqual(createState(level));
  });

  it('ignores a save from another day', () => {
    const storage = memoryStorage();
    saveState(playSome(level, 10, 'yesterday'), '2026-10-14', storage);
    expect(restoreState(level, DATE, storage)).toEqual(createState(level));
  });

  it('ignores a save for a different level', () => {
    const storage = memoryStorage();
    saveState(playSome(level, 10, 'other'), DATE, storage);
    const other = generateLevel(DIFFICULTY_TIERS.hard, 'progress-test-other');
    expect(restoreState(other, DATE, storage)).toEqual(createState(other));
  });

  it('ignores corrupt or tampered saves', () => {
    const fresh = createState(level);

    const corrupt = memoryStorage();
    corrupt.setItem(KEY, '{not json');
    expect(restoreState(level, DATE, corrupt)).toEqual(fresh);

    const tampered = memoryStorage();
    const played = playSome(level, 10, 'tamper');
    saveState({ ...played, tubes: [[0, 0, 0, 0, 0], ...played.tubes.slice(1)] }, DATE, tampered);
    expect(restoreState(level, DATE, tampered)).toEqual(fresh);

    const wrongTubeCount = memoryStorage();
    saveState({ ...played, tubes: played.tubes.slice(1), extraTubeUsed: false }, DATE, wrongTubeCount);
    expect(restoreState(level, DATE, wrongTubeCount)).toEqual(fresh);
  });

  it('works without storage, and tolerates storage that throws', () => {
    const fresh = createState(level);
    expect(restoreState(level, DATE, null)).toEqual(fresh);
    expect(() => saveState(playSome(level, 5, 'null'), DATE, null)).not.toThrow();

    const broken: StorageLike = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
    };
    expect(() => saveState(fresh, DATE, broken)).not.toThrow();
    expect(restoreState(level, DATE, broken)).toEqual(fresh);
  });
});

describe('best moves for the day', () => {
  it('saves and loads the fewest moves posted for a day', () => {
    const storage = memoryStorage();
    expect(loadBestMoves(DATE, storage)).toBeNull();
    saveBestMoves(DATE, 14, storage);
    expect(loadBestMoves(DATE, storage)).toBe(14);
    expect(loadBestMoves('2026-10-16', storage)).toBeNull();
  });

  it('ignores a stored value that is not a move count', () => {
    const storage = memoryStorage();
    storage.setItem(`sort-puzzle:best:v1:${DATE}`, 'banana');
    expect(loadBestMoves(DATE, storage)).toBeNull();
  });
});
