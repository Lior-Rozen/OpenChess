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
- **Practice:** the drill with hints allowed.
- **Test:** the drill with no hints and no arrow. The run fails at 2 mistakes
  (`TEST_MISTAKE_LIMIT`). A clean run (0 mistakes) counts toward mastery.

### Levels and difficulty
- Each opening has **levels 1…N**. Each line in the content is tagged with `level`
  and `tier` (`main` | `side`).
- A line is **mastered** after K clean Test runs (Easy K=1, Normal K=2, Hard K=3).
- A level is **complete** when all lines in it that count for the chosen mode are mastered.
  That unlocks the next level.
- **Difficulty modes** (chosen per opening, changeable):
  - **Easy:** only `main` tier lines, so fewer lines per level and faster progress.
  - **Normal:** main lines plus key sidelines.
  - **Hard:** all lines, plus the opponent picks a random branch at forks, so every reply must be known.
  - With only two tiers (`main`/`side`), Normal and Hard count the same lines. Hard differs in
    needing 3 clean runs and in how they're earned: lines offer Watch/Practice only, and mastery
    comes from the per-level **"Test level"** run, where the app branches at random and the run
    credits whichever line was played to the end. Any book reply is accepted where lines split on
    the user's move.
- The levels deepen naturally: level 1 is the first 6–8 moves of the main line, and later levels
  add depth and branches.

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
- A classic board in green/cream or brown/beige. Pieces are currently the Unicode chess symbols
  (♔♕♖♗♘♙), drawn by the phone's font, so there are no assets or licences. A flat SVG piece set
  (e.g. cburnett from Lichess, which needs a credit line) can replace them during theme polish.
- One serif or retro font, a muted palette, almost no chrome. The screens:
  **Home** (openings grid + review count) → **Opening** (levels list, mode picker, progress) →
  **Drill** (board, move list, feedback) → **Settings**.

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
  `{ [openingId]: { difficulty, lines: { [lineId]: { cleanRuns, lastPlayed } } } }`. One
  `cleanRuns` counter per line serves every difficulty (switching Easy → Hard needs more runs).
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
