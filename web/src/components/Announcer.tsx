import { useEffect } from "react";
import { useGameSounds, useSound } from "@freegamestore/games";
import type { Cue } from "../game/a11y";

// Reads each change aloud through a polite live region and plays its sound cue.
// Sits inside GameShell, which provides the sound context.
export function Announcer({ cue }: { cue: Cue | null }) {
  const { muted } = useSound();
  const { playMove, playDrop, playError, playLevelUp, playTick, playScore } = useGameSounds();

  useEffect(() => {
    // Sounds respect the platform mute toggle (see AUDIO_MUTE_POLICY).
    if (!cue || muted) return;
    switch (cue.kind) {
      case "select":
        playMove();
        break;
      case "pour":
        playDrop();
        break;
      case "invalid":
        playError();
        break;
      case "undo":
        playTick();
        break;
      case "extraTube":
        playScore();
        break;
      case "solved":
        playLevelUp();
        break;
      case "deselect":
        break;
    }
  }, [cue]);

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {cue?.text}
    </div>
  );
}
