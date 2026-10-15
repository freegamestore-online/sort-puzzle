import { useEffect, useMemo, useReducer, useState } from "react";
import {
  GameButton,
  GameShell,
  GameTopbar,
  useGameSounds,
  useSound,
} from "@freegamestore/games";
import { ColourSortBoard } from "./components/ColourSortBoard";
import { DailyBoard } from "./components/DailyBoard";
import { dailyKey, dailyLevel } from "./game/level";
import {
  colourSortReducer,
  POUR_MS,
} from "./game/colourSortState";
import {
  defaultStorage,
  loadBestMoves,
  restoreState,
  saveBestMoves,
  saveState,
} from "./game/progress";
import { submitDailyMoves } from "./game/leaderboard";

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

  // Clear the pour animation so the next tap is accepted.
  useEffect(() => {
    if (!state.pour) return;
    const timer = setTimeout(() => dispatch({ type: "pourEnd" }), POUR_MS);
    return () => clearTimeout(timer);
  }, [state.pour]);

  const reset = () => {
    setRank(undefined);
    dispatch({ type: "reset", level });
  };
  const showWin = state.solved && state.pour === null;

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Colour Sort"
          stats={[{ label: "Moves", value: state.moves, accent: true }]}
          rules={
            <p>
              Tap a tube to select it, then tap another tube to pour its top
              colour there. Pour only onto an empty tube or the same colour.
              Sort every tube so each holds one colour.
            </p>
          }
          onRestart={reset}
        />
      }
    >
      <SoundCues pourId={state.pour?.id ?? null} solved={state.solved} />
      <div className="cs-play">
        <ColourSortBoard
          state={state}
          onTap={(index) => dispatch({ type: "tap", index })}
        />
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
      </div>
    </GameShell>
  );
}

// Sound must sit inside GameShell, which provides the sound context.
function SoundCues({
  pourId,
  solved,
}: {
  pourId: number | null;
  solved: boolean;
}) {
  const { muted } = useSound();
  const { playDrop, playLevelUp } = useGameSounds();

  useEffect(() => {
    if (pourId !== null && !muted) playDrop();
  }, [pourId]);

  useEffect(() => {
    if (solved && !muted) playLevelUp();
  }, [solved]);

  return null;
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
  return (
    <div className="cs-win" role="status">
      <div className="cs-win-card">
        <h2 style={{ fontFamily: "Fraunces, serif", margin: 0 }}>Sorted!</h2>
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
