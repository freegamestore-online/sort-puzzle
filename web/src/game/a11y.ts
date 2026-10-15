import { ballColour } from './palette.ts';
import type { ColourSortState } from './colourSortState.ts';

// Turns a state change into one sentence for screen readers and one sound cue.
// Tubes are numbered from 1 to match what sighted players see.

export type CueKind = 'select' | 'deselect' | 'pour' | 'invalid' | 'undo' | 'extraTube' | 'solved';

export interface Cue {
  kind: CueKind;
  text: string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Describes what changed between two states, or null if nothing audible changed. */
export function describeChange(prev: ColourSortState, next: ColourSortState): Cue | null {
  if (prev === next) return null;

  if (next.solved && !prev.solved) {
    return { kind: 'solved', text: `Sorted! Solved in ${plural(next.moves, 'move')}.` };
  }

  if (next.moves > prev.moves && next.pour) {
    const { from, to, count } = next.pour;
    const moved = next.tubes[to]![next.tubes[to]!.length - 1]!;
    const colour = ballColour(moved).name;
    return {
      kind: 'pour',
      text: `Poured ${plural(count, colour + ' ball')} from tube ${from + 1} to tube ${to + 1}.`,
    };
  }

  if (next.moves < prev.moves) {
    return { kind: 'undo', text: 'Undid the last move.' };
  }

  if (next.extraTubeUsed && !prev.extraTubeUsed) {
    return { kind: 'extraTube', text: `Added an empty extra tube, tube ${next.tubes.length}.` };
  }

  if (prev.selected === null && next.selected !== null) {
    const tube = next.tubes[next.selected]!;
    const top = ballColour(tube[tube.length - 1]!).name;
    return {
      kind: 'select',
      text: `Tube ${next.selected + 1} selected, ${plural(tube.length, 'ball')}, top ${top}.`,
    };
  }

  if (prev.selected !== null && next.selected !== null && next.selected !== prev.selected) {
    // An illegal target that holds balls becomes the new selection.
    return { kind: 'invalid', text: `Can't pour there. Tube ${next.selected + 1} selected instead.` };
  }

  if (prev.selected !== null && next.selected === null) {
    return { kind: 'deselect', text: 'Selection cleared.' };
  }

  return null;
}
