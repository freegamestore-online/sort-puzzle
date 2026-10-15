import type { BurstOptions } from '../feel/particles';

// Game feel: tuning for the particle bursts and the pour pulse, and the
// geometry that places a burst over a tube. The feel kit (src/feel) does the
// drawing. These are the game's own values.

/** A short spray from the top of a tube when a pour lands. */
export const POUR_BURST: BurstOptions = { count: 10, speed: [120, 260], size: [3, 6], life: 0.5, angle: -Math.PI / 2, spread: Math.PI * 0.8 };

/** A wider ring from each sorted tube when the puzzle is solved. */
export const WIN_BURST: BurstOptions = { count: 30, speed: [200, 420], size: [5, 8], life: 1.0 };

/** Haptic pulse on a pour, in ms. Shorter than the feel kit's clear pattern. */
export const POUR_PULSE = 8;

/** Where an element's centre sits, relative to `root`'s top-left corner. */
export function centreWithin(element: HTMLElement, root: HTMLElement): { x: number; y: number } {
  const origin = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top + rect.height / 2 };
}

/** Horizontal centre and top edge of `element`, relative to `root`. Used for pours, which land at the rim. */
export function topCentreWithin(element: HTMLElement, root: HTMLElement): { x: number; y: number } {
  const origin = root.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  return { x: rect.left - origin.left + rect.width / 2, y: rect.top - origin.top };
}
