import { describe, expect, it } from 'vitest';
import {
  applyMove,
  DIFFICULTY_TIERS,
  type Difficulty,
  type DifficultyName,
  generateLevel,
  dailyLevel,
  dailySeed,
  isSolved,
} from './level.ts';
import { createRng } from './rng.ts';
import { solve } from './solver.ts';

const SEEDS_PER_TIER = 40;
const tierNames = Object.keys(DIFFICULTY_TIERS) as DifficultyName[];

describe('createRng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = createRng('sort-puzzle:daily:2026-10-15');
    const b = createRng('sort-puzzle:daily:2026-10-15');
    const seqA = Array.from({ length: 50 }, () => a.int(1000));
    const seqB = Array.from({ length: 50 }, () => b.int(1000));
    expect(seqA).toEqual(seqB);
  });

  it('gives different sequences for different seeds', () => {
    const a = createRng('seed-a');
    const b = createRng('seed-b');
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('returns floats in [0, 1)', () => {
    const rng = createRng('range');
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('generateLevel', () => {
  for (const name of tierNames) {
    const difficulty: Difficulty = DIFFICULTY_TIERS[name];

    describe(`${name} tier`, () => {
      it('has the configured colours, tubes and balls', () => {
        for (let s = 0; s < SEEDS_PER_TIER; s++) {
          const level = generateLevel(difficulty, `shape-${name}-${s}`);
          expect(level.colors).toBe(difficulty.colors);
          expect(level.capacity).toBe(difficulty.capacity);
          expect(level.tubes).toHaveLength(difficulty.colors + difficulty.spareTubes);

          const counts = new Map<number, number>();
          for (const tube of level.tubes) {
            expect(tube.length).toBeLessThanOrEqual(difficulty.capacity);
            for (const ball of tube) counts.set(ball, (counts.get(ball) ?? 0) + 1);
          }
          expect(counts.size).toBe(difficulty.colors);
          for (const count of counts.values()) expect(count).toBe(difficulty.capacity);
        }
      });

      it('starts unsolved and is solvable with a legal move sequence', () => {
        for (let s = 0; s < SEEDS_PER_TIER; s++) {
          const level = generateLevel(difficulty, `solve-${name}-${s}`);
          expect(isSolved(level.tubes, level.capacity)).toBe(false);

          const result = solve(level.tubes, level.capacity);
          expect(result.status).toBe('solved');
          if (result.status !== 'solved') continue;

          const finalTubes = result.moves.reduce(
            (tubes, [from, to]) => applyMove(tubes, level.capacity, from, to),
            level.tubes,
          );
          expect(isSolved(finalTubes, level.capacity)).toBe(true);
        }
      });

      it('is reproducible from its seed', () => {
        const first = generateLevel(difficulty, `repeat-${name}`);
        const second = generateLevel(difficulty, `repeat-${name}`);
        expect(second).toEqual(first);
      });
    });
  }

  it('has zero unsolvable levels across all tiers', () => {
    const unsolvable: string[] = [];
    const unknown: string[] = [];
    for (const name of tierNames) {
      for (let s = 0; s < SEEDS_PER_TIER; s++) {
        const level = generateLevel(DIFFICULTY_TIERS[name], `audit-${name}-${s}`);
        const result = solve(level.tubes, level.capacity);
        if (result.status === 'unsolvable') unsolvable.push(`${name}/${s}`);
        if (result.status === 'budget-exceeded') unknown.push(`${name}/${s}`);
      }
    }
    expect(unsolvable).toEqual([]);
    expect(unknown).toEqual([]);
  });

  it('gives varied levels within a tier', () => {
    const keys = new Set<string>();
    for (let s = 0; s < SEEDS_PER_TIER; s++) {
      keys.add(JSON.stringify(generateLevel(DIFFICULTY_TIERS.hard, `vary-${s}`).tubes));
    }
    expect(keys.size).toBeGreaterThan(SEEDS_PER_TIER - 2);
  });
});

describe('daily puzzle', () => {
  it('seeds from the UTC calendar date', () => {
    expect(dailySeed(new Date('2026-10-15T00:00:00Z'))).toBe('sort-puzzle:daily:2026-10-15');
    expect(dailySeed(new Date('2026-10-15T23:59:59Z'))).toBe('sort-puzzle:daily:2026-10-15');
    expect(dailySeed(new Date('2026-10-16T00:00:00Z'))).toBe('sort-puzzle:daily:2026-10-16');
  });

  it('reproduces the same level for every instant on one UTC day', () => {
    const morning = dailyLevel(new Date('2026-10-15T00:00:00Z'));
    const night = dailyLevel(new Date('2026-10-15T23:59:59Z'));
    expect(night).toEqual(morning);
  });

  it('gives a different level on the next day', () => {
    const today = dailyLevel(new Date('2026-10-15T12:00:00Z'));
    const tomorrow = dailyLevel(new Date('2026-10-16T12:00:00Z'));
    expect(tomorrow.tubes).not.toEqual(today.tubes);
  });
});
