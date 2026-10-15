import { describe, expect, it } from 'vitest';
import { applyMove, DIFFICULTY_TIERS, generateLevel, isSolved } from './level.ts';
import { solve } from './solver.ts';

describe('solve', () => {
  it('finds a solution for a hand-written level', () => {
    // Capacity 2, one spare. Tube 0 holds [0,1] and tube 1 holds [1,0].
    const tubes = [
      [0, 1],
      [1, 0],
      [],
    ];
    const result = solve(tubes, 2);
    expect(result.status).toBe('solved');
    if (result.status !== 'solved') return;

    const final = result.moves.reduce((state, [from, to]) => applyMove(state, 2, from, to), tubes);
    expect(isSolved(final, 2)).toBe(true);
  });

  it('reports unsolvable when no move is legal', () => {
    // No spare tube, and the tops of both tubes differ.
    const result = solve(
      [
        [0, 1],
        [1, 0],
      ],
      2,
    );
    expect(result).toEqual({ status: 'unsolvable' });
  });

  it('reports budget-exceeded instead of guessing when the search is cut short', () => {
    const level = generateLevel(DIFFICULTY_TIERS.expert, 'budget');
    const result = solve(level.tubes, level.capacity, 1);
    expect(result.status).toBe('budget-exceeded');
  });

  it('does not modify the tubes it is given', () => {
    const tubes = [
      [0, 1],
      [1, 0],
      [],
    ];
    const snapshot = JSON.stringify(tubes);
    solve(tubes, 2);
    expect(JSON.stringify(tubes)).toBe(snapshot);
  });
});

describe('applyMove', () => {
  it('moves the top ball onto an empty tube', () => {
    expect(applyMove([[0, 1], []], 2, 0, 1)).toEqual([[0], [1]]);
  });

  it('moves the top ball onto a matching top', () => {
    expect(applyMove([[0, 1], [1]], 2, 0, 1)).toEqual([[0], [1, 1]]);
  });

  it('rejects a move onto a different colour', () => {
    expect(() => applyMove([[0, 1], [0]], 2, 0, 1)).toThrow(RangeError);
  });

  it('rejects a move onto a full tube', () => {
    expect(() => applyMove([[0], [1, 1]], 2, 0, 1)).toThrow(RangeError);
  });

  it('rejects a move from an empty tube or to the same tube', () => {
    expect(() => applyMove([[], [0]], 2, 0, 1)).toThrow(RangeError);
    expect(() => applyMove([[0]], 2, 0, 0)).toThrow(RangeError);
  });
});
