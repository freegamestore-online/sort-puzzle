import { createRng } from './rng.ts';

// A tube is a stack of colour indices, bottom first. Colours are 0..colors-1.
export type Tube = number[];

export interface Level {
  colors: number;
  capacity: number;
  tubes: Tube[];
}

export interface Difficulty {
  /** Number of colours; each colour has exactly `capacity` balls. */
  colors: number;
  /** Balls a tube holds. */
  capacity: number;
  /** Empty tubes on top of one tube per colour. Fewer spares means harder. */
  spareTubes: number;
}

// Each tier adds colours and drops spare tubes. Total tubes = colors + spareTubes.
export const DIFFICULTY_TIERS = {
  easy: { colors: 3, capacity: 4, spareTubes: 2 },
  medium: { colors: 5, capacity: 4, spareTubes: 2 },
  hard: { colors: 7, capacity: 4, spareTubes: 1 },
  expert: { colors: 9, capacity: 4, spareTubes: 1 },
} as const satisfies Record<string, Difficulty>;

export type DifficultyName = keyof typeof DIFFICULTY_TIERS;

/** A tube is solved when it is empty or full of one colour. */
export function isSolved(tubes: readonly Tube[], capacity: number): boolean {
  return tubes.every((tube) => {
    if (tube.length === 0) return true;
    const first = tube[0];
    return tube.length === capacity && tube.every((ball) => ball === first);
  });
}

/**
 * Returns the tube-index pairs [from, to] for every legal move in `tubes`.
 * A move takes the top ball of `from` and puts it on `to`, which must have room
 * and either be empty or have the same colour on top.
 */
export function legalMoves(tubes: readonly Tube[], capacity: number): Array<[number, number]> {
  const moves: Array<[number, number]> = [];
  tubes.forEach((from, fromIndex) => {
    const ball = from[from.length - 1];
    if (ball === undefined) return;
    tubes.forEach((to, toIndex) => {
      if (fromIndex === toIndex || to.length >= capacity) return;
      const top = to[to.length - 1];
      if (top === undefined || top === ball) moves.push([fromIndex, toIndex]);
    });
  });
  return moves;
}

/** Returns new tubes with one forward move applied. Throws if the move is illegal. */
export function applyMove(tubes: readonly Tube[], capacity: number, from: number, to: number): Tube[] {
  if (from === to) throw new RangeError(`illegal move ${from} -> ${to}`);
  const next = tubes.map((tube) => [...tube]);
  const ball = next[from]?.pop();
  const target = next[to];
  if (ball === undefined || target === undefined || target.length >= capacity) {
    throw new RangeError(`illegal move ${from} -> ${to}`);
  }
  const top = target[target.length - 1];
  if (top !== undefined && top !== ball) throw new RangeError(`illegal move ${from} -> ${to}`);
  target.push(ball);
  return next;
}

/**
 * Builds a solvable level from a seed by starting at the solved state and
 * applying `scrambleSteps` random reverse moves. Every reverse move is the
 * inverse of a legal forward move, so the level is solvable by construction.
 * The solver in `solver.ts` checks this in tests.
 */
export function generateLevel(difficulty: Difficulty, seed: string): Level {
  const { colors, capacity, spareTubes } = difficulty;
  const rng = createRng(seed);

  const tubes: Tube[] = [];
  for (let color = 0; color < colors; color++) {
    tubes.push(Array.from({ length: capacity }, () => color));
  }
  for (let spare = 0; spare < spareTubes; spare++) tubes.push([]);

  const scrambleSteps = colors * capacity * 20;
  for (let step = 0; step < scrambleSteps || isSolved(tubes, capacity); step++) {
    const reverse = reverseMoves(tubes, capacity);
    if (reverse.length === 0) break;
    const [from, to] = rng.pick(reverse);
    tubes[to]!.push(tubes[from]!.pop()!);
  }

  return { colors, capacity, tubes };
}

/**
 * A reverse move takes the top ball of `from` and puts it on `to`, but only when
 * the forward move (to -> from) would be legal afterwards. That means `from` is
 * left empty or with the same colour on top.
 */
function reverseMoves(tubes: readonly Tube[], capacity: number): Array<[number, number]> {
  const moves: Array<[number, number]> = [];
  tubes.forEach((from, fromIndex) => {
    const ball = from[from.length - 1];
    if (ball === undefined) return;
    const below = from[from.length - 2];
    if (below !== undefined && below !== ball) return;
    tubes.forEach((to, toIndex) => {
      if (fromIndex !== toIndex && to.length < capacity) moves.push([fromIndex, toIndex]);
    });
  });
  return moves;
}

/** Daily puzzle key: the UTC calendar date as YYYY-MM-DD. */
export function dailyKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Seed for the daily puzzle, based on the UTC calendar date. */
export function dailySeed(date: Date = new Date()): string {
  return `sort-puzzle:daily:${dailyKey(date)}`;
}

export function dailyLevel(date: Date = new Date(), difficulty: Difficulty = DIFFICULTY_TIERS.medium): Level {
  return generateLevel(difficulty, dailySeed(date));
}
