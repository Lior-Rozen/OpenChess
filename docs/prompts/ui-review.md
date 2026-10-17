# UI / UX review (review only, no code changes)

You're reviewing **OpenChess**, an Android app (Expo + React Native) for drilling chess openings by
the book. The opponent is a character, the Mastermind, who plays the book moves while the user
finds theirs. Another session owns the UI code and will implement what the user picks from your
review. **Do not edit any file in `app/`, `content/` or `server/`.** You only write a report and
mocks.

Repo: `C:\Users\lmyhr\dev\chess-openings` (Windows 11, PowerShell 5.1). Read first: `CLAUDE.md`,
`docs/DESIGN.md` (especially the visual direction and the screens), `docs/ROADMAP.md`. The screens
are in `app/src/app/`, the colours in `app/src/theme.ts`. Phone screenshots are in
`docs/screenshots/` (git-ignored).

## Who it's for

- The author and friends, including kids. People should get the basic flow from the buttons
  alone, the way they would in any modern app. Explanations are available when wanted, never
  in the way.
- The developer is fluent in C# and new to mobile. They make the design decisions: propose,
  don't decide.

## What to review

1. **Text:** anything wordy, explanatory or "printed plainly" that could be shorter, hidden
   behind an info icon, or shown visually instead (badges, icons, pips, progress, colour).
2. **Typography and hierarchy:** font choice, sizes, weights, spacing; what should stand out on
   each screen and whether it does.
3. **Layout and flow per screen:** Home, Openings, Opening, Drill (Watch / Practice / Test /
   result card), Free board and its editor, Settings. What a first-time user would miss or
   misread; what's cluttered.
4. **Consistency:** buttons, chips, cards, headers and empty states across screens.
5. **Anything else** that would make it feel more like a polished modern app.

## Constraints to respect

- The theme stays: dark violet "Midnight Arcade" with magenta (the user's actions) and cyan (the
  Mastermind). The board stays as it is; readability comes first. The 8-bit style is only for
  the Mastermind and small accents.
- Expo Go compatibility (Expo SDK 57): only libraries that Expo Go includes. Anything that needs a
  custom native build is out.
- Assets: check `docs/DESIGN.md` for the current licence rule before proposing fonts or icons, and
  say which licence each proposal needs.
- The app works fully offline.

## What to deliver

- `docs/ui-review.md`: findings grouped by screen, each with **what's wrong, why it matters to a
  user, and a concrete fix**. Rank them by impact vs effort, and mark the top 5.
- One HTML mock (in `docs/screenshots/`, so it stays out of git) showing the top changes on the
  2 or 3 most important screens, before and after side by side, in the app's real colours.
- Keep it short and specific. No generic advice; every point should name a screen and an
  element. Don't use the em dash character anywhere.
