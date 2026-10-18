# Phase 5: Opening content (prompt for the chess content session)

You're working on **Chess Openings Trainer**, an Android app (Expo + TypeScript) for drilling chess
openings by the book. There is no engine: every opening line is JSON data. The app's opponent
character, **the Mastermind**, plays the opponent's book moves, and the user must find their own
book replies. Your job in this session is the **chess content**: writing accurate, well-structured
opening lines. The app code is finished for this phase. Don't change it beyond registering new files.

Repo: `C:\Users\lmyhr\dev\chess-openings` (Windows, PowerShell). Read `CLAUDE.md`,
`docs/DESIGN.md` (§3 Product design, §4 Content format) and `docs/ROADMAP.md` (Phase 5) first.
Look at `content/openings/french.json` as the reference example.

## Goal

Roughly 10–12 openings, 2–4 levels each, all passing validation. The starter set (DESIGN.md §4):

- **As White:** Italian Game, Ruy Lopez, London System, Queen's Gambit
- **As Black:** French Defense (exists, review it), Caro-Kann, Sicilian (Najdorf or Dragon basics),
  Scandinavian, King's Indian Defense, Slav

## Work with the user, one opening at a time

The user knows chess and wants to make the repertoire choices. For each opening:

1. **Propose a plan first:** a short table of levels → lines (name, tier, how deep, the key
   branch points), plus any repertoire choices you need from them (e.g. Najdorf or Dragon; against
   the Italian, 3…Bc5 or 3…Nf6; which Caro-Kann main line). Wait for approval.
2. Write the JSON, register it, run the checks (below), and show the user a compact summary of
   every line in move-list form, so they can review the chess.
3. Commit, e.g. `Content: add Caro-Kann (3 levels, 10 lines)`.

Start with the **French review**:
- The five level 1 lines need checking.
- The two level 2 lines (`french-advance-be2`, `french-winawer-qg4`) are **placeholders**. Their
  summaries say so. Keep, fix or replace them.

## How the app uses the content (this shapes the lines)

- **`side`** is the user's side. The Mastermind plays every move of the other side.
- **Levels are the only progression.** Level 1 is the first 6–8 moves (12–16 plies) of the
  most important lines. Later levels go **deeper** (continuing level 1 lines; every line is
  replayed from move 1) and add **more branches**. Each opening should have 2–4 levels.
- **Tiers:**
  - `main` lines are **required**: mastering every main line of a level unlocks the next level.
  - `side` lines are optional **bonus** lines, for useful but less common opponent tries.
  - Every level needs at least one main line (the validator enforces this).
  - Aim for roughly 2–4 main lines and 0–3 bonus lines per level.
- **Lines in the same level form a tree** for the optional **level exam**:
  - Where lines split on the **opponent's** move, the Mastermind picks a branch at random.
    Design these forks deliberately: they are how the user learns to meet different replies.
  - Where lines split on the **user's** move, any of the book replies is accepted.
- **Keep the user's repertoire consistent.** In a given position, the user has one book move in
  every line of the opening, so they learn one answer per position (the compiler enforces it).
  Other good moves there go in as accepted alternatives (`{@alt}`), not as a second book move.
- **End every line on the user's move**, so the user plays the final move.
- The user meets each line as Watch (notes shown) → Practice (hints allowed) → Test (no help,
  fails at 2 mistakes). One clean Test masters a line.

## Content format

Write each opening as **PGN**: `content/pgn/<id>.pgn`. Run `npm run build-content` in `app/` to
compile it into `content/openings/<id>.json`, which the app bundles. Never edit the JSON by hand:
`validate-content` fails if it's out of date. The format is in DESIGN.md §4 and
`app/src/content/pgn.ts`; `content/pgn/french.pgn` is a full example.

```
[Id "caro-kann"]
[Name "Caro-Kann Defense"]
[Side "black"]
[ECO "B10-B19"]
[Description "One sentence, shown on the Opening screen."]
[Tags "solid, beginner-friendly"]

1. e4 c6 2. d4 d5 3. e5 {@variation Advance} 3... Bf5 {…Bf5 develops the bishop outside the chain.}
  (3... c5 {@alt})
4. Nf3 e6
{@line id=caro-kann-advance-main level=1 tier=main name="Short System" summary="One-sentence takeaway."} *
```

- **Lines:** a line is every move from the start to a `{@line …}` comment, which must follow one
  of the user's moves. Deeper lines continue past a shallower line's `@line`. Every branch must
  end in a `@line` (the compiler checks).
- **Opponent branches** are ordinary `( … )` variations. They're how the user meets different
  replies, so give the common replies their own branches instead of picking just one.
- **Accepted alternatives:** where the user has another good move, add it as a one-move variation
  marked `{@alt}`. The app doesn't count it as a mistake, and the line goes on with the book
  move. Use this freely for sound alternatives, so the user isn't punished for a good move.
- **Known mistakes:** where club players often go wrong at the user's move, add the bad move as a
  one-move variation `(5. d4 {@mistake …Qh4+! forces your king to move.})`. It still counts as a
  mistake, but the drill shows the reason. Keep it to 1–3 per opening, only moves that are both
  common (club data) and clearly worse (engine), with a reason of about 10 words. **Start the
  reason with the punishing reply in SAN** (`…Qh4+! …`): the app draws that move as a red arrow.
- **Variations:** `{@variation Name}` on a move names every line through it, and the Opening
  screen groups lines under it. Keep line names short within it, e.g. "6.Be2" under "Advance".
- **Ids:** kebab-case. The opening `[Id]` matches the file name. Line ids are unique across all
  files, e.g. `<opening>-<variation>-<detail>`. Never rename an existing line id: progress is
  saved by id.
- **Moves:** standard SAN (`+` for check, `#` for mate, `Ngf3` when needed, `O-O`).
- **Notes:** a plain `{comment}` after a move is its note. Follow these rules:
  - Write one sentence on *why* the move is played.
  - A note is shared by every line through its move. Put notes on key moves only (about 2–4
    new ones per line), and none on obvious moves.
  - Write Black moves as `…c5` and White moves as `Nf3`.
  - The audience is club players: plain words, no engine numbers.
  - **Arrows:** when a note warns about or points to a move, draw it with Lichess's markup inside
    the note: `{Nf3 stops …Qh4+. [%cal Rd8h4]}`. Colours: `R` a threat, `G` a good move or plan,
    `Y` a key square or idea, `B` neutral. Several arrows: `[%cal Rd8h4,Ge1g1]`. Lichess studies
    export this markup when you draw arrows, so it survives a round trip. Use it on notes that
    name a move the user should see (about one per line at most); not on every note.
- **`summary=`:** every line needs one: a single sentence with the plan or idea to remember.
- **`tags`** (opening level): labels the Openings screen filters by. Give every opening 1–3 from
  the fixed list in `app/src/content/types.ts`:
  - `gambit`: gives up material early for initiative
  - `aggressive`, `solid`, `positional`
  - `system`: the same setup against almost anything, like the London
  - `beginner-friendly`
  
  Confirm the tags with the user as part of each opening's plan, and add them to the French
  during its review. If a useful label is missing, propose adding it to the list rather than
  inventing one.

## Chess accuracy (the most important part)

- Use mainstream, sound theory. The opponent's moves should be the **most common practical
  replies** at club level. Lichess or master database popularity is a good guide, so a line
  shouldn't be built around a rare opponent move unless it's a known trap worth knowing (mark
  those `side`).
- Prefer solid, principled repertoire choices over sharp memorisation-heavy lines, unless the
  user asks otherwise.
- If you have tools to check an opening explorer or database, use them. **If you're unsure of a
  move, say so and ask. Never invent theory.** At the end of each opening, flag any line you're
  less than confident about. Where two sound moves are both common, use an `{@alt}` (for the
  user) or a second branch (for the opponent) rather than flagging it. When you do flag lines,
  give each one in full from move 1, numbered, with the move to check from, so the user can
  paste it into an opening explorer.
- The validator proves moves are **legal**, not that they're **good**. The chess review is on you
  and the user.

## Registering a new opening (the only code you touch)

1. Write `content/pgn/<id>.pgn` and run `npm run build-content`.
2. Add it to `content/index.json`:
   `{ "id": "...", "name": "...", "side": "white|black", "file": "openings/<id>.json" }`.
3. Import it in `app/src/content/loader.ts` and add it to the `bundledByFile` map. Metro can't
   import by a computed path, and a Jest test fails if an index entry isn't bundled.

If you think the content format or the app needs a change (e.g. a third tier), **propose it to
the user. Don't implement it.**

## Checks before every commit

From `app/`:

```powershell
npm run validate-content   # replays every line, names the exact illegal move
npm test
npm run typecheck
npm run lint
```

All must pass. Don't skip or weaken tests.

## Done

Phase 5 is done when every opening in the starter set is in, all checks pass, and the user has
reviewed the lines. Tick the Phase 5 checkboxes in `docs/ROADMAP.md` when they're done. The
user does the final check on the phone (every opening playable via Watch/Practice/Test).
