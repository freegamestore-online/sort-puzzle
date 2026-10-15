import type { Tube } from './level.ts';

export interface PourResult {
  tubes: Tube[];
  count: number;
}

/** How many balls at the top of `tube` share the top colour. */
export function topRunLength(tube: Tube): number {
  const top = tube[tube.length - 1];
  if (top === undefined) return 0;
  let run = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === top; i--) run++;
  return run;
}

function isSingleColour(tube: Tube): boolean {
  return tube.every((ball) => ball === tube[0]);
}

/**
 * Balls that would pour from `from` onto `to`: the whole top run, capped by the
 * free space in `to`. Returns 0 when the pour is illegal. Pouring a tube that is
 * already one colour onto an empty tube is also rejected, since nothing changes.
 */
export function pourAmount(tubes: readonly Tube[], capacity: number, from: number, to: number): number {
  const source = tubes[from];
  const target = tubes[to];
  if (from === to || !source || !target || source.length === 0 || target.length >= capacity) return 0;

  if (target.length === 0) {
    if (isSingleColour(source)) return 0;
  } else if (target[target.length - 1] !== source[source.length - 1]) {
    return 0;
  }
  return Math.min(topRunLength(source), capacity - target.length);
}

/** Applies a pour. Returns null when it is illegal. Does not mutate `tubes`. */
export function pour(tubes: readonly Tube[], capacity: number, from: number, to: number): PourResult | null {
  const count = pourAmount(tubes, capacity, from, to);
  if (count === 0) return null;

  const next = tubes.map((tube) => [...tube]);
  const source = next[from]!;
  const moved = source.splice(source.length - count, count);
  next[to]!.push(...moved);
  return { tubes: next, count };
}
