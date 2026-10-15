# Privacy notice for Colour Sort: DRAFT FOR LEGAL REVIEW

> Not reviewed or approved. Do not link from the game or the store listing until
> legal sign-off is recorded in platform issue #193.
>
> **Conflicts to resolve first.** The platform privacy policy at
> `sites/freegamestore/privacy.html` says the platform collects no data, uses
> no accounts, and does not log IP addresses. The leaderboard worker stores an
> IP hash (`ip_hash`), user IDs, display names and avatar URLs. Either the
> platform policy or the leaderboard needs changing. This draft describes the
> leaderboard as it works today.

Last updated: [date of sign-off]

## What stays on your device

Colour Sort saves these in your browser's localStorage. They never leave your device:

- Today's puzzle progress: tube contents, move count, extra-tube use, and undo history, so a reload resumes your game.
- The fewest moves you have posted for each day, so the game does not post the same score again.
- Your options: colour-blind symbols, large touch targets, theme, and reduce motion.

Clear your browser's site data to delete all of this.

## What is sent to the leaderboard

The game sends a score only when you finish the daily puzzle and are signed in to FreeGameStore:

- The number of moves you used, and the date of the puzzle (UTC).

The leaderboard server stores:

- The score and date, and the time of submission.
- Your display name, your FreeGameStore user ID, and your profile picture URL, taken from your FreeGameStore account.
- A hash of your IP address, used to limit how often scores can be posted.

The leaderboard shows today's top scores, with display names and pictures.
If you are signed out, nothing is sent and no score is shown.

[Retention period for scores and IP hashes: to be confirmed by the platform.]

## Cookies and sign-in

Colour Sort does not set cookies. Signing in to FreeGameStore uses the
platform's sign-in session, which is outside this game. [Legal to confirm:
the platform policy says no cookies, but sign-in relies on a session cookie.]

## Third parties

- Fonts load from the Google Fonts CDN. Google may receive your IP address when they load. [Legal to confirm whether this is acceptable under the platform policy.]
- The game has no analytics, advertising, or tracking code.

## Children

[To be confirmed: the age-rating questionnaire, and whether the leaderboard is acceptable for under-13 players.]

## Contact

Questions go to the FreeGameStore GitHub organisation.
