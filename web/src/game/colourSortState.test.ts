import { describe, expect, it } from 'vitest';
import { POUR_MS, colourSortReducer, createState, type ColourSortState } from './colourSortState.ts';
import type { Level } from './level.ts';

const level: Level = {
  colors: 2,
  capacity: 2,
  tubes: [[0, 1], [1, 0], []],
};

function tap(state: ColourSortState, index: number): ColourSortState {
  return colourSortReducer(state, { type: 'tap', index });
}

describe('colourSortReducer', () => {
  it('starts with nothing selected and no moves', () => {
    const state = createState(level);
    expect(state).toMatchObject({ selected: null, moves: 0, pour: null, solved: false });
  });

  it('selects a non-empty tube and ignores an empty one', () => {
    const state = createState(level);
    expect(tap(state, 2).selected).toBeNull();
    expect(tap(state, 0).selected).toBe(0);
  });

  it('deselects when the selected tube is tapped again', () => {
    const selected = tap(createState(level), 0);
    expect(tap(selected, 0).selected).toBeNull();
  });

  it('pours on a legal target, counts a move, and starts a pour event', () => {
    // Tube 0 = [0,1] and tube 2 is empty, so the top 1 pours across.
    const state = tap(tap(createState(level), 0), 2);
    expect(state.tubes).toEqual([[0], [1, 0], [1]]);
    expect(state.selected).toBeNull();
    expect(state.moves).toBe(1);
    expect(state.pour).toEqual({ id: 1, from: 0, to: 2, count: 1, destPrevLen: 0 });
  });

  it('ignores taps while a pour is animating', () => {
    const poured = tap(tap(createState(level), 0), 2);
    expect(tap(poured, 1)).toBe(poured);
  });

  it('clears the pour event on pourEnd', () => {
    const poured = tap(tap(createState(level), 0), 2);
    const ended = colourSortReducer(poured, { type: 'pourEnd' });
    expect(ended.pour).toBeNull();
    expect(ended.tubes).toEqual(poured.tubes);
    expect(POUR_MS).toBeGreaterThan(0);
  });

  it('switches selection to a non-empty tube that rejects the pour', () => {
    // Tube 0 top is 1, tube 1 top is 0, so tube 1 is not a legal target.
    const state = tap(tap(createState(level), 0), 1);
    expect(state.selected).toBe(1);
    expect(state.moves).toBe(0);
  });

  it('reports solved after the last pour and blocks further taps', () => {
    // Pour 1 from tube 2 onto tube 1, then 0 from tube 0 onto tube 2.
    const almost: Level = { colors: 2, capacity: 2, tubes: [[0], [1], [0, 1]] };
    let state = createState(almost);
    state = tap(state, 2);
    state = tap(state, 1);
    expect(state.solved).toBe(false);
    state = colourSortReducer(state, { type: 'pourEnd' });

    state = tap(state, 0);
    state = tap(state, 2);
    expect(state.tubes).toEqual([[], [1, 1], [0, 0]]);
    expect(state.solved).toBe(true);
    expect(tap(state, 1)).toBe(state);
  });

  it('marks an already-sorted level as solved', () => {
    expect(createState({ colors: 1, capacity: 2, tubes: [[0, 0], []] }).solved).toBe(true);
  });

  it('resets to a fresh copy of the level', () => {
    const played = tap(tap(createState(level), 0), 2);
    const reset = colourSortReducer(played, { type: 'reset', level });
    expect(reset).toEqual(createState(level));
  });
});
