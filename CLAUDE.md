# Grid Game Template

A free game on FreeGameStore.

- Subdomain: `sort-puzzle.freegamestore.online`
- Dev: `pnpm install && pnpm dev`
- Build: `pnpm build`
- Deploy: `git push origin main` (auto-deploys to R2 via GitHub Actions)

Free, MIT-licensed, no tracking. For platform conventions, read
https://freegamestore.online/skills.md
before writing or changing anything.

---

## Template Purpose
This template is for building grid-based games such as:
- 2048
- Minesweeper
- Sudoku
- Wordle
- Connect Four
- Tic-Tac-Toe
- Match-3 puzzles

## Architecture
- `web/src/hooks/useGrid.ts` — Reusable grid state hook (rows, cols, cell operations)
- `web/src/hooks/useHighScore.ts` — localStorage-backed high score persistence
- `web/src/components/GameGrid.tsx` — Reusable CSS Grid renderer with touch + click support
- `web/src/game/level.ts` — Colour Sort level generator (solvable by construction) and daily seed
- `web/src/game/solver.ts` — Colour Sort solver, used by tests to prove levels are solvable
- `web/src/game/rng.ts` — Seeded RNG (string seed → deterministic sequence)
- `web/src/game/pour.ts` + `colourSortState.ts` — Colour Sort pour rules and tap-to-select/tap-to-pour reducer
- `web/src/components/ColourSortBoard.tsx` — Tube and coloured-layer rendering with pour animation
- `web/src/game/progress.ts` — Daily progress and best-moves saved in localStorage
- `web/src/game/leaderboard.ts` — Daily fewest-moves board via the leaderboard API (`period`)
- `web/src/components/DailyBoard.tsx` — Today's board on the win card
- `web/src/App.tsx` — Colour Sort screen inside `GameShell`

## Grid Rendering
- Uses CSS Grid (not canvas) for accessibility and styling flexibility
- Responsive sizing via CSS clamp()
- Touch + click support on all cells
- Smooth CSS transitions (200ms ease for moves, 300ms scale for clears)
- CSS variables for theming (dark mode compatible)

## Visual Defaults
- Cells: rounded corners (0.5rem), subtle shadows, gradient fills
- Colors: vibrant but tasteful palette for cell values
- Score display with Fraunces font
- Glass-effect score panel
- Dark mode via prefers-color-scheme (no toggle)