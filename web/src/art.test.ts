/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Reads the width and height from a PNG's IHDR chunk, without an image library.
function pngSize(path: string): { width: number; height: number } {
  const bytes = readFileSync(new URL(path, import.meta.url));
  expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('art assets', () => {
  it('ships PWA icons at 192 and 512 px', () => {
    expect(pngSize('../public/icon-192.png')).toEqual({ width: 192, height: 192 });
    expect(pngSize('../public/icon-512.png')).toEqual({ width: 512, height: 512 });
  });

  it('has a tube sprite at 1×, 2× and 3×', () => {
    expect(pngSize('../../art/out/sprites/tube@1x.png')).toEqual({ width: 40, height: 120 });
    expect(pngSize('../../art/out/sprites/tube@2x.png')).toEqual({ width: 80, height: 240 });
    expect(pngSize('../../art/out/sprites/tube@3x.png')).toEqual({ width: 120, height: 360 });
  });

  it('has a colour ball sprite at 1×, 2× and 3× for the first colour', () => {
    expect(pngSize('../../art/out/sprites/blob-red@1x.png')).toEqual({ width: 28, height: 28 });
    expect(pngSize('../../art/out/sprites/blob-red@2x.png')).toEqual({ width: 56, height: 56 });
    expect(pngSize('../../art/out/sprites/blob-red@3x.png')).toEqual({ width: 84, height: 84 });
  });

  it('has a 1024×500 feature graphic', () => {
    expect(pngSize('../../art/out/feature-graphic.png')).toEqual({ width: 1024, height: 500 });
  });
});
