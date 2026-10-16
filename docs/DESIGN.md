# Chess Openings Trainer — Design

## Context
A personal Android app (for the author and friends) for drilling chess openings "by the book".
No engine, no heavy compute: every opening line is stored as data, and the app plays the
opponent's book moves while the user has to find theirs. Levels unlock more lines, and a
difficulty mode decides how many variations must be learned. The look is old-school and
minimal: focused on the drill, not on features.

## 1. Decisions
| Topic | Decision | Why |
|---|---|---|
| Platform | Android only | Free sideloading of APKs to friends |
| Frontend | **Expo (React Native) + TypeScript** | Most common choice; live reload on the phone through the Expo Go app, so no APK per change |
| Backend | **ASP.NET Core (.NET 10 LTS) Minimal API, C#** | Author's strongest language; set up as a skeleton now, given real work in phase 7 |
| Chess rules | **chess.js** (small rules library, not an engine) | Applies SAN moves correctly (castling, en passant, promotion) and gives the board position |
| Content | JSON files in `content/` | Easy to write, check and version; bundled into the app and served by the backend later |
| Progress storage (v1) | On the device (AsyncStorage, or expo-sqlite if it grows) | Works offline; sync comes later |
| Repo | Monorepo at `C:\Users\lmyhr\dev\chess-openings` with git | Outside OneDrive (node_modules + sync = pain) |

**Offline-first principle:** the app must work fully with no server. The backend adds content
updates and sync later, but it is never required to train.

## 2. Testing on the phone (no APK shuffling)
- **Daily dev:** install **Expo Go** from the Play Store. Run `npx expo start` on the PC and scan
  the QR code. The app opens on the phone and reloads live on every save. PC and phone must be on
  the same Wi-Fi (or use `npx expo start --tunnel`).
- **Phone → local backend:** run the server bound to `http://0.0.0.0:5080` and allow port 5080
  in Windows Firewall (private network). The app reads `EXPO_PUBLIC_API_URL=http://<PC-LAN-IP>:5080`
  from `app/.env`.
- **Sharing with friends:** `eas build -p android --profile preview` builds an installable APK
  in the cloud (free tier). Send the link or file; friends allow "install unknown apps".
  This is only needed at milestones.

## 3. Product design

### Core loop: the drill
1. Pick an opening (e.g. French). The app knows the user's side (French means playing Black) and
   flips the board.
2. The app plays the opponent's moves from the line, with a short delay and an animation.
3. The user moves by **tap-to-move** (tap a piece, then tap a target; drag can come later).
4. A move is checked by comparing it with the expected book move. Board legality comes from chess.js.
   - Correct: the move plays and the line continues.
   - Wrong: the board shakes or flashes red, the move is undone, and the mistake is counted.
     After 2 wrong tries, the correct move is shown as an arrow and must be played.
5. The line ends with a "Line complete" card showing mistakes and the short note for that line.

### Learning modes per line
- **Watch:** the app plays the whole line with move notes. Used the first time a line is met.
  It has player controls (start, back, pause/play, forward, end), and stepping by hand pauses
  the autoplay.
- **Practice:** the drill with hints allowed.
- **Test:** the drill with no hints and no arrow. The run fails at 2 mistakes
  (`TEST_MISTAKE_LIMIT`). A clean run (0 mistakes) counts toward mastery.

### Levels (the only progression; there is no difficulty picker)
- Each opening has **levels 1…N**. Each line in the content is tagged with `level`
  and `tier` (`main` | `side`).
- Levels are where "harder" lives: level 1 is the first 6–8 moves of the main lines, and later
  levels go deeper and add branches. (An Easy/Normal/Hard picker was tried in phase 4 and
  dropped: it duplicated what levels already do.)
- A line is **mastered** after **one clean Test run**.
- **Main lines are required:** a level is **complete** when all its main lines are mastered,
  and that unlocks the next level. **Sidelines are optional bonus lines.** Every level needs at
  least one main line (the validator checks this).
- **Level exam (optional, earns a ★):** a Test over every line of the level, main and bonus.
  The Mastermind picks his moves at random wherever the lines split, so every reply must be known.
  Any book reply is accepted where lines split on the user's move. A clean exam also masters the
  line it ended in.
- The app suggests the next step for each line: Watch it first, then Practice, then Test.

### The Mastermind
The opponent is a character: **the Mastermind**, a quiet, terse, slightly paranoid hacker type
(inspired by Elliot from *Mr. Robot*). Every run opens with **"Hello, friend."** He speaks one
short line only at key moments: the start of a run, a mistake, a hint, a clean finish, a failed
test, a mastered line, an unlocked level, a passed exam. He never talks on ordinary moves. His
lines live in `app/src/mastermind/lines.ts`, and he's drawn as an original 8-bit hooded figure
(`Avatar.tsx`, no licensed artwork). A setting to quiet him comes with Settings in phase 6.

### Additions (cheap to maintain)
- **Review queue (spaced repetition):** mastered lines come back after 1d → 3d → 7d → 21d.
  A failed review drops the interval. The home screen shows "5 lines to review".
- **Move notes:** optional one-line "why" notes on key moves in the JSON.
- **Stats per opening:** % mastered, accuracy, streak of training days.
- **Random drill:** a random line from everything unlocked.
- **Sounds and haptics** on move, mistake and line complete, with an off switch.

### Out of scope / deferred
- No engine, no game analysis, no online play: out of scope for good.
- No accounts in v1. They come in phase 7, only if sync or friend leaderboards are wanted.
- No drag-to-move in v1 (tap-to-move is simpler and reliable on phones).

### Visual direction ("old-school, simple")
- **Readability first:** the board and pieces must be clear and easy to see for everyone, so no
  pixel art on the board. The 8-bit style belongs to the Mastermind and small accents only.
- **A board of its own:** not green (that's chess.com's look). The board is violet (`#b9a6d6` /
  `#5e3b8c`), with neon accents: magenta for the last move and selection, cyan for the hint arrow.
- **Pieces:** PNG images in `app/assets/pieces/` (`wK.png` … `bP.png`), cut from a public piece
  sheet the user supplied. They're about 65 px, so slightly soft when scaled up. A higher-resolution
  or SVG version would be sharper.
- **Palette ("Midnight Arcade", chosen in phase 6):** dark violet-black background (`#130c20`),
  violet cards with a thin border, near-white text. **Magenta** (`#ff40c8`) is the user's colour:
  main buttons (with a soft glow), progress bars, selection. **Cyan** (`#00e5ff`) is the
  Mastermind's: his name, his speech bubble's edge, his eyes, the hint arrow, the blinking cursor
  after "Hello, friend.". The app is dark-only. **Every colour is a named token in
  `app/src/theme.ts`** (the board's too), so the palette changes in one place. Readability first.
  Fonts are the phone's serif (text) and monospace (8-bit accents); a custom font would need a
  CC0 licence.
- **Opening icons:** each opening has an original 8-bit icon (16 × 16 pixel art drawn as code in
  `app/src/openings/icons.ts`, colours in `theme.pixel`): French baguette, Caro-Kann shield,
  Sicilian lemon, Scandinavian longship, King's Indian elephant, Slav matryoshka, Italian pizza,
  Ruy Lopez Spanish guitar, Vienna coffee, London double-decker, Queen's Gambit crown. The map
  lives in the app, not the content, so a new opening shows a magenta pawn until it gets one.
  Shown on the Openings cards and the Home Continue button.
- One serif or retro font, a muted palette, almost no chrome. The screens:
  - **Home:** the Mastermind and "Hello, friend.", one big **Continue** button (straight into
    the next suggested line and mode), **Openings**, **Free board**, a ⚙ for Settings, and
    (phase 6) **Review** with the due count.
  - **Openings:** the grid, with % mastered, grouped under AS WHITE and AS BLACK. Filter chips at
    the top (always visible) for side, first move and style tags. Within side and first move,
    several chips mean "any of them"; each tag narrows further (an opening needs all picked tags).
    Each card shows its first move and tags. The logic is `app/src/openings/filter.ts`.
  - **Opening:** levels, main and bonus lines, exam.
  - **Drill:** the Mastermind's line, board, move list, result card.
  - **Free board:** free play for both sides, with Take back (one move at a time, any time,
    checkmate included), Flip board and New game.
  - **Settings:** a placeholder until phase 6. It holds the server status.

## 4. Content format
`content/openings/french.json`:
```json
{
  "id": "french",
  "name": "French Defense",
  "side": "black",
  "eco": "C00-C19",
  "description": "Solid defence: 1.e4 e6 2.d4 d5.",
  "lines": [
    {
      "id": "french-advance-main",
      "name": "Advance Variation",
      "level": 1,
      "tier": "main",
      "moves": ["e4","e6","d4","d5","e5","c5","c3","Nc6","Nf3","Qb6"],
      "notes": { "5": "…c5 strikes at the d4 base of the chain." },
      "summary": "Attack the base of the chain: …c5, …Nc6 and …Qb6 all hit d4."
    }
  ]
}
```
- `moves` uses SAN from the starting position. `notes` keys are ply indices (0-based).
- `summary` (optional) is the short takeaway shown on the "Line complete" card.
- `tags` (optional, opening level) are labels for filtering on the Openings screen, from a fixed
  vocabulary in `app/src/content/types.ts` (`OPENING_TAGS`): `gambit` (gives up material early),
  `aggressive`, `solid`, `positional`, `system` (same setup against almost anything),
  `beginner-friendly`. The validator rejects unknown tags. The side (White/Black) and the first
  move (1.e4/1.d4/…) are filters too, but they come from `side` and the lines, not from tags.
- `content/index.json` lists the openings, with a `contentVersion` number.
- **Validation script** (`content/validate.ts`, run before commit with `npm run validate-content`
  in `app/`): every line replays legally in chess.js, ids are unique, levels are contiguous, and
  the moves for `side` are not empty. The rules live in `app/src/content/validateContent.ts`, so
  Jest also validates the bundled content.
- **Bundling:** `app/metro.config.js` lets Metro read `../content`, and every opening file in
  `index.json` must also be imported in `app/src/content/loader.ts` (Metro can't import by a
  computed path). A Jest test fails if one is missing.
- Starter set (phase 5, ~10–12 openings): as White, Italian, Ruy Lopez, London, Queen's Gambit;
  as Black, French, Caro-Kann, Sicilian (Najdorf/Dragon basics), Scandinavian, King's Indian, Slav.

## 5. Architecture
```
chess-openings/
  app/                 Expo + TS (expo-router, Expo SDK 57: must match the SDK the Play Store Expo Go supports)
    src/app/           screens (expo-router routes; only route files live here)
    src/api/           server calls (always optional: offline must work)
    src/chess/         board component, chess.js wrapper, move matching
    src/trainer/       drill state machine (watch/practice/test)
    src/progress/      mastery, levels, SRS scheduling, storage
    src/content/       loads bundled content (later: fetch + cache from API)
  server/              ASP.NET Core Minimal API (.NET 10)
    ChessOpenings.Api/
    ChessOpenings.Api.Tests/   xUnit
  content/             opening JSON + index.json + validate.ts
  docs/                DESIGN.md, ROADMAP.md
  CLAUDE.md
```
- **The trainer is a pure-TS state machine** (no React inside). It takes a line, mode and moves,
  and returns state and events. That makes it unit-testable with Jest; it is the heart of the app.
- **Progress model** (`app/src/progress/mastery.ts`, saved with AsyncStorage under `progress:v1`):
  `{ [openingId]: { lines: { [lineId]: { cleanRuns, watched, practiced, lastPlayed } }, examsPassed: number[] } }`.
  Phase 6 adds the SRS fields (`intervalDays`, `due`). Unlocked levels are *derived* from this,
  never stored.
- **Backend (phase 1):** `GET /api/health` and `GET /api/hello` → `{ "message": "hello friend" }`.
  **Later:** `GET /api/content/index`, `GET /api/content/openings/{id}` (served from the same
  `content/` folder, so the app can pull new openings without an app update), then optional
  accounts (`POST /api/auth/...`), `PUT /api/progress` sync, friend leaderboards, with SQLite or
  Postgres via EF Core.

## 6. Conventions for implementation agents
- TypeScript strict, ESLint + Prettier. Jest for app logic. xUnit for the server.
- Each phase ends with: tests green, the app running in Expo Go, and a git commit.
- Don't add features outside the current phase. Tick `docs/ROADMAP.md` checkboxes when finished.
