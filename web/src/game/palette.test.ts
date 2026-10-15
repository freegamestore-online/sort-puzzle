import { describe, expect, it } from 'vitest';
import { BALL_COLOURS, contrastRatio, PANEL_COLOURS, SYMBOL_PATHS } from './palette.ts';
import { DIFFICULTY_TIERS } from './level.ts';

describe('palette accessibility (WCAG 2.1 non-text contrast, 1.4.11)', () => {
  it('every ball is at least 3:1 against both the light and dark tube panels', () => {
    for (const colour of BALL_COLOURS) {
      expect(contrastRatio(colour.base, PANEL_COLOURS.light), colour.name).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(colour.base, PANEL_COLOURS.dark), colour.name).toBeGreaterThanOrEqual(3);
    }
  });

  it('every colour-blind symbol is at least 3:1 against its ball', () => {
    for (const colour of BALL_COLOURS) {
      expect(contrastRatio(colour.base, colour.glyph), colour.name).toBeGreaterThanOrEqual(3);
    }
  });

  it('has a distinct name and symbol for every colour, enough for the hardest tier', () => {
    const colourCount = Math.max(...Object.values(DIFFICULTY_TIERS).map((tier) => tier.colors));
    expect(BALL_COLOURS.length).toBeGreaterThanOrEqual(colourCount);
    expect(new Set(BALL_COLOURS.map((c) => c.name)).size).toBe(BALL_COLOURS.length);
    expect(new Set(BALL_COLOURS.map((c) => c.symbol)).size).toBe(BALL_COLOURS.length);
    for (const colour of BALL_COLOURS) expect(SYMBOL_PATHS[colour.symbol]).toBeTruthy();
  });
});

describe('contrastRatio', () => {
  it('matches the WCAG extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });
});
