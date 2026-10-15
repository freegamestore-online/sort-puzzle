import { describe, expect, it } from 'vitest';
import { pour, pourAmount, topRunLength } from './pour.ts';

describe('topRunLength', () => {
  it('counts the balls sharing the top colour', () => {
    expect(topRunLength([])).toBe(0);
    expect(topRunLength([0, 1, 1])).toBe(2);
    expect(topRunLength([1, 1, 0])).toBe(1);
    expect(topRunLength([2, 2, 2, 2])).toBe(4);
  });
});

describe('pour', () => {
  it('pours the whole top run onto an empty tube', () => {
    const result = pour([[0, 1, 1], []], 4, 0, 1);
    expect(result).toEqual({ tubes: [[0], [1, 1]], count: 2 });
  });

  it('pours onto a matching top colour', () => {
    const result = pour([[0, 2], [2, 2]], 4, 0, 1);
    expect(result).toEqual({ tubes: [[0], [2, 2, 2]], count: 1 });
  });

  it('caps the amount at the free space in the target', () => {
    const result = pour([[0, 1, 1, 1], [1, 1, 1]], 4, 0, 1);
    expect(result).toEqual({ tubes: [[0, 1, 1], [1, 1, 1, 1]], count: 1 });
  });

  it('rejects a different top colour', () => {
    expect(pour([[0, 1], [0]], 4, 0, 1)).toBeNull();
  });

  it('rejects a full target', () => {
    expect(pour([[0], [1, 1]], 2, 0, 1)).toBeNull();
  });

  it('rejects pouring from an empty tube or onto itself', () => {
    expect(pour([[], [0]], 4, 0, 1)).toBeNull();
    expect(pour([[0, 1]], 4, 0, 0)).toBeNull();
  });

  it('rejects a single-colour tube onto an empty tube, since nothing changes', () => {
    expect(pour([[0, 0], []], 4, 0, 1)).toBeNull();
  });

  it('does not mutate its input', () => {
    const tubes = [[0, 1], [1]];
    const snapshot = JSON.stringify(tubes);
    pour(tubes, 4, 0, 1);
    expect(JSON.stringify(tubes)).toBe(snapshot);
  });

  it('reports the amount that pourAmount predicts', () => {
    const tubes = [[0, 1, 1], [1], []];
    expect(pourAmount(tubes, 4, 0, 1)).toBe(2);
    expect(pour(tubes, 4, 0, 1)?.count).toBe(2);
  });
});
