import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDailyBoard, GAME_ID, SCORE_BASE, submitDailyMoves, type FetchLike } from './leaderboard.ts';

const DATE = '2026-10-15';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function mockFetch(response: Response | Error) {
  return vi.fn<FetchLike>(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
}

describe('submitDailyMoves', () => {
  let consoleSpies: Array<ReturnType<typeof vi.spyOn>>;

  beforeEach(() => {
    // "Invalid game" and other failures must be silent: nothing reaches the console.
    consoleSpies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
    ];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts an inverted score tagged with the day, using the cookie session', async () => {
    const fetchImpl = mockFetch(jsonResponse(200, { ok: true, rank: 3 }));
    const result = await submitDailyMoves(DATE, 12, fetchImpl);

    expect(result).toEqual({ ok: true, rank: 3 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://leaderboard.freegamestore.online/v1/api/scores');
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('include');
    expect(JSON.parse(String(init?.body))).toEqual({
      game: GAME_ID,
      score: SCORE_BASE - 12,
      period: DATE,
    });
  });

  it('treats an unpublished game ("Invalid game", 400) as a quiet failure', async () => {
    const fetchImpl = mockFetch(jsonResponse(400, { error: 'Invalid game' }));
    await expect(submitDailyMoves(DATE, 12, fetchImpl)).resolves.toEqual({ ok: false });
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('treats a signed-out user (401) as a quiet failure', async () => {
    const fetchImpl = mockFetch(jsonResponse(401, { error: 'Sign in required' }));
    await expect(submitDailyMoves(DATE, 12, fetchImpl)).resolves.toEqual({ ok: false });
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('treats a network error as a quiet failure', async () => {
    const fetchImpl = mockFetch(new TypeError('Failed to fetch'));
    await expect(submitDailyMoves(DATE, 12, fetchImpl)).resolves.toEqual({ ok: false });
    for (const spy of consoleSpies) expect(spy).not.toHaveBeenCalled();
  });

  it('does not send invalid move counts', async () => {
    const fetchImpl = mockFetch(jsonResponse(200, { ok: true }));
    for (const moves of [0, -1, 1.5, SCORE_BASE, Number.NaN]) {
      await expect(submitDailyMoves(DATE, moves, fetchImpl)).resolves.toEqual({ ok: false });
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('fetchDailyBoard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requests the day board and maps scores back to moves, fewest first', async () => {
    const fetchImpl = mockFetch(
      jsonResponse(200, {
        game: GAME_ID,
        scores: [
          { player_name: 'Ada', score: SCORE_BASE - 9, created_at: '2026-10-15T10:00:00Z' },
          { player_name: 'Bo', score: SCORE_BASE - 4, created_at: '2026-10-15T11:00:00Z' },
          { player_name: 'Cy', score: SCORE_BASE - 7, created_at: '2026-10-15T12:00:00Z' },
        ],
      }),
    );

    const board = await fetchDailyBoard(DATE, 5, fetchImpl);

    const [url] = fetchImpl.mock.calls[0]!;
    expect(url).toContain(`/api/leaderboard/${GAME_ID}?limit=5&period=${DATE}`);
    expect(board.map((entry) => [entry.player_name, entry.moves])).toEqual([
      ['Bo', 4],
      ['Cy', 7],
      ['Ada', 9],
    ]);
  });

  it('drops rows that cannot be real move counts', async () => {
    const fetchImpl = mockFetch(
      jsonResponse(200, {
        scores: [
          { player_name: 'Ghost', score: SCORE_BASE, created_at: '2026-10-15T10:00:00Z' },
          { player_name: 'Real', score: SCORE_BASE - 6, created_at: '2026-10-15T10:00:00Z' },
        ],
      }),
    );
    const board = await fetchDailyBoard(DATE, 5, fetchImpl);
    expect(board.map((entry) => entry.player_name)).toEqual(['Real']);
  });

  it('returns an empty board on any failure, without throwing', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(fetchDailyBoard(DATE, 5, mockFetch(jsonResponse(400, { error: 'Invalid game' })))).resolves.toEqual([]);
    await expect(fetchDailyBoard(DATE, 5, mockFetch(new TypeError('offline')))).resolves.toEqual([]);
    expect(quiet).not.toHaveBeenCalled();
  });
});
