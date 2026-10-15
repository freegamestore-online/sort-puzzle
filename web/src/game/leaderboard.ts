// Daily leaderboard for Colour Sort: fewest moves per UTC day.
//
// This calls the documented leaderboard endpoints (platform API-CONTRACT.md, v1
// paths) directly rather than the SDK's useLeaderboard hook. The installed
// @freegamestore/games (0.16.0) has no `period` option, so the hook can only
// reach the all-time board. The daily board needs `period`.
//
// Boards sort by score, highest first, so fewest moves is posted as
// SCORE_BASE - moves and converted back for display.

export const GAME_ID = 'sort-puzzle';
const API_BASE = 'https://leaderboard.freegamestore.online/v1';

/** Any move count below this maps to a non-negative score. */
export const SCORE_BASE = 100_000;

export interface DailyEntry {
  player_name: string;
  moves: number;
  created_at: string;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

/**
 * Posts today's solve. Returns { ok: false } quietly on any failure: an
 * unpublished game ("Invalid game"), signed-out users (401), rate limits, or a
 * network error. The game does not show these.
 */
export async function submitDailyMoves(
  date: string,
  moves: number,
  fetchImpl: FetchLike = defaultFetch,
): Promise<{ ok: boolean; rank?: number }> {
  if (!Number.isInteger(moves) || moves < 1 || moves >= SCORE_BASE) return { ok: false };
  try {
    const res = await fetchImpl(`${API_BASE}/api/scores`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ game: GAME_ID, score: SCORE_BASE - moves, period: date }),
    });
    if (!res.ok) return { ok: false };
    const data = (await res.json()) as { ok?: boolean; rank?: number };
    if (data.ok === false) return { ok: false };
    return data.rank === undefined ? { ok: true } : { ok: true, rank: data.rank };
  } catch {
    return { ok: false };
  }
}

/** Today's fewest-moves board, best first. Returns [] on any failure. */
export async function fetchDailyBoard(
  date: string,
  limit = 10,
  fetchImpl: FetchLike = defaultFetch,
): Promise<DailyEntry[]> {
  try {
    const res = await fetchImpl(
      `${API_BASE}/api/leaderboard/${GAME_ID}?limit=${limit}&period=${encodeURIComponent(date)}`,
      { credentials: 'include' },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as {
      scores?: Array<{ player_name: string; score: number; created_at: string }>;
    };
    return (data.scores ?? [])
      .map((row) => ({
        player_name: row.player_name,
        moves: SCORE_BASE - row.score,
        created_at: row.created_at,
      }))
      .filter((entry) => entry.moves >= 1 && entry.moves < SCORE_BASE)
      .sort((a, b) => a.moves - b.moves);
  } catch {
    return [];
  }
}
