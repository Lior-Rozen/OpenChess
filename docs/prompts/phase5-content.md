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
- **Keep the user's repertoire consistent.** In a given position, the user's move should be the
  same in every line of the opening, so they learn one answer per position. Only offer two user
  moves for the same position if the user explicitly asks for it.
- **End every line on the user's move**, so the user plays the final move.
- The user meets each line as Watch (notes shown) → Practice (hints allowed) → Test (no help,
  fails at 2 mistakes). One clean Test masters a line.

## Content format

One file per opening in `content/openings/<id>.json`. The format is in DESIGN.md §4:

```json
{
  "id": "caro-kann",
  "name": "Caro-Kann Defense",
  "side": "black",
  "eco": "B10-B19",
  "description": "One sentence, shown on the Opening screen.",
  "lines": [
    {
      "id": "caro-kann-advance-main",
      "name": "Advance Variation",
      "level": 1,
      "tier": "main",
      "moves": ["e4", "c6", "d4", "d5", "e5", "Bf5"],
      "notes": { "5": "…Bf5 develops the light-squared bishop outside the pawn chain." },
      "summary": "One-sentence takeaway shown on the 'Line complete' card."
    }
  ]
}
```

- **Ids:** kebab-case. The opening `id` matches the file name. Line ids are unique across all
  files, e.g. `<opening>-<variation>-<detail>`.
- **`moves`:** standard SAN from the starting position, both sides:
  - Use `+` for check and `#` for mate.
  - Disambiguate when required (`Ngf3`, `Nbd7`).
  - Castling is `O-O` / `O-O-O`.
- **`notes`:** keyed by **0-based ply index** (ply 0 is White's first move, ply 1 is Black's
  first move). Follow these rules:
  - Write one sentence on *why* the move is played.
  - Add 2–4 notes per line, on the key moves only, and none on obvious moves.
  - Write Black moves as `…c5` and White moves as `Nf3`.
  - The audience is club players: plain words, no engine numbers.
- **`summary`:** give every line one, a single sentence with the plan or idea to remember.
  (It's optional in the schema, but treat it as required.)
- **`name`:** short and recognisable, e.g. "Advance Variation", "Tarrasch: Open (3…c5)".

## Chess accuracy (the most important part)

- Use mainstream, sound theory. The opponent's moves should be the **most common practical
  replies** at club level. Lichess or master database popularity is a good guide, so a line
  shouldn't be built around a rare opponent move unless it's a known trap worth knowing (mark
  those `side`).
- Prefer solid, principled repertoire choices over sharp memorisation-heavy lines, unless the
  user asks otherwise.
- If you have tools to check an opening explorer or database, use them. **If you're unsure of a
  move, say so and ask. Never invent theory.** At the end of each opening, flag any line you're
  less than confident about.
- The validator proves moves are **legal**, not that they're **good**. The chess review is on you
  and the user.

## Registering a new opening (the only code you touch)

1. Add it to `content/index.json`:
   `{ "id": "...", "name": "...", "side": "white|black", "file": "openings/<id>.json" }`.
2. Import it in `app/src/content/loader.ts` and add it to the `bundledByFile` map. Metro can't
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
