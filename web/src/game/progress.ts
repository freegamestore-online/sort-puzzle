import { isSolved, type Level, type Tube } from './level.ts';
import { createState, type ColourSortState, type Snapshot } from './colourSortState.ts';

// Progress for the daily puzzle lives in localStorage, so it survives a reload.
// Nothing here is sent anywhere except the leaderboard score (see leaderboard.ts).

const PROGRESS_KEY = 'sort-puzzle:progress:v1';
const BEST_KEY_PREFIX = 'sort-puzzle:best:v1:';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage, or null where it is blocked (some privacy modes throw on access). */
export function defaultStorage(): StorageLike | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

interface SavedProgress {
  date: string;
  moves: number;
  extraTubeUsed: boolean;
  tubes: Tube[];
  history: Snapshot[];
}

/** Each colour must appear exactly `capacity` times across the tubes. */
function hasBallCounts(tubes: Tube[], level: Level): boolean {
  const counts = new Array<number>(level.colors).fill(0);
  for (const tube of tubes) {
    if (tube.length > level.capacity) return false;
    for (const ball of tube) {
      if (!Number.isInteger(ball) || ball < 0 || ball >= level.colors) return false;
      counts[ball]! += 1;
    }
  }
  return counts.every((count) => count === level.capacity);
}

function isSnapshot(value: unknown, level: Level): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;
  const snap = value as Snapshot;
  return (
    Array.isArray(snap.tubes) &&
    snap.tubes.every(Array.isArray) &&
    hasBallCounts(snap.tubes, level) &&
    Number.isInteger(snap.moves) &&
    snap.moves >= 0 &&
    typeof snap.extraTubeUsed === 'boolean'
  );
}

function parseProgress(raw: string | null, date: string, level: Level): SavedProgress | null {
  if (raw === null) return null;
  try {
    const data = JSON.parse(raw) as Partial<SavedProgress>;
    if (data.date !== date) return null;
    if (!Array.isArray(data.history) || !data.history.every((s) => isSnapshot(s, level))) return null;
    if (!isSnapshot(data, level)) return null;
    const expectedTubes = level.tubes.length + (data.extraTubeUsed ? 1 : 0);
    if (data.tubes!.length !== expectedTubes) return null;
    return data as SavedProgress;
  } catch {
    return null;
  }
}

/**
 * Restores the in-progress daily game, if one was saved for `date` and is still
 * valid for `level`. Anything corrupt or from another day is ignored.
 */
export function restoreState(level: Level, date: string, storage: StorageLike | null): ColourSortState {
  const fresh = createState(level);
  let raw: string | null = null;
  try {
    raw = storage?.getItem(PROGRESS_KEY) ?? null;
  } catch {
    return fresh; // Storage blocked: start fresh rather than crash.
  }
  const saved = parseProgress(raw, date, level);
  if (!saved) return fresh;
  return {
    ...fresh,
    tubes: saved.tubes,
    moves: saved.moves,
    extraTubeUsed: saved.extraTubeUsed,
    history: saved.history,
    solved: isSolved(saved.tubes, level.capacity),
  };
}

/** Saves the in-progress game for `date`. Storage errors are ignored. */
export function saveState(state: ColourSortState, date: string, storage: StorageLike | null): void {
  const saved: SavedProgress = {
    date,
    moves: state.moves,
    extraTubeUsed: state.extraTubeUsed,
    tubes: state.tubes,
    history: state.history,
  };
  try {
    storage?.setItem(PROGRESS_KEY, JSON.stringify(saved));
  } catch {
    // Quota or privacy-mode errors: the game still works, it just won't resume.
  }
}

/** Fewest moves already posted for `date`, or null if none. */
export function loadBestMoves(date: string, storage: StorageLike | null): number | null {
  try {
    const raw = storage?.getItem(BEST_KEY_PREFIX + date);
    if (raw === null || raw === undefined) return null;
    const value = Number(raw);
    return Number.isInteger(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveBestMoves(date: string, moves: number, storage: StorageLike | null): void {
  try {
    storage?.setItem(BEST_KEY_PREFIX + date, String(moves));
  } catch {
    // Without this, the score may be posted again on the next visit. Harmless.
  }
}
