# Art and asset provenance

Everything in this repository was made for Colour Sort, or comes from a source
licensed for commercial use. Nothing is taken from stock sites or other games.

| Asset | Where | Made by | Licence |
|---|---|---|---|
| App icon, 192 and 512 px (PWA, apple-touch) | `web/public/icon-*.png` | `art/build.mjs` (original SVG) | MIT, with this repository |
| Feature graphic, 1024×500 (store listing, not shipped) | `art/out/feature-graphic.png` | `art/build.mjs` | MIT, with this repository |
| Tube and colour-ball sprites at 1×, 2×, 3× (not used by the renderer; for art review and store use) | `art/out/sprites/*.png` | `art/build.mjs` | MIT, with this repository |
| Vector sources | `art/src/*.svg` | `art/build.mjs` | MIT, with this repository |
| Manrope (UI font) | Google Fonts CDN | Mikhail Sharanda | SIL Open Font License 1.1 (commercial use allowed) |
| Fraunces (display font) | Google Fonts CDN | Undercase Type | SIL Open Font License 1.1 (commercial use allowed) |
| Synthesised sounds | `@freegamestore/games` | Platform SDK | MIT |

## Regenerating the art

```sh
node art/build.mjs
```

This needs Google Chrome installed, and Node 24 (it imports the TypeScript palette directly; CI does not run it). It rebuilds the SVG sources and writes the
PNGs. The colours come from `web/src/game/palette.ts`.

## Sprites and the renderer

The board is drawn with CSS and SVG, which stays sharp at any pixel density.
The sprite PNGs are provided so the art can be reviewed and reused in store
listings. The game does not load them.
