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

/** What undo restores. Everything that a player action can change is in here. */
export interface Snapshot {
  tubes: Tube[];
  moves: number;
  extraTubeUsed: boolean;
}

export interface ColourSortState extends Snapshot {
  capacity: number;
  selected: number | null;
  pour: PourEvent | null;
  solved: boolean;
  /** Snapshots taken before each undoable action, most recent last. */
  history: Snapshot[];
}

export type ColourSortAction =
  | { type: 'tap'; index: number }
  | { type: 'pourEnd' }
  | { type: 'undo' }
  | { type: 'extraTube' }
  | { type: 'reset'; level: Level };

export function createState(level: Level): ColourSortState {
  return {
    capacity: level.capacity,
    tubes: level.tubes.map((tube) => [...tube]),
    selected: null,
    moves: 0,
    extraTubeUsed: false,
    pour: null,
    solved: isSolved(level.tubes, level.capacity),
    history: [],
  };
}

/** True when a helper or tap is allowed right now. */
function canAct(state: ColourSortState): boolean {
  return state.pour === null && !state.solved;
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

    case 'undo': {
      const previous = state.history[state.history.length - 1];
      if (!previous || state.pour !== null) return state;
      return {
        ...state,
        ...previous,
        selected: null,
        pour: null,
        solved: isSolved(previous.tubes, state.capacity),
        history: state.history.slice(0, -1),
      };
    }

    case 'extraTube': {
      // One extra empty tube per level. An empty tube never blocks a solution.
      if (!canAct(state) || state.extraTubeUsed) return state;
      const tubes = [...state.tubes, []];
      return {
        ...state,
        tubes,
        selected: null,
        extraTubeUsed: true,
        history: [...state.history, snapshotOf(state)],
      };
    }

    case 'tap': {
      if (!canAct(state)) return state;
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
        history: [...state.history, snapshotOf(state)],
      };
    }
  }
}

function snapshotOf(state: ColourSortState): Snapshot {
  return { tubes: state.tubes, moves: state.moves, extraTubeUsed: state.extraTubeUsed };
}
