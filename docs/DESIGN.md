# OpenChess: Design

## Context
A personal Android app (for the author and friends) for drilling chess openings "by the book".
No engine, no heavy compute: every opening line is stored as data, and the app plays the
opponent's book moves while the user has to find theirs. Levels unlock more lines. The look is
dark, modern and minimal, with an 8-bit Mastermind: focused on the drill, not on features.

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
- **Sharing with friends:** `eas build -p android --profile preview` (in `app/`) builds an
  installable APK in the cloud (free tier). Send the link or file; friends allow "install unknown
  apps". This is only needed at milestones. Set up: `app/eas.json` (the `preview` profile builds
  an APK), Android package `com.liorrozen.openchess`, and the EAS project linked in `app.json`
  (owner `bearerofagonies`, slug `chess-openings`; keep the slug, it identifies the EAS project).

## 3. Product design

### Core loop: the drill
1. Pick an opening (e.g. French). The app knows the user's side (French means playing Black) and
   flips the board.
2. The app plays the opponent's moves from the line, with a short delay and an animation.
3. The user moves by **tap-to-move** (tap a piece, then tap a target; drag can come later).
4. A move is checked by comparing it with the expected book move. Board legality comes from chess.js.
   - Correct: the move plays and the line continues.
   - Wrong: the board shakes or flashes red, the move is undone, and the mistake is counted.
     In Practice, after 2 wrong tries (configurable in Settings), the correct move is shown as an
     arrow and must be played. A **known mistake** (`mistakes` in the content) shows its reason, and
     the punishing reply the reason opens with ("…Qh4+! forces…") appears as a **red arrow**.
   - A move's note stays on screen through the Mastermind's reply, until a newer note or the
     user's next move.
5. The line ends with a result card: the outcome, badges (CLEAN, MASTERED, LEVEL N UNLOCKED,
   ★ EXAM PASSED), the line's takeaway as a tip, and **Next line** (the next line to learn in the
   same opening; "Next random" after a random drill).

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
- **Level exam (optional, earns a ★):** a Test over the level's main lines (bonus lines stay
  optional everywhere).
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
(`Avatar.tsx`, no licensed artwork). Settings has an on/off switch for his talk; off, he still plays, silently.

### Additions (cheap to maintain)
- **Review queue (spaced repetition, parked):** mastered lines would come back after 1d → 3d →
  7d → 21d; a failed review drops the interval one step and the line stays mastered.
- **Move notes:** optional one-line "why" notes on key moves in the JSON.
- **Stats per opening (parked):** % mastered, accuracy, streak of training days.
- **Random drill:** a random line from everything unlocked, in its suggested mode.
- **Sounds and haptics** on move, mistake and line complete, each with an off switch. The sounds are
  original, soft on purpose (a two-note chime, a muted thud, a wooden tock), synthesised by
  `tools/make_sounds.py` into `app/assets/sounds/`. They mix with other
  audio and stay quiet when the phone is on silent.

### Out of scope / deferred
- No engine, no game analysis, no online play: out of scope for good.
- No accounts in v1. They come in phase 7, only if sync or friend leaderboards are wanted.
- No drag-to-move in v1 (tap-to-move is simpler and reliable on phones).

### Visual direction (dark, modern, minimal)
- **Readability first:** the board and pieces must be clear and easy to see for everyone, so no
  pixel art on the board. The 8-bit style belongs to the Mastermind and small accents only.
- **A board of its own:** not green (that's chess.com's look). The board is violet (`#b9a6d6` /
  `#5e3b8c`), with neon accents: magenta for the last move and selection, cyan for the hint arrow.
- **Motion:** the Mastermind's moves, and stepping forward in Watch, slide the piece into place
  (200 ms, ease-out). The user's own moves, stepping back and jumping land at once.
- **Pieces:** PNG images in `app/assets/pieces/` (`wK.png` … `bP.png`), cut from a public piece
  sheet the user supplied. They're about 65 px, so slightly soft when scaled up; kept as they are
  (there's no larger copy of the same set).
- **Palette ("Midnight Arcade", chosen in phase 6):** dark violet-black background (`#130c20`),
  violet cards with a thin border, near-white text. **Magenta** (`#ff40c8`) is the user's colour:
  main buttons (with a soft glow), progress bars, selection. **Cyan** (`#00e5ff`) is the
  Mastermind's: his name, his speech bubble's edge, his eyes, the hint arrow, the blinking cursor
  after "Hello, friend.". The app is dark-only. **Every colour is a named token in
  `app/src/theme.ts`** (the board's too), so the palette changes in one place. Readability first.
  The font is **Inter** (`theme.font` / `fontMedium` / `fontSemi` / `fontBold`, loaded in
  `app/_layout.tsx`, only those 4 weights bundled), with monospace for the 8-bit accents.
- **Opening icons:** each opening has an original 8-bit icon (16 × 16 pixel art drawn as code in
  `app/src/openings/icons.ts`, colours in `theme.pixel`): French baguette, Caro-Kann shield,
  Sicilian lemon, Scandinavian longship, King's Indian elephant, Slav matryoshka, Italian pizza,
  Ruy Lopez Spanish guitar, Vienna coffee, London double-decker, Queen's Gambit crown, Alapin
  lemonade, Scotch whisky glass, English teacup, Nimzo-Indian lotus, QGD castle tower. The map
  lives in the app, not the content, so a new opening shows a magenta pawn until it gets one.
  Shown on the Openings cards and the Home Continue button.
- **Licences for assets:** CC0/public domain or the user's own art, plus free open licences that
  need no visible credit: **OFL** fonts (Inter; licence text in `app/assets/fonts/`) and **MIT**
  icons (Expo's Ionicons). Never the *Mr. Robot* show's art.
- **Modern, not wordy:** explanations live behind an ⓘ (a "How it works" sheet), not printed on
  screens; information is shown as badges, pills, progress bars and icons where possible.
- One font, a muted palette, almost no chrome. The screens:
  - **Home:** the Mastermind and "Hello, friend.", one big magenta **Continue** button (straight
    into the next suggested line and mode, with that opening's icon; before the first line is
    played it's **Pick an opening** instead), then **Openings**, **Random
    drill** and **Free board** as icon rows, and a settings icon.
  - **Openings:** the grid, with % mastered, grouped under AS WHITE and AS BLACK. Filter chips at
    the top (always visible) for side, first move and style tags. Within side and first move,
    several chips mean "any of them"; each tag narrows further (an opening needs all picked tags).
    Each card shows its first move and tags. The logic is `app/src/openings/filter.ts`.
  - **Opening:** Level → Variation → stage tiles. Each line is a numbered tile ("1.2" = level 1,
    line 2; main lines first, then bonus) in its variation's row; a variation's bonus lines join
    its row as dashed tiles, so each variation shows once per level. A tile's colour is its state
    (green ✓ mastered, magenta "next", magenta outline started, plain new, dim with a lock in a
    locked level) and its dots are Watch / Practice / Test. Tapping a tile opens its **line card**
    (a bottom sheet): "VIENNA 1.2 · VIENNA GAMBIT", the line, its moves, the takeaway as a tip,
    Watched / Practised / Mastered, and Watch / Practice / Test with the suggested one in magenta.
    Levels and variations fold (the level being worked on starts open; choices are remembered per
    opening in `ui:folds:v1`). The level exam (its main lines, random replies) is one row at the
    bottom of the level. Explanations sit behind the header's ⓘ. Logic: `src/openings/stages.ts`.
  - **Drill:** a header with the opening's icon and name over the line; the Mastermind's bubble;
    a mode badge (WATCH / PRACTICE / TEST / EXAM), the status, and in Test one pip per allowed
    mistake that fills red; the board; the move's note; the move list; the result card.
  - **Free board:** free play for both sides, with Take back (one move at a time, any time,
    checkmate included), Flip board, New game and **Edit position**. The editor starts from the
    current position: drag pieces in from a pool of all 12, drag them around, drag one off the
    board to remove it; choose who moves; Start position and Clear. "Play from here" checks one
    king each, no pawns on the edge ranks, and that the side not to move isn't in check. Castling
    is allowed where king and rook are home. Take back stops at the set-up position. **Save**
    keeps the board (with a name) and **Saved** lists them to load or delete; stored on the device
    under `editor:positions:v1`, as the editor's board, so unfinished setups can be saved too.
  - **Settings:** the Mastermind's speed (Slow / Normal / Fast; his pause before a move and
    Watch's pace), board coordinates on/off, when the Practice arrow appears (after 1 try, 2, or
    never; the Hint button always works); Sounds and Vibration switches; whether the Mastermind talks (on/off; off, he
    still plays and his bubble just shows "…"); Reset progress,
    which must be held for 2 seconds (no popup, no accidents); the server status. Saved on the
    device under `settings:v1`.

## 4. Content format
**Source: PGN.** Each opening is written as `content/pgn/<id>.pgn`, a normal PGN tree (open it in
a Lichess study or any PGN editor), and `npm run build-content` in `app/` compiles it into
`content/openings/<id>.json`, which the app bundles. Edit the PGN, never the JSON:
`validate-content` fails if the JSON is out of date. The rules live in `app/src/content/pgn.ts`.

```
[Id "french"] [Name "French Defense"] [Side "black"] [ECO "C00-C19"]
[Description "Solid defence: …"] [Tags "solid, positional"]

1. e4 e6 {…e6 prepares …d5.} 2. d4 d5 3. e5 {@variation Advance}
  (3. Nc3 {@variation Winawer} 3... Bb4 {@line id=french-winawer-main level=1 tier=main name="Winawer Variation" summary="…"})
3... c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 c4 (6... Bd7 {@alt})
{@line id=french-advance-main level=1 tier=main name="Advance Variation" summary="…"} *
```
- A plain `{comment}` is the note on the move before it (one sentence, *why* the move is played).
- `[%cal Rd8h4,Ge1g1]` inside a note (Lichess markup) draws arrows with it: R threat, G good,
  Y key idea, B neutral. It's shown in Watch and in the drill while the note is up; `[%csl …]` is
  ignored.
- `{@variation Name}` names the variation of every line through that move; the Opening screen
  groups lines under it, so line names can be short ("6.Be2" under "Advance").
- `{@line id=… level=… tier=main|side name="…" summary="…"}` ends a line at that move (it must
  be the user's move). A line is every move from the start to its `@line`; deeper lines simply
  continue past a shallower line's `@line`.
- Opponent alternatives are ordinary `( … )` variations, and each must end in a `@line`.
- `( … {@alt})`: a one-move variation on the user's move is an **accepted alternative**: also a
  good move, not a mistake. The app says so and shows the book move, and the line goes on with it.
- The compiler enforces **one book move per position for the user**, also across transpositions.

The compiled JSON, `content/openings/french.json`:
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
- `variation` (optional) groups lines on the Opening screen; `lineTitle()` shows "Variation: name".
- `accept` (optional) maps a ply index of a user move to other good moves (SAN). Playing one is
  not a mistake: the book move is shown as an arrow (also in Test) and the run stays clean.
- `mistakes` (optional) maps a ply index of a user move to known mistakes: SAN to a one-line
  reason. Playing one still counts as a mistake, but the drill shows the reason ("d4? …Qh4+! …").
- Watch stays the clean textbook pass (book moves and notes only); the card at its end adds one
  "Good to know" row listing the line's other good moves and known mistakes.
- `arrows` (optional) maps a ply index to the arrows of that move's note (from `[%cal]`).
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
- The set (phase 5, 16 openings): as White, Italian, Ruy Lopez, Vienna, London, Queen's Gambit,
  Sicilian Alapin, Scotch, English; as Black, French, Caro-Kann, Sicilian Najdorf, Scandinavian,
  King's Indian, Slav, Nimzo-Indian, Queen's Gambit Declined.

## 5. Architecture
```
chess-openings/
  app/                 Expo + TS (expo-router, Expo SDK 57: must match the SDK the Play Store Expo Go supports)
    src/app/           screens (expo-router routes; only route files live here)
    src/api/           server calls (always optional: offline must work)
    src/chess/         board, pieces, chess.js wrapper, tap-to-move, board editor
    src/trainer/       drill state machine (watch/practice/test/exam)
    src/drill/         the drill screens' parts (Watch and Trainer runs, header, result card)
    src/progress/      mastery, levels, next/random line, storage
    src/content/       loads bundled content, PGN compiler, validation
    src/openings/      opening icons, the Openings filter, Opening screen folds
    src/mastermind/    his lines, avatar, speech bubble
    src/settings/      settings model and storage
    src/feedback/      sounds and haptics
    src/components/    Button, Chip, and shared UI (badges, ⓘ sheet, icons)
    assets/            pieces, sounds, icons, the Inter font licence
  server/              ASP.NET Core Minimal API (.NET 10)
    ChessOpenings.Api/
    ChessOpenings.Api.Tests/   xUnit
  content/             pgn/ (source), openings/ (compiled JSON), index.json, build.ts, validate.ts
  tools/               make_sounds.py, make_icons.py (regenerate the app's sounds and icons)
  docs/                DESIGN.md, ROADMAP.md, prompts/ (session prompts)
  CLAUDE.md
```
- **The trainer is a pure-TS state machine** (no React inside). It takes a line, mode and moves,
  and returns state and events. That makes it unit-testable with Jest; it is the heart of the app.
- **Progress model** (`app/src/progress/mastery.ts`, saved with AsyncStorage under `progress:v1`):
  `{ [openingId]: { lines: { [lineId]: { cleanRuns, watched, practiced, lastPlayed } }, examsPassed: number[] } }`.
  A review queue would add `intervalDays` and `due` (parked). Unlocked levels are *derived* from
  this, never stored. Other device storage: `settings:v1` (Settings) and `ui:folds:v1` (the
  Opening screen's folds).
- **Backend (phase 1):** `GET /api/health` and `GET /api/hello` → `{ "message": "hello friend" }`.
  **Later:** `GET /api/content/index`, `GET /api/content/openings/{id}` (served from the same
  `content/` folder, so the app can pull new openings without an app update), then optional
  accounts (`POST /api/auth/...`), `PUT /api/progress` sync, friend leaderboards, with SQLite or
  Postgres via EF Core.

## 6. Conventions for implementation agents
- TypeScript strict, ESLint + Prettier. Jest for app logic. xUnit for the server.
- Each phase ends with: tests green, the app running in Expo Go, and a git commit.
- Don't add features outside the current phase. Tick `docs/ROADMAP.md` checkboxes when finished.
