# UI / front-end session (Phase 6 and beyond)

You're working on **Chess Openings Trainer**, an Android app for drilling chess openings by the
book. There is no engine: opening lines are JSON data. The opponent is a character, **the
Mastermind**, who plays the book moves, while the user must find theirs. This session owns the
**app's UI, front end and polish**. It starts with **Phase 6** and then continues with ongoing UI
improvements and final touches.

Repo: `C:\Users\lmyhr\dev\chess-openings` (Windows 11, PowerShell 5.1). Read these first:
`CLAUDE.md`, `docs/DESIGN.md`, `docs/ROADMAP.md`, `README.md`.

## Who you're working with

The developer is fluent in C# and **new to mobile/front-end**:
- Explain mobile-specific steps explicitly (Expo Go, EAS builds, Android permissions, asset sizes).
- They test on an Android phone through **Expo Go** on the same Wi-Fi. You can't see the phone,
  so ask for a screenshot when a visual result matters.
- They make the design decisions. For anything visual and non-trivial (a colour palette, a
  layout change, a new screen), **propose first**. Where you can, show options: render a
  preview image (e.g. with PowerShell + System.Drawing, or a small HTML mock) and let them choose.
  Small, obvious fixes don't need sign-off.

## Current state (all built, tested and committed)

- **Phases 1–4b are done:** the drill trainer, levels, saved progress, the Mastermind, Home.
  Phase 5 (chess content) runs in a separate session; don't edit `content/` except to fix a
  clear bug, and tell the user if you do.
- **Screens** (`app/src/app/`, expo-router):
  - `index.tsx`: Home (Mastermind, Continue, Openings, Free board, ⚙)
  - `openings.tsx`: the openings grid
  - `opening/[id].tsx`: levels, main and bonus lines, exam
  - `drill.tsx`: picks `WatchRun` or `TrainerRun` from `src/drill/`
  - `free-board.tsx`: free play for both sides
  - `settings.tsx`: placeholder
- **Building blocks:**
  - `src/chess/`: `Board.tsx` (board colours live here), `Piece.tsx` (PNG pieces in
    `app/assets/pieces/`), `game.ts` (the chess.js wrapper), `tapToMove.ts`
  - `src/trainer/`: `trainer.ts` (Practice/Test/exam state machine), `watch.ts` (Watch frames)
  - `src/progress/`: `mastery.ts` (pure rules), `storage.ts` (AsyncStorage), `ProgressContext.tsx`
  - `src/mastermind/`: `lines.ts` (everything he says), `Avatar.tsx` (8-bit placeholder), `Speech.tsx`
  - `src/components/Button.tsx`, `src/theme.ts` (app colours: currently a light cream theme)
- **Tests:** about 74 Jest tests covering the logic.

## Phase 6 scope (see ROADMAP.md for the checkboxes)

1. **Review queue:** spaced repetition, with intervals of 1d → 3d → 7d → 21d. A failed review
   drops the interval. **A review is a normal Test run.** Don't add a gentler mode; the user
   rejected that. This extends the progress model with `intervalDays` and `due`.
   - Keep the logic pure in `src/progress/` with Jest tests.
   - Add a **Review** button on Home with the due count.
2. **Stats per opening:** % mastered, accuracy, a streak of training days. Add a **random drill**
   from everything unlocked.
   - **Openings filter:** chips on the Openings screen, combinable, for:
     - side (White/Black)
     - first move (1.e4/1.d4/…), worked out from the lines' first move
     - the opening's `tags` (`OPENING_TAGS` in `src/content/types.ts`: gambit, aggressive,
       solid, …)
     
     Keep the filtering logic a pure, tested function. The chess session fills in the tags.
3. **Sounds and haptics** on move, mistake and line complete, with off switches.
4. **The real Settings screen:**
   - sound, haptics, and how much the Mastermind talks (e.g. full / key moments only / silent)
   - reset progress, with a confirmation
   - the server status, which already lives there
5. **Theme: a unique, darker look.**
   - Not chess.com green, and not the current bright cream, which feels casual.
   - A **dark theme with purple/magenta and neon/retro accents** across every screen:
     background, cards, buttons, fonts, the Mastermind's speech. The board is already violet
     (`#b9a6d6` / `#5e3b8c`) with neon magenta/cyan highlights. Make the rest match.
   - **Readability comes first:** the board and pieces must stay clear for everyone. No pixel
     art on the board; the 8-bit style is only for the Mastermind and small accents.
   - Move colours into `src/theme.ts` as named tokens (including the board's), so the palette
     changes in one place.
   - Small animations are welcome, e.g. the Mastermind's pieces sliding instead of jumping.
6. **Art and app icon:**
   - The user will supply the Mastermind avatar (and maybe expressions) and the icon art. Wire
     them in when they arrive.
   - Sharper pieces are an optional upgrade.
7. **First installable APK** via `eas build -p android --profile preview`:
   - This needs `eas.json` (an APK "preview" profile), an Android package name in `app.json`,
     and the user's Expo account.
   - Walk the user through it step by step.
   - Done when a friend has it installed and working.

After Phase 6, the session continues with UI improvements the user asks for. Ideas parked in
the ROADMAP (board editor, kids mode, test energy) are **not** in scope unless the user pulls
them in.

## Rules and constraints

- **Assets:** only CC0/public domain, or art the user made. Never use the *Mr. Robot* show's
  official art. This applies to sounds too.
- **Expo Go compatibility:**
  - The project is on **Expo SDK 57**, because that's what the Play Store Expo Go runs.
  - Only use libraries that Expo Go includes (e.g. `expo-haptics`, `expo-audio`,
    `react-native-svg`, `react-native-reanimated`), and install them with
    `npx expo install <pkg>`, never with plain `npm install`, so the versions match the SDK.
  - Anything that needs a custom native build breaks Expo Go. Ask the user first.
  - When the Play Store Expo Go moves to SDK 58, upgrade with `npx expo install expo@^58.0.0 --fix`.
- **React compiler is on:**
  - Keep render pure: read from React state snapshots, not from mutable objects or refs.
  - Mutate game or trainer objects only in event handlers or effects, then set state from a
    fresh snapshot (see `TrainerRun.tsx`).
  - Use `useEffectEvent` for timer callbacks.
- **Architecture:**
  - Game and trainer logic stays pure TypeScript with no React, covered by Jest.
  - Unlocked levels are derived from progress, never stored.
  - **The app must work fully offline**; the server is optional.
  - Don't add features outside the current item.
- **Typed routes:** after adding or renaming a screen, run `npx expo start` once (it regenerates
  the route types) before `npm run typecheck`.
- **Bundler config changes** (e.g. `metro.config.js`) need `npx expo start -c`.
- **PowerShell 5.1:** no `&&`. Chain commands with `;` or `if ($?) { … }`.

## Checks before every commit

From `app/`:

```powershell
npm test
npm run typecheck
npm run lint
npm run validate-content
```

Also run a quick bundle check:
`npx expo export --platform android --output-dir <a temp folder>`.

All checks must pass. Commit each item separately with a clear message, tick the matching
checkbox in `docs/ROADMAP.md`, and update `docs/DESIGN.md` when a design decision changes. End
each item by telling the user exactly what to look at on the phone.
