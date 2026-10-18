# Content tools

Helper scripts for building opening content from real game data. They are plain Node scripts
(Node 18+), run from the repo root, e.g. `node tools/content/x.mjs "e4 e5 Nc3"`. The content
format itself is in `docs/prompts/phase5-content.md` (Content format).

## Data sources

- **Club games:** the Lichess opening explorer, at ratings 1600–2000 for blitz, rapid and
  classical games.
- **Engine:** Lichess cloud evaluations.
- **Token:** both need a personal Lichess token (create it with no scopes ticked), read from
  `%USERPROFILE%\.lichess_token`.
- **Saved answers:** they go to `cache/`, which is git-ignored, so repeat runs are fast.
- **Rate limit:** the scripts pause between requests and wait a minute when Lichess says "too
  many requests".

## Scripts

| Script | What it does |
|---|---|
| `x.mjs "<moves>" …` | Looks up one or more positions. Prints the club move shares and the engine's top moves; each argument is a position as space-separated SAN moves. |
| `audit.mjs [opening-id]` | Walks every line of every opening (or one). Flags opponent moves that aren't the top club reply, user moves that aren't top choices, and popular replies (15%+) that no line covers. |
| `mistakes.mjs` | Finds common club mistakes at the user's moves: moves played by at least `MIN_SHARE`% (default 10) that lose at least `MIN_LOSS` pawns (default 0.6) by the engine. Prints each with the engine's refutation. `ONLY=id1,id2` limits it to some openings. |
| `register.mjs <opening-id>` | Registers a new opening in `content/index.json` and `app/src/content/loader.ts`. Run it after `npm run build-content` has made its JSON. |
| `icons-gen.mjs` | Renders pixel-icon candidates (edit the `candidates` object) next to the existing icons, to `cache/icon-candidates.html`. |

## Typical flow for a new or rebuilt opening

1. Explore the tree with `x.mjs`, using the most common club reply at each opponent fork and
   checking your moves with the engine.
2. Write `content/pgn/<id>.pgn`, then run `npm run build-content` in `app/`.
3. For a new opening, run `register.mjs <id>` and add an icon in
   `app/src/openings/icons.ts` (`icons-gen.mjs` helps choose one).
4. Run `audit.mjs <id>` and `mistakes.mjs` with `ONLY=<id>` to find gaps and known mistakes.
5. Run the checks in `app/`: `validate-content`, `test`, `typecheck` and `lint`.
