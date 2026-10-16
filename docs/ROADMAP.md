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
- [ ] Board component: 8×8, coordinates, flip, piece SVGs
- [ ] Tap-to-move with selected-piece and legal-target highlights, plus last-move highlight
- [ ] chess.js wrapper; promotion handled (auto-queen is fine for book lines)
- [ ] Dev screen for free play on the board; Jest tests for the wrapper
- **Done when:** a legal game can be played on the phone by tapping.

## Phase 3: Trainer with one opening
- [ ] `content/openings/french.json` (3–5 lines), `content/index.json`, content loader
- [ ] `content/validate.ts` validation script
- [ ] Trainer state machine (watch/practice/test, mistakes, hint after 2 errors) with Jest tests
- [ ] Drill screen: opponent auto-moves, feedback animations, move list, line-complete card
- **Done when:** a French line can be drilled start to finish, with wrong moves rejected.

## Phase 4: Levels, modes, progress
- [ ] Mastery rules and level unlocking (derived from progress)
- [ ] Mode picker (Easy/Normal/Hard) and Hard-mode random branches
- [ ] Local persistence of progress
- [ ] Home and Opening screens
- **Done when:** completing level 1 on Easy unlocks level 2, and progress survives an app restart.

## Phase 5: Content expansion
- [ ] ~10–12 openings × 2–4 levels each (see the starter set in DESIGN.md §4)
- [ ] All content passes validation
- **Done when:** every opening in the starter set is playable.

## Phase 6: Retention and polish
- [ ] Review queue (SRS: 1d → 3d → 7d → 21d)
- [ ] Stats per opening, random drill
- [ ] Sounds/haptics with an off switch; Settings screen
- [ ] Theme polish and app icon
- [ ] First `eas build -p android --profile preview` APK shared with a friend
- **Done when:** a friend has the APK installed and working.

## Phase 7: Real backend
- [ ] `GET /api/content/index` and `GET /api/content/openings/{id}` served from `content/`
- [ ] Versioned content caching in the app (falls back to bundled content offline)
- [ ] Optional: accounts, progress sync, friend leaderboard (EF Core + SQLite/Postgres)
- [ ] Optional: deploy (e.g. Azure App Service free tier or Fly.io)
- **Done when:** a new opening added on the server appears in the app without an app update.
