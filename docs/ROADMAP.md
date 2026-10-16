# Roadmap

One agent per phase. Each phase is done when its tests pass, its "done when" check works on the
phone in Expo Go, and it is committed. See `DESIGN.md` for the details behind each item.

## Phase 1: "Hello friend" infra ← start here
- [x] Prereqs installed: Node LTS, .NET 10 SDK, Git, Expo Go on the phone
- [x] `git init` at the repo root, plus a `.gitignore` for Node and .NET
- [x] `app/`: `npx create-expo-app@latest app --template blank-typescript` (or the expo-router template)
- [x] One screen: big "Hello friend" text, and below it "Server says: …" fetched from `/api/hello`
      (or "Server offline" if the fetch fails), with the URL taken from `EXPO_PUBLIC_API_URL`
- [x] `server/`: Minimal API (`dotnet new web`) with `GET /api/health` and `GET /api/hello`,
      CORS allowed for dev, bound to `0.0.0.0:5080`
- [x] `server/ChessOpenings.Api.Tests`: one xUnit test using `WebApplicationFactory`
- [x] README with exact run steps: firewall rule for port 5080, finding the LAN IP with `ipconfig`,
      `app/.env`, `npx expo start`, `dotnet run`
- **Done when:** the phone shows "Hello friend" and "Server says: hello friend".

## Phase 2: Board
- [x] Board component: 8×8, coordinates, flip, pieces (Unicode chess symbols for now: no image
      files or licence; a drawn piece set can come with the phase 6 theme polish)
- [x] Tap-to-move with selected-piece and legal-target highlights, plus last-move highlight
- [x] chess.js wrapper; promotion handled (auto-queen is fine for book lines)
- [x] Dev screen for free play on the board; Jest tests for the wrapper
- **Done when:** a legal game can be played on the phone by tapping.

## Phase 3: Trainer with one opening
- [x] `content/openings/french.json` (3–5 lines), `content/index.json`, content loader
- [x] `content/validate.ts` validation script
- [x] Trainer state machine (watch/practice/test, mistakes, hint after 2 errors) with Jest tests
- [x] Drill screen: opponent auto-moves, feedback animations, move list, line-complete card
      (plus a minimal Opening screen listing the lines; phase 4 builds it out)
- **Done when:** a French line can be drilled start to finish, with wrong moves rejected.

## Phase 4: Levels, modes, progress
- [x] Mastery rules and level unlocking (derived from progress)
- [x] Test-mode mistake threshold: Test stops behaving like Practice. Too many mistakes fails
      the run instead of showing the arrow (for now a flat limit of 2, `TEST_MISTAKE_LIMIT`;
      it could later depend on difficulty)
- [x] Mode picker (Easy/Normal/Hard) and Hard-mode random branches
- [x] Local persistence of progress
- [x] Home and Opening screens
- Note: the two level 2 French lines are placeholders to exercise unlocking. Review them in the
  chess content session.
- **Done when:** completing level 1 on Easy unlocks level 2, and progress survives an app restart.

## Phase 4b: Rework (levels only, the Mastermind, a real Home)
- [x] Drop the Easy/Normal/Hard picker: levels are the only progression. One clean Test masters
      a line, main lines are required to unlock the next level, sidelines are optional bonus lines
- [x] Hard-mode random branches become the optional **level exam** (★)
- [x] The Mastermind: opponent character with an 8-bit avatar, "Hello, friend." at the start of
      every run, one short line at key moments
- [x] New Home: Continue (next suggested line and mode), Openings, Free board, ⚙ Settings
      placeholder; the openings grid moves to its own screen
- [x] Watch player: pause/play, step back and forth (|◁ ◁ ❙❙/▷ ▷ ▷|); stepping pauses autoplay
- **Done when:** Continue walks a new user through Watch → Practice → Test of the first line,
  and mastering level 1's main lines unlocks level 2.

## Phase 5: Content expansion
Run this in a dedicated chess session: start it with "Read docs/prompts/phase5-content.md and follow it."
- [x] Review the French (5 level 1 lines + 2 placeholder level 2 lines)
- [x] Tag every opening (`tags`: gambit, aggressive, solid, positional, system, beginner-friendly)
- [x] ~10–12 openings × 2–4 levels each (see the starter set in DESIGN.md §4)
- [x] All content passes validation
- **Done when:** every opening in the starter set is playable.

## Phase 6: Retention and polish
Run this in a dedicated UI/front-end session (also used for later UI work): start it with
"Read docs/prompts/ui-frontend.md and follow it."
- [ ] Review queue (SRS: 1d → 3d → 7d → 21d). A review is a normal Test run (same rules)
- [ ] Stats per opening, random drill
- [ ] Openings filter: chips on the Openings screen for side (White/Black), first move
      (1.e4/1.d4/…, derived from the lines) and tags (gambit, aggressive, solid, …)
- [ ] Sounds/haptics with an off switch; Settings screen (including quieting the Mastermind)
- [ ] Review button on Home with the due count
- [ ] Theme polish and app icon: **a unique, darker look**. No chess.com green and no bright,
      casual cream. A dark theme with purple/magenta and neon/retro accents across every screen
      (background, cards, buttons, fonts, the Mastermind's speech), readable first
  - [x] Dark "Midnight Arcade" palette on every screen, all colours as tokens in `theme.ts`
  - [ ] App icon (waits for the user's art)
- [ ] Opening icons: an original 8-bit/neon SVG icon per opening (baguette for the French, …),
      kept in the app (not the content JSON) with a fallback icon. Shown on the Openings cards
      and the Home Continue button
- [ ] Art, with no credit line needed (CC0/public domain, or made by the user):
  - [x] **Pieces:** cut from the user's public piece sheet into `app/assets/pieces/`; violet
    board with neon highlights applied. Optional upgrade: a sharper (higher-res or SVG) version.
    CC0 alternatives if ever needed:
    - RhosGFX Vector Chess Pieces: https://rhosgfx.itch.io/vector-chess-pieces
    - Screaming Brain 2D Chess Pack: https://opengameart.org/content/2d-chess-pack
  - **Mastermind avatar and app icon:** supplied by the user. Transparent square PNG (pixel art
    scaled to 512 px without smoothing) or SVG. Optional expressions (neutral, smug, disappointed).
    Icon: 1024 px, plus a transparent foreground layer for Android.
- [ ] First `eas build -p android --profile preview` APK shared with a friend
- **Done when:** a friend has the APK installed and working.

## Phase 7: Real backend
- [ ] `GET /api/content/index` and `GET /api/content/openings/{id}` served from `content/`
- [ ] Versioned content caching in the app (falls back to bundled content offline)
- [ ] Optional: accounts, progress sync, friend leaderboard (EF Core + SQLite/Postgres)
- [ ] Optional: deploy (e.g. Azure App Service free tier or Fly.io)
- **Done when:** a new opening added on the server appears in the app without an app update.

## Ideas (not scheduled, not in v1)
- **Kids mode** on the home screen: a simpler, friendlier presentation for children. Needs a
  design pass first: which openings, how simple, whether it has its own progress.
- **Recharging test energy:** Test runs cost a charge that refills over time, to encourage
  spaced practice. Needs thought: it could feel like a mobile-game gate, it overlaps with the
  review queue (phase 6), and it should never block Practice or Watch.
- **Board editor:** set up any position on the Free board (place and remove pieces, side to move).
- **Mastermind artwork:** replace the drawn 8-bit avatar with real retro art (must be original or
  properly licensed, not the show's merchandise art).
