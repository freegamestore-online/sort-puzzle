import { isSolved, type Level, type Tube } from './level.ts';
import { pour } from './pour.ts';

/** Length of the pour animation. Taps are ignored until it ends. */
export const POUR_MS = 450;

export interface PourEvent {
  /** Moves made so far, so each pour has a unique id. */
  id: number;
  from: number;
  to: number;
  count: number;
  /** Balls already in the destination before this pour. */
  destPrevLen: number;
}

export interface ColourSortState {
  capacity: number;
  tubes: Tube[];
  selected: number | null;
  moves: number;
  pour: PourEvent | null;
  solved: boolean;
}

export type ColourSortAction =
  | { type: 'tap'; index: number }
  | { type: 'pourEnd' }
  | { type: 'reset'; level: Level };

export function createState(level: Level): ColourSortState {
  return {
    capacity: level.capacity,
    tubes: level.tubes.map((tube) => [...tube]),
    selected: null,
    moves: 0,
    pour: null,
    solved: isSolved(level.tubes, level.capacity),
  };
}

/**
 * Tap to select a tube, then tap another to pour. Tapping the selected tube
 * clears the selection. An illegal target becomes the new selection if it has
 * balls.
 */
export function colourSortReducer(state: ColourSortState, action: ColourSortAction): ColourSortState {
  switch (action.type) {
    case 'reset':
      return createState(action.level);

    case 'pourEnd':
      return state.pour ? { ...state, pour: null } : state;

    case 'tap': {
      if (state.pour || state.solved) return state;
      const { index } = action;
      const tapped = state.tubes[index];
      if (tapped === undefined) return state;

      const from = state.selected;
      if (from === null) {
        return tapped.length > 0 ? { ...state, selected: index } : state;
      }
      if (from === index) return { ...state, selected: null };

      const result = pour(state.tubes, state.capacity, from, index);
      if (result === null) {
        return { ...state, selected: tapped.length > 0 ? index : null };
      }

      const moves = state.moves + 1;
      return {
        ...state,
        tubes: result.tubes,
        selected: null,
        moves,
        pour: { id: moves, from, to: index, count: result.count, destPrevLen: tapped.length },
        solved: isSolved(result.tubes, state.capacity),
      };
    }
  }
}
