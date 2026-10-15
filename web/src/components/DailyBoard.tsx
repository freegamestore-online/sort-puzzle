import { useEffect, useState } from "react";
import { fetchDailyBoard, type DailyEntry } from "../game/leaderboard";

interface DailyBoardProps {
  date: string;
  /** Changes after a score is posted, so the board reloads. */
  refreshKey: number;
}

// Today's fewest-moves board. Renders nothing when the board is empty or
// unavailable, so a failed fetch never shows an error to the player.
export function DailyBoard({ date, refreshKey }: DailyBoardProps) {
  const [entries, setEntries] = useState<DailyEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetchDailyBoard(date, 5).then((rows) => {
      if (!cancelled) setEntries(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [date, refreshKey]);

  if (entries.length === 0) return null;

  return (
    <div className="cs-board-list">
      <h3>Today&rsquo;s fewest moves</h3>
      <ol>
        {entries.map((entry, index) => (
          <li key={`${entry.player_name}-${entry.created_at}-${index}`}>
            <span>{entry.player_name}</span>
            <span>{entry.moves}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
