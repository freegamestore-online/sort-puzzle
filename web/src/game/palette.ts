// Ball colours and the colour-blind symbol for each. Every colour meets WCAG 2.1
// non-text contrast (3:1) against both the light and dark tube panels, and its
// symbol meets 3:1 against the ball. Test: palette.test.ts.

export type SymbolName =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'diamond'
  | 'star'
  | 'plus'
  | 'cross'
  | 'hexagon'
  | 'pentagon';

export interface BallColour {
  name: string;
  base: string;
  light: string;
  symbol: SymbolName;
  /** Symbol colour with the higher contrast against `base`. */
  glyph: string;
}

const WHITE = '#ffffff';
const INK = '#111111';

function entry(name: string, base: string, light: string, symbol: SymbolName): BallColour {
  const glyph = contrastRatio(base, WHITE) >= contrastRatio(base, INK) ? WHITE : INK;
  return { name, base, light, symbol, glyph };
}

export const BALL_COLOURS: readonly BallColour[] = [
  entry('red', '#e11d48', '#fb7185', 'circle'),
  entry('blue', '#2563eb', '#60a5fa', 'triangle'),
  entry('green', '#16a34a', '#4ade80', 'square'),
  entry('amber', '#a16207', '#facc15', 'diamond'),
  entry('purple', '#9333ea', '#c084fc', 'star'),
  entry('orange', '#ea580c', '#fb923c', 'plus'),
  entry('cyan', '#0891b2', '#22d3ee', 'cross'),
  entry('pink', '#db2777', '#f472b6', 'hexagon'),
  entry('indigo', '#6366f1', '#a5b4fc', 'pentagon'),
];

/** Panel colours from index.css, light and dark. */
export const PANEL_COLOURS = { light: '#f9fafb', dark: '#1a1a1a' } as const;

/** Each symbol's path in a 16×16 box. */
export const SYMBOL_PATHS: Record<SymbolName, string> = {
  circle: 'M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 1 0 0-9z',
  triangle: 'M8 3.5L12.6 12H3.4z',
  square: 'M4 4h8v8H4z',
  diamond: 'M8 2.8L13.2 8 8 13.2 2.8 8z',
  star: 'M8 2.4l1.7 3.9 4.2.4-3.2 2.8.9 4.1L8 11.4 4.4 13.6l.9-4.1L2.1 6.7l4.2-.4z',
  plus: 'M6.5 3h3v3.5H13v3H9.5V13h-3V9.5H3v-3h3.5z',
  cross: 'M5 3.6L8 6.6l3-3L12.4 5 9.4 8l3 3-1.4 1.4-3-3-3 3L3.6 11l3-3-3-3z',
  hexagon: 'M8 2.8l4.6 2.7v5L8 13.2 3.4 10.5v-5z',
  pentagon: 'M8 2.9l4.8 3.5-1.8 5.6H5L3.2 6.4z',
};

export function ballColour(index: number): BallColour {
  return BALL_COLOURS[index % BALL_COLOURS.length]!;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two #rrggbb colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
