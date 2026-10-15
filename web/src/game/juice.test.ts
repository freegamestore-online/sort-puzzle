// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { centreWithin, POUR_BURST, topCentreWithin, WIN_BURST } from './juice.ts';

// jsdom has no layout, so the rectangles are set by hand.
function boxed(left: number, top: number, width: number, height: number): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} }) as DOMRect;
  return el;
}

describe('juice geometry', () => {
  const root = boxed(100, 50, 400, 600);

  it('finds the centre of an element relative to the root', () => {
    expect(centreWithin(boxed(160, 90, 40, 80), root)).toEqual({ x: 80, y: 80 });
  });

  it('finds the top-centre of an element relative to the root', () => {
    expect(topCentreWithin(boxed(160, 90, 40, 80), root)).toEqual({ x: 80, y: 40 });
  });
});

describe('juice tuning', () => {
  it('keeps the bursts short and sized for a phone', () => {
    for (const burst of [POUR_BURST, WIN_BURST]) {
      expect(burst.count).toBeGreaterThan(0);
      expect(burst.life).toBeGreaterThan(0);
      expect(burst.size[0]).toBeLessThanOrEqual(burst.size[1]);
    }
    expect(WIN_BURST.count).toBeGreaterThan(POUR_BURST.count);
  });
});
