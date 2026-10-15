/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { APP_DESCRIPTION, APP_NAME } from './brand.ts';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

// Returns the value of a `key: "value"` pair. The leading boundary keeps
// `short_name` from matching `name`.
function quotedValue(source: string, key: string): string | undefined {
  const match = source.match(new RegExp(`(?:^|[\\s{,])${key}:\\s*"([^"]*)"`, 'm'));
  return match?.[1];
}

describe('display name', () => {
  const html = read('../index.html');
  const config = read('../vite.config.ts');

  it('uses the display name in the page title', () => {
    expect(html).toContain(`<title>${APP_NAME} — FreeGameStore</title>`);
  });

  it('has a meta description matching the app description', () => {
    expect(html).toContain(`<meta name="description" content="${APP_DESCRIPTION}" />`);
  });

  it('names the iOS home-screen app', () => {
    expect(html).toContain(`<meta name="apple-mobile-web-app-title" content="${APP_NAME}" />`);
  });

  it('uses the display name in the PWA manifest name and short_name', () => {
    expect(quotedValue(config, 'name')).toBe(APP_NAME);
    expect(quotedValue(config, 'short_name')).toBe(APP_NAME);
  });

  it('uses the app description in the PWA manifest', () => {
    expect(quotedValue(config, 'description')).toBe(APP_DESCRIPTION);
  });
});
