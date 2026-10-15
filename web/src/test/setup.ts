import '@testing-library/jest-dom/vitest';

// jsdom has no 2D canvas. Particle layers keep their counts on the element, so
// tests do not need to draw. Returning null makes the drawing code skip itself.
// Guarded so node-environment tests, which have no DOM, still load this file.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
}
