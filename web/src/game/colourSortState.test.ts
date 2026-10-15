import { describe, expect, it } from 'vitest';
import { POUR_MS, colourSortReducer, createState, type ColourSortState } from './colourSortState.ts';
import { generateLevel, isSolved, type Level } from './level.ts';
import { createRng } from './rng.ts';

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

function act(state: ColourSortState, action: Parameters<typeof colourSortReducer>[1]): ColourSortState {
  return colourSortReducer(state, action);
}

/** Ends the pour animation so the next tap is accepted. */
function settle(state: ColourSortState): ColourSortState {
  return state.pour ? act(state, { type: 'pourEnd' }) : state;
}

describe('undo', () => {
  it('does nothing when there is no history', () => {
    const state = createState(level);
    expect(act(state, { type: 'undo' })).toBe(state);
  });

  it('reverts the last pour, its move count and the selection', () => {
    const before = createState(level);
    const poured = settle(tap(tap(before, 0), 2));
    const undone = act(poured, { type: 'undo' });
    expect(undone.tubes).toEqual(before.tubes);
    expect(undone.moves).toBe(0);
    expect(undone.selected).toBeNull();
    expect(undone.pour).toBeNull();
    expect(undone.history).toEqual([]);
  });

  it('is blocked while a pour is animating', () => {
    const poured = tap(tap(createState(level), 0), 2);
    expect(act(poured, { type: 'undo' })).toBe(poured);
  });

  it('can undo after the level is solved, and the level is no longer solved', () => {
    const almost: Level = { colors: 2, capacity: 2, tubes: [[0], [1], [0, 1]] };
    let state = createState(almost);
    state = settle(tap(tap(state, 2), 1));
    state = settle(tap(tap(state, 0), 2));
    expect(state.solved).toBe(true);
    state = act(state, { type: 'undo' });
    expect(state.solved).toBe(false);
    // Undoing the winning pour leaves the first pour in place.
    expect(state.tubes).toEqual([[0], [1, 1], [0]]);
    expect(state.moves).toBe(1);
  });

  it('undoes many pours back to the start, and undoing an undo is impossible', () => {
    const start = createState(level);
    let state = settle(tap(tap(start, 0), 2)); // tube 0 top 1 pours onto empty tube 2
    state = settle(tap(tap(state, 1), 0)); // tube 1 top 0 pours onto tube 0
    expect(state.moves).toBe(2);
    while (state.history.length > 0) state = settle(act(state, { type: 'undo' }));
    expect(state.tubes).toEqual(start.tubes);
    expect(state.moves).toBe(0);
    expect(act(state, { type: 'undo' })).toBe(state);
  });
});

describe('extra tube helper', () => {
  it('adds one empty tube and marks the helper used', () => {
    const state = act(createState(level), { type: 'extraTube' });
    expect(state.tubes).toHaveLength(level.tubes.length + 1);
    expect(state.tubes[state.tubes.length - 1]).toEqual([]);
    expect(state.extraTubeUsed).toBe(true);
  });

  it('can only be used once per level', () => {
    const once = act(createState(level), { type: 'extraTube' });
    expect(act(once, { type: 'extraTube' })).toBe(once);
  });

  it('is blocked while a pour is animating and once the level is solved', () => {
    const poured = tap(tap(createState(level), 0), 2);
    expect(act(poured, { type: 'extraTube' })).toBe(poured);
    const solved = createState({ colors: 1, capacity: 2, tubes: [[0, 0], []] });
    expect(act(solved, { type: 'extraTube' })).toBe(solved);
  });

  it('can be pour-targeted like any other tube', () => {
    // Extra tube is index 3. Pour tube 0's top onto it.
    const withExtra = act(createState(level), { type: 'extraTube' });
    const poured = settle(tap(tap(withExtra, 0), 3));
    expect(poured.tubes[3]).toEqual([1]);
    expect(poured.moves).toBe(1);
  });

  it('refunds the helper when undone, so the level keeps its one use', () => {
    const used = act(createState(level), { type: 'extraTube' });
    const undone = act(used, { type: 'undo' });
    expect(undone.tubes).toHaveLength(level.tubes.length);
    expect(undone.extraTubeUsed).toBe(false);
    expect(act(undone, { type: 'extraTube' }).extraTubeUsed).toBe(true);
  });

  it('keeps the helper used when undoing pours made after it', () => {
    let state = act(createState(level), { type: 'extraTube' });
    state = settle(tap(tap(state, 0), 2));
    state = act(state, { type: 'undo' });
    expect(state.extraTubeUsed).toBe(true);
    expect(state.tubes).toHaveLength(level.tubes.length + 1);
  });

  it('does not break win detection, since the empty tube is allowed', () => {
    const solvedWithSpare: Level = { colors: 1, capacity: 2, tubes: [[0, 0]] };
    const state = act(createState(solvedWithSpare), { type: 'extraTube' });
    expect(isSolved(state.tubes, state.capacity)).toBe(true);
    expect(state.solved).toBe(true);
  });
});

describe('random play with undo', () => {
  it('undoing every action restores the original level, with no balls lost', () => {
    const rng = createRng('undo-walk');
    for (let seed = 0; seed < 20; seed++) {
      const level = generateLevel({ colors: 4, capacity: 3, spareTubes: 2 }, `walk-${seed}`);
      const start = createState(level);
      let state = start;

      for (let step = 0; step < 60 && !state.solved; step++) {
        if (rng.next() < 0.1) {
          state = act(state, { type: 'extraTube' });
        } else {
          const count = state.tubes.length;
          state = act(state, { type: 'tap', index: rng.int(count) });
        }
        state = settle(state);

        // Every colour must always have exactly `capacity` balls across the tubes.
        const counts = new Map<number, number>();
        for (const tube of state.tubes) for (const ball of tube) counts.set(ball, (counts.get(ball) ?? 0) + 1);
        for (const count of counts.values()) expect(count).toBe(level.capacity);
      }

      while (state.history.length > 0) state = settle(act(state, { type: 'undo' }));
      expect(state.tubes).toEqual(start.tubes);
      expect(state.extraTubeUsed).toBe(false);
      expect(state.moves).toBe(0);
    }
  });
});
