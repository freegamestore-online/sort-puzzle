// Generates the original Colour Sort artwork and renders it to PNG.
//
//   node art/build.mjs            (from the repo root; needs Google Chrome)
//
// Writes:
//   art/src/*.svg                 vector sources (committed)
//   web/public/icon-{192,512}.png PWA and apple-touch icons (shipped in the build)
//   art/out/feature-graphic.png   store feature graphic, 1024×500 (not shipped)
//   art/out/sprites/*.png         tube and colour-ball sprites at 1×, 2×, 3× (not shipped)
//
// Colours come from web/src/game/palette.ts, so the art matches the game.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BALL_COLOURS } from '../web/src/game/palette.ts';

const root = new URL('..', import.meta.url).pathname;
const src = `${root}art/src`;
const out = `${root}art/out`;
mkdirSync(src, { recursive: true });
mkdirSync(`${out}/sprites`, { recursive: true });

// ---- Shapes ---------------------------------------------------------------

/** A glass tube with rounded bottom, drawn in a box of w×h at (x, y). */
function tube(x, y, w, h, r, stroke) {
  const bottom = y + h;
  return `<path d="M${x} ${y} V${bottom - r} Q${x} ${bottom} ${x + r} ${bottom} H${x + w - r} Q${x + w} ${bottom} ${x + w} ${bottom - r} V${y}" fill="rgba(255,255,255,0.14)" stroke="${stroke}" stroke-width="${Math.max(2, w * 0.05)}" stroke-linejoin="round"/>`;
}

/** One ball: rounded rect with a soft gloss. */
function ball(x, y, w, h, r, base, light) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#g-${base.slice(1)})"/>
  <rect x="${x + w * 0.16}" y="${y + h * 0.16}" width="${w * 0.68}" height="${h * 0.16}" rx="${h * 0.08}" fill="rgba(255,255,255,0.4)"/>`;
}

function ballGradients() {
  return BALL_COLOURS.map(
    (c) => `<linearGradient id="g-${c.base.slice(1)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.light}"/><stop offset="1" stop-color="${c.base}"/></linearGradient>`,
  ).join('');
}

// ---- Icon: 512×512, full-bleed (valid as "any" and "maskable"). ------------
// Content sits inside the central 80% safe zone.

function iconSvg() {
  const [a, b, c] = [BALL_COLOURS[0], BALL_COLOURS[2], BALL_COLOURS[1]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
    ${ballGradients()}
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <rect x="158" y="104" width="196" height="14" rx="7" fill="rgba(255,255,255,0.7)"/>
  ${tube(166, 116, 180, 290, 64, 'rgba(255,255,255,0.7)')}
  ${ball(190, 300, 132, 66, 22, c.base, c.light)}
  ${ball(190, 226, 132, 66, 22, b.base, b.light)}
  ${ball(190, 152, 132, 66, 22, a.base, a.light)}
</svg>`;
}

// ---- Feature graphic: 1024×500 for the store listing. ----------------------

function featureSvg() {
  const cols = [BALL_COLOURS[0], BALL_COLOURS[2], BALL_COLOURS[1], BALL_COLOURS[4]];
  const tubes = [0, 1, 2].map((i) => {
    const x = 728 + i * 96;
    const stack = [cols[(i + 1) % 4], cols[(i + 2) % 4], cols[i]];
    return `<rect x="${x - 4}" y="112" width="88" height="12" rx="6" fill="rgba(255,255,255,0.7)"/>
    ${tube(x, 124, 80, 256, 36, 'rgba(255,255,255,0.7)')}
    ${stack.map((c, j) => ball(x + 10, 316 - j * 72, 60, 58, 16, c.base, c.light)).join('\n    ')}`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e1b4b"/><stop offset="1" stop-color="#2563eb"/></linearGradient>
    ${ballGradients()}
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <text x="72" y="236" font-family="Fraunces, Georgia, serif" font-weight="800" font-size="96" fill="#ffffff">Colour Sort</text>
  <text x="76" y="306" font-family="Manrope, Helvetica, Arial, sans-serif" font-weight="600" font-size="34" fill="rgba(255,255,255,0.85)">Pour, sort, repeat. Free forever.</text>
  ${tubes.join('\n  ')}
</svg>`;
}

// ---- Sprites: a tube and a colour ball at 1× (40×120 and 28×28). -----------

function tubeSpriteSvg() {
  const cols = [BALL_COLOURS[0], BALL_COLOURS[2], BALL_COLOURS[1]];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="120" viewBox="0 0 40 120">
  <defs>${ballGradients()}</defs>
  ${tube(4, 4, 32, 112, 12, 'rgba(120,120,140,0.9)')}
  ${cols.map((c, j) => ball(9, 80 - j * 22, 22, 18, 6, c.base, c.light)).join('\n  ')}
</svg>`;
}

function blobSpriteSvg(colour) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colour.light}"/><stop offset="1" stop-color="${colour.base}"/></linearGradient></defs>
  <rect x="1" y="1" width="26" height="26" rx="8" fill="url(#g)"/>
  <rect x="5" y="4.5" width="18" height="4.5" rx="2.2" fill="rgba(255,255,255,0.4)"/>
</svg>`;
}

// ---- Render through headless Chrome ----------------------------------------

const CHROME = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1217/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const PORT = 9444;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withChrome(fn) {
  const chrome = spawn(CHROME, ['--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(tmpdir(), 'sort-puzzle-art-chrome')}`, 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50 && !targets; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { await sleep(200); }
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map();
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  try { await fn(send); } finally { ws.close(); chrome.kill(); }
}

/** Renders an SVG at `width`×`height` CSS px, captured at `scale`× device pixels. */
async function renderPng(send, svg, width, height, scale, file) {
  const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}svg{display:block}</style></head><body>${svg.replace(/<svg /, '<svg style="width:' + width + 'px;height:' + height + 'px" ')}</body></html>`;
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
  await send('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') });
  await sleep(400);
  const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width, height, scale: 1 }, captureBeyondViewport: false, fromSurface: true });
  writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
}

// ---- Main -------------------------------------------------------------------

const sources = {
  'icon.svg': iconSvg(),
  'feature-graphic.svg': featureSvg(),
  'sprite-tube.svg': tubeSpriteSvg(),
  ...Object.fromEntries(BALL_COLOURS.map((c) => [`sprite-blob-${c.name}.svg`, blobSpriteSvg(c)])),
};
for (const [name, text] of Object.entries(sources)) writeFileSync(`${src}/${name}`, text + '\n');

const jobs = [];
jobs.push({ svg: sources['icon.svg'], w: 192, h: 192, s: 1, file: `${root}web/public/icon-192.png` });
jobs.push({ svg: sources['icon.svg'], w: 512, h: 512, s: 1, file: `${root}web/public/icon-512.png` });
jobs.push({ svg: sources['feature-graphic.svg'], w: 1024, h: 500, s: 1, file: `${out}/feature-graphic.png` });
for (const s of [1, 2, 3]) {
  jobs.push({ svg: sources['sprite-tube.svg'], w: 40, h: 120, s, file: `${out}/sprites/tube@${s}x.png` });
  for (const c of BALL_COLOURS) {
    jobs.push({ svg: sources[`sprite-blob-${c.name}.svg`], w: 28, h: 28, s, file: `${out}/sprites/blob-${c.name}@${s}x.png` });
  }
}

await withChrome(async (send) => {
  for (const job of jobs) await renderPng(send, job.svg, job.w, job.h, job.s, job.file);
});
console.log(`wrote ${Object.keys(sources).length} SVG sources and ${jobs.length} PNG files`);
