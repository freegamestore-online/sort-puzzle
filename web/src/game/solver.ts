import { isSolved, legalMoves, type Tube } from './level.ts';

export type SolveResult =
  | { status: 'solved'; moves: Array<[from: number, to: number]> }
  | { status: 'unsolvable' }
  | { status: 'budget-exceeded'; explored: number };

/**
 * Depth-first search with a visited set. Empty tubes are interchangeable, so only
 * the first empty tube is tried as a destination. Returns 'unsolvable' only when
 * the whole state space has been searched. Stops with 'budget-exceeded' after
 * `maxStates` distinct states.
 */
export function solve(tubes: readonly Tube[], capacity: number, maxStates = 200_000): SolveResult {
  const work = tubes.map((tube) => [...tube]);
  const seen = new Set<string>();
  const path: Array<[number, number]> = [];
  let budgetHit = false;

  const search = (): boolean => {
    if (isSolved(work, capacity)) return true;

    const key = stateKey(work);
    if (seen.has(key)) return false;
    if (seen.size >= maxStates) {
      budgetHit = true;
      return false;
    }
    seen.add(key);

    const firstEmpty = work.findIndex((tube) => tube.length === 0);
    for (const [from, to] of legalMoves(work, capacity)) {
      if (work[to]!.length === 0 && to !== firstEmpty) continue;

      const ball = work[from]!.pop()!;
      work[to]!.push(ball);
      path.push([from, to]);

      if (search()) return true;

      path.pop();
      work[to]!.pop();
      work[from]!.push(ball);
      if (budgetHit) return false;
    }
    return false;
  };

  if (search()) return { status: 'solved', moves: path };
  if (budgetHit) return { status: 'budget-exceeded', explored: seen.size };
  return { status: 'unsolvable' };
}

/** Tube order does not change the puzzle, so sort tubes to merge equivalent states. */
function stateKey(tubes: readonly Tube[]): string {
  return tubes
    .map((tube) => String.fromCharCode(...tube.map((ball) => 65 + ball)))
    .sort()
    .join('|');
}
