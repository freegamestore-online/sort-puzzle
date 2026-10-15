// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// The daily board fetches scores. Answer with an empty board so the test stays offline.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ scores: [] }), { status: 200 })));
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('App feel wiring', () => {
  it('mounts the particle layer over the play area', () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('.cs-play canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('data-particles')).toBe('0');
  });

  it('plays a legal pour without errors and counts the move', async () => {
    const { container } = render(<App />);
    const tubes = Array.from(container.querySelectorAll<HTMLButtonElement>('.cs-tube-button'));
    const label = (b: HTMLButtonElement) => b.getAttribute('aria-label') ?? '';
    const top = (b: HTMLButtonElement) => label(b).match(/top (\w+)/)?.[1];
    const pair = tubes
      .flatMap((_a, i) => tubes.map((_b, j) => [i, j] as const))
      .find(([i, j]) => i !== j && top(tubes[i]!) && top(tubes[i]!) === top(tubes[j]!) && tubes[j]!.querySelectorAll('.cs-ball').length < 4);
    expect(pair).toBeDefined();
    const [from, to] = pair!;

    fireEvent.click(tubes[from]!);
    await act(async () => {
      fireEvent.click(tubes[to]!);
    });

    expect(screen.getByText(/Poured 1/)).toBeTruthy();
  });
});
