import { describe, expect, it } from 'vitest';
import { describeChange } from './a11y.ts';
import { colourSortReducer, createState, type ColourSortState } from './colourSortState.ts';
import type { Level } from './level.ts';

const level: Level = { colors: 2, capacity: 2, tubes: [[0, 1], [1, 0], []] };

function tap(state: ColourSortState, index: number): ColourSortState {
  return colourSortReducer(state, { type: 'tap', index });
}

function settle(state: ColourSortState): ColourSortState {
  return state.pour ? colourSortReducer(state, { type: 'pourEnd' }) : state;
}

describe('describeChange', () => {
  it('announces a selection with a 1-based tube number and the top colour', () => {
    const next = tap(createState(level), 0);
    expect(describeChange(createState(level), next)).toEqual({
      kind: 'select',
      text: 'Tube 1 selected, 2 balls, top blue.',
    });
  });

  it('announces a pour with the colour, count, and both tube numbers', () => {
    const before = tap(createState(level), 0);
    const after = tap(before, 2);
    expect(describeChange(before, after)).toEqual({
      kind: 'pour',
      text: 'Poured 1 blue ball from tube 1 to tube 3.',
    });
  });

  it('announces an illegal target and the new selection', () => {
    // Tube 1 top is 0, tube 2 top is 1, so tapping tube 2 after tube 1 is illegal.
    const before = tap(createState(level), 0);
    const after = tap(before, 1);
    expect(describeChange(before, after)).toEqual({
      kind: 'invalid',
      text: "Can't pour there. Tube 2 selected instead.",
    });
  });

  it('announces undo, an extra tube, and clearing the selection', () => {
    const start = createState(level);
    const poured = settle(tap(tap(start, 0), 2));
    expect(describeChange(poured, colourSortReducer(poured, { type: 'undo' }))?.kind).toBe('undo');

    const extra = colourSortReducer(start, { type: 'extraTube' });
    expect(describeChange(start, extra)).toEqual({
      kind: 'extraTube',
      text: 'Added an empty extra tube, tube 4.',
    });

    const selected = tap(start, 0);
    expect(describeChange(selected, colourSortReducer(selected, { type: 'cancel' }))).toEqual({
      kind: 'deselect',
      text: 'Selection cleared.',
    });
  });

  it('announces the win with the move count, using the plural correctly', () => {
    const almost: Level = { colors: 2, capacity: 2, tubes: [[0], [1], [0, 1]] };
    let state = createState(almost);
    state = settle(tap(tap(state, 2), 1));
    const before = state;
    state = settle(tap(tap(state, 0), 2));
    expect(describeChange(before, state)).toEqual({ kind: 'solved', text: 'Sorted! Solved in 2 moves.' });
  });

  it('returns null when nothing audible changed', () => {
    const state = createState(level);
    expect(describeChange(state, state)).toBeNull();
    expect(describeChange(state, { ...state })).toBeNull();
  });
});
