import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { HAPTICS } from "./feel/haptics";
import { ParticleLayer, type ParticleLayerHandle } from "./feel/ParticleLayer";
import { useHaptics } from "./feel/useHaptics";
import { useShake } from "./feel/useShake";
import { GameButton, GameShell, GameTopbar } from "@freegamestore/games";
import { APP_NAME } from "./brand";
import { Announcer } from "./components/Announcer";
import { ColourSortBoard } from "./components/ColourSortBoard";
import { DailyBoard } from "./components/DailyBoard";
import { OptionsModal } from "./components/OptionsModal";
import { describeChange, type Cue } from "./game/a11y";
import { centreWithin, POUR_BURST, POUR_PULSE, topCentreWithin, WIN_BURST } from "./game/juice";
import { ballColour } from "./game/palette";
import { dailyKey, dailyLevel } from "./game/level";
import { colourSortReducer, POUR_MS } from "./game/colourSortState";
import {
  defaultStorage,
  loadBestMoves,
  restoreState,
  saveBestMoves,
  saveState,
} from "./game/progress";
import { submitDailyMoves } from "./game/leaderboard";
import {
  effectiveReduceMotion,
  loadSettings,
  osPrefersReducedMotion,
  saveSettings,
  type Settings,
} from "./game/settings";

export default function App() {
  // One clock reading for the whole session, so the level, save key and board all agree.
  const today = useMemo(() => new Date(), []);
  const date = dailyKey(today);
  const level = useMemo(() => dailyLevel(today), [today]);
  const storage = useMemo(defaultStorage, []);
  const [state, dispatch] = useReducer(colourSortReducer, level, (lvl) =>
    restoreState(lvl, date, storage),
  );
  const [rank, setRank] = useState<number | undefined>(undefined);
  const [boardVersion, setBoardVersion] = useState(0);

  const [settings, setSettings] = useState<Settings>(() => loadSettings(storage));
  const [osReduce, setOsReduce] = useState(osPrefersReducedMotion);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const reduceMotion = effectiveReduceMotion(settings, osReduce);

  const [cue, setCue] = useState<Cue | null>(null);
  const previous = useRef(state);

  // Game feel. The feel kit only checks the OS setting, so the in-game toggle is checked here too.
  const playRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<ParticleLayerHandle>(null);
  const shakeBoard = useShake(boardRef, { amplitude: 4, duration: 320 });
  const haptics = useHaptics();

  // Save the settings, and follow the OS reduce-motion setting when it changes.
  useEffect(() => {
    saveSettings(settings, storage);
  }, [settings, storage]);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setOsReduce(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Apply the display settings to the page. Theme uses the same data-theme
  // attribute as the platform's theme toggle.
  useEffect(() => {
    const root = document.documentElement;
    setAttribute(root, "theme", settings.theme === "system" ? null : settings.theme);
    setAttribute(root, "touch", settings.largeTouch ? "large" : null);
    setAttribute(root, "motion", reduceMotion ? "reduce" : null);
  }, [settings.theme, settings.largeTouch, reduceMotion]);

  // Save after every change that matters, so a reload resumes the same game.
  useEffect(() => {
    saveState(state, date, storage);
  }, [state.tubes, state.moves, state.extraTubeUsed, state.history]);

  // Post the solve. Skipped if an equal or better score is already posted today.
  // Failures are silent (see leaderboard.ts).
  useEffect(() => {
    if (!state.solved) return;
    const best = loadBestMoves(date, storage);
    if (best !== null && state.moves >= best) return;
    void submitDailyMoves(date, state.moves).then((result) => {
      if (!result.ok) return;
      saveBestMoves(date, state.moves, storage);
      setRank(result.rank);
      setBoardVersion((version) => version + 1);
    });
  }, [state.solved]);

  // Describe each change for screen readers and sounds, then play its feel.
  useEffect(() => {
    const next = describeChange(previous.current, state);
    previous.current = state;
    if (!next) return;
    setCue(next);
    const root = playRef.current;
    if (!root) return;

    if (next.kind === "invalid" && !reduceMotion) shakeBoard();

    if (next.kind === "pour" && state.pour) {
      haptics.pulse(POUR_PULSE);
      const tube = root.querySelectorAll<HTMLElement>(".cs-tube")[state.pour.to];
      const top = state.tubes[state.pour.to]?.at(-1);
      if (tube && top !== undefined && !reduceMotion) {
        const at = topCentreWithin(tube, root);
        particlesRef.current?.burst(at.x, at.y + 16, [ballColour(top).base], POUR_BURST);
      }
    }

    if (next.kind === "solved") {
      haptics.pulse(HAPTICS.clear);
      if (!reduceMotion) {
        root.querySelectorAll<HTMLElement>(".cs-tube").forEach((tube, index) => {
          const top = state.tubes[index]?.at(-1);
          if (tube.dataset.solved === undefined || top === undefined) return;
          const at = centreWithin(tube, root);
          particlesRef.current?.burst(at.x, at.y, [ballColour(top).base], WIN_BURST);
        });
      }
    }
  }, [state]);

  // Clear the pour animation so the next tap is accepted. Instant with reduced motion.
  useEffect(() => {
    if (!state.pour) return;
    const timer = setTimeout(() => dispatch({ type: "pourEnd" }), reduceMotion ? 0 : POUR_MS);
    return () => clearTimeout(timer);
  }, [state.pour, reduceMotion]);

  // Escape clears the selection. It is ignored while the options dialog is open.
  useEffect(() => {
    if (optionsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch({ type: "cancel" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [optionsOpen]);

  const reset = () => {
    setRank(undefined);
    dispatch({ type: "reset", level });
  };
  const showWin = state.solved && state.pour === null;

  return (
    <GameShell
      topbar={
        <GameTopbar
          title={APP_NAME}
          stats={[{ label: "Moves", value: state.moves, accent: true }]}
          rules={
            <p>
              Tap a tube to select it, then tap another tube to pour its top
              colour there. Pour only onto an empty tube or the same colour.
              Sort every tube so each holds one colour. Press Escape to clear a
              selection.
            </p>
          }
          onRestart={reset}
        />
      }
    >
      <Announcer cue={cue} />
      <div className="cs-play" ref={playRef}>
        <div className="cs-board-wrap" ref={boardRef}>
          <ColourSortBoard
            state={state}
            colourBlind={settings.colourBlind}
            onTap={(index) => dispatch({ type: "tap", index })}
          />
        </div>
        <div className="cs-helpers">
          <GameButton
            variant="secondary"
            size="md"
            disabled={state.history.length === 0 || state.pour !== null}
            onClick={() => dispatch({ type: "undo" })}
          >
            Undo
          </GameButton>
          <GameButton
            variant="secondary"
            size="md"
            disabled={state.extraTubeUsed || state.solved || state.pour !== null}
            onClick={() => dispatch({ type: "extraTube" })}
          >
            {state.extraTubeUsed ? "Extra tube used" : "Add extra tube"}
          </GameButton>
          <GameButton variant="ghost" size="md" onClick={() => setOptionsOpen(true)}>
            Options
          </GameButton>
        </div>
        {showWin && (
          <WinCard
            moves={state.moves}
            rank={rank}
            date={date}
            boardVersion={boardVersion}
            onPlayAgain={reset}
            onUndo={() => dispatch({ type: "undo" })}
          />
        )}
        <a
          href="https://freegamestore.online"
          className="cs-credit"
          style={{ color: "var(--muted)" }}
        >
          Built for freegamestore.online
        </a>
        <ParticleLayer ref={particlesRef} />
      </div>
      <OptionsModal
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        settings={settings}
        onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
      />
    </GameShell>
  );
}

function setAttribute(element: HTMLElement, name: string, value: string | null) {
  if (value === null) delete element.dataset[name];
  else element.dataset[name] = value;
}

function WinCard({
  moves,
  rank,
  date,
  boardVersion,
  onPlayAgain,
  onUndo,
}: {
  moves: number;
  rank: number | undefined;
  date: string;
  boardVersion: number;
  onPlayAgain: () => void;
  onUndo: () => void;
}) {
  const card = useRef<HTMLDivElement>(null);

  // Move focus into the card so keyboard players land on the next action.
  useEffect(() => {
    card.current?.focus();
  }, []);

  return (
    <div className="cs-win">
      <div className="cs-win-card" ref={card} tabIndex={-1} aria-labelledby="cs-win-title">
        <h2 id="cs-win-title" style={{ fontFamily: "Fraunces, serif", margin: 0 }}>
          Sorted!
        </h2>
        <p style={{ color: "var(--muted)", margin: "0.25rem 0 0.75rem" }}>
          Solved in {moves} move{moves === 1 ? "" : "s"}.
          {rank !== undefined && <> Ranked #{rank} today.</>}
        </p>
        <DailyBoard date={date} refreshKey={boardVersion} />
        <GameButton variant="primary" size="lg" block onClick={onPlayAgain}>
          Play again
        </GameButton>
        <div style={{ marginTop: "0.5rem" }}>
          <GameButton variant="ghost" size="md" block onClick={onUndo}>
            Undo last pour
          </GameButton>
        </div>
      </div>
    </div>
  );
}
