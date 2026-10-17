// Relative imports only: this file also runs outside the app, via content/build.ts.
import { ChessGame } from '../chess/game';
import type { Opening, OpeningLine, Side, Tier } from './types';

/*
 * Opening sources are PGN files with variations (content/pgn/<id>.pgn), compiled into the
 * opening JSON the app bundles. Any PGN editor (a Lichess study, ChessBase) can open them.
 *
 * Headers: [Id "french"] [Name "French Defense"] [Side "black"] [ECO "C00-C19"]
 *          [Description "…"] [Tags "solid, positional"]
 *
 * Moves are a normal PGN tree. Comments after a move:
 *   {plain text}           the move's note
 *   {@variation Advance}   names the variation of every line through this move
 *   {@line id=french-advance-main level=1 tier=main name="Advance Variation" summary="…"}
 *                          a line ends at this move (it must be the user's move)
 *   {@alt}                 on the first move of a one-move variation: an accepted
 *                          alternative to the user's book move it replaces
 *
 * Every branch must end with a @line. Where it's the user's move there is one book move
 * (plus any @alt moves), and the same position, however it's reached, must get the same one.
 */

type Node = {
  san: string;
  parent: Node | null;
  children: Node[];
  comments: string[];
};

export type CompileResult = { opening: Opening | null; errors: string[] };

const RESULTS = new Set(['*', '1-0', '0-1', '1/2-1/2']);

export function compilePgn(text: string, file: string): CompileResult {
  const errors: string[] = [];
  const headers = parseHeaders(text);
  const root = parseMoves(text.replace(/^\s*\[[^\]]*\]\s*$/gm, ''), file, errors);
  if (!root) return { opening: null, errors };

  for (const key of ['Id', 'Name', 'Side', 'ECO', 'Description']) {
    if (!headers[key]) errors.push(`${file}: header [${key}] is missing`);
  }
  const side = headers.Side as Side;
  if (headers.Side && side !== 'white' && side !== 'black') errors.push(`${file}: [Side] must be "white" or "black"`);
  const userParity = side === 'white' ? 0 : 1;

  const lines: OpeningLine[] = [];
  const bookMoveAt = new Map<string, { san: string; where: string }>();

  // Depth-first, main continuation before variations, so shallow lines come before deeper ones.
  const visit = (node: Node, game: ChessGame, path: Node[], sans: string[]) => {
    const nextPly = path.length - 1;
    const where = `${file} ${moveLabel(sans.length - 1, sans[sans.length - 1] ?? '')}`;
    const fen = game.position().fen.split(' ').slice(0, 4).join(' ');
    const book = node.children.filter((c) => !isAlt(c));
    const alts = node.children.filter(isAlt);
    const userToMove = nextPly % 2 === userParity;

    if (userToMove && book.length > 0) {
      if (book.length > 1) {
        errors.push(`${where}: ${book.map((c) => c.san).join(' and ')} are both book moves for you; mark one {@alt}`);
      }
      const resolved = game.resolveSan(book[0].san)?.san ?? book[0].san;
      const seen = bookMoveAt.get(fen);
      if (seen && seen.san !== resolved) {
        errors.push(`${where}: you play ${resolved} here but ${seen.san} at ${seen.where} (same position)`);
      } else if (!seen) bookMoveAt.set(fen, { san: resolved, where });
    }
    for (const alt of alts) {
      if (alt.children.length > 0) errors.push(`${where}: the @alt move ${alt.san} must be a one-move variation`);
      if (!userToMove) errors.push(`${where}: @alt ${alt.san} is not your move`);
      if (book.length === 0) errors.push(`${where}: @alt ${alt.san} has no book move to replace`);
      if (!game.resolveSan(alt.san)) errors.push(`${where}: @alt ${alt.san} is illegal`);
    }

    if (node.parent) {
      for (const comment of node.comments) {
        if (comment.startsWith('@line')) {
          const line = makeLine(comment, path, sans, userParity, where, errors);
          if (line) lines.push(line);
        }
      }
      if (book.length === 0 && !node.comments.some((c) => c.startsWith('@line'))) {
        errors.push(`${where}: the branch ends without a {@line …}`);
      }
    }

    for (const child of book) {
      const move = game.playSan(child.san);
      if (!move) {
        errors.push(`${file} ${moveLabel(sans.length, child.san)}: illegal move`);
        continue;
      }
      visit(child, game, [...path, child], [...sans, move.san]);
      game.undo();
    }
  };
  visit(root, new ChessGame(), [root], []);

  const opening: Opening = {
    id: headers.Id ?? '',
    name: headers.Name ?? '',
    side,
    eco: headers.ECO ?? '',
    description: headers.Description ?? '',
    ...(headers.Tags ? { tags: headers.Tags.split(',').map((t) => t.trim()) as Opening['tags'] } : {}),
    lines,
  };
  return { opening, errors };
}

const isAlt = (node: Node) => node.comments.includes('@alt');

/** "5.Nf3" or "5…Qb6" for a 0-based ply. */
function moveLabel(ply: number, san: string): string {
  if (ply < 0) return 'start';
  return `${Math.floor(ply / 2) + 1}${ply % 2 === 0 ? '.' : '…'}${san}`;
}

function makeLine(
  directive: string,
  path: Node[],
  sans: string[],
  userParity: number,
  where: string,
  errors: string[],
): OpeningLine | null {
  const fields = parseFields(directive.slice('@line'.length));
  for (const key of ['id', 'level', 'tier', 'name', 'summary']) {
    if (!fields[key]) errors.push(`${where}: @line is missing ${key}=`);
  }
  if ((sans.length - 1) % 2 !== userParity) errors.push(`${where}: line ${fields.id} ends on the opponent's move`);
  if (fields.tier && fields.tier !== 'main' && fields.tier !== 'side') {
    errors.push(`${where}: @line tier must be main or side`);
  }
  if (!fields.id) return null;

  const notes: Record<string, string> = {};
  const accept: Record<string, string[]> = {};
  let variation: string | undefined;
  path.slice(1).forEach((node, ply) => {
    const note = node.comments.filter((c) => !c.startsWith('@')).join(' ');
    if (note) notes[ply] = note;
    const named = node.comments.find((c) => c.startsWith('@variation'));
    if (named) variation = named.slice('@variation'.length).trim();
    const alts = node.parent!.children.filter(isAlt).map((a) => a.san);
    if (alts.length > 0) accept[ply] = alts;
  });

  return {
    id: fields.id,
    name: fields.name ?? '',
    level: Number(fields.level),
    tier: fields.tier as Tier,
    ...(variation ? { variation } : {}),
    moves: sans,
    ...(Object.keys(notes).length > 0 ? { notes } : {}),
    ...(Object.keys(accept).length > 0 ? { accept } : {}),
    summary: fields.summary,
  };
}

/** key=value pairs; values are bare words or "quoted strings" (\" inside quotes). */
function parseFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const m of text.matchAll(/(\w+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g)) {
    fields[m[1]] = m[2] !== undefined ? m[2].replace(/\\"/g, '"') : m[3];
  }
  return fields;
}

function parseHeaders(text: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const m of text.matchAll(/^\s*\[(\w+)\s+"((?:[^"\\]|\\.)*)"\]\s*$/gm)) headers[m[1]] = m[2].replace(/\\"/g, '"');
  return headers;
}

function parseMoves(text: string, file: string, errors: string[]): Node | null {
  const root: Node = { san: '', parent: null, children: [], comments: [] };
  let current = root;
  const stack: Node[] = [];

  for (const m of text.matchAll(/\{([^}]*)\}|\(|\)|;[^\n]*|\$\d+|[^\s(){};]+/g)) {
    const token = m[0];
    if (m[1] !== undefined) current.comments.push(m[1].replace(/\s+/g, ' ').trim());
    else if (token === '(') {
      if (!current.parent) {
        errors.push(`${file}: a variation starts before any move`);
        return null;
      }
      stack.push(current);
      current = current.parent;
    } else if (token === ')') {
      const back = stack.pop();
      if (!back) {
        errors.push(`${file}: unmatched ")"`);
        return null;
      }
      current = back;
    } else if (token.startsWith(';') || token.startsWith('$') || RESULTS.has(token)) continue;
    else {
      const san = token.replace(/^\d+\.+/, '').replace(/[!?]+$/, '');
      if (!san) continue;
      const node: Node = { san, parent: current, children: [], comments: [] };
      current.children.push(node);
      current = node;
    }
  }
  if (stack.length > 0) {
    errors.push(`${file}: unclosed "("`);
    return null;
  }
  return root;
}

/** The opening as JSON, in the house style (short string arrays on one line). */
export function openingToJson(opening: Opening): string {
  return (
    JSON.stringify(opening, null, 2).replace(
      /\[\s+("(?:[^"\\]|\\.)*"(?:,\s+"(?:[^"\\]|\\.)*")*)\s+\]/g,
      (_, inner: string) => `[${inner.split(/,\s+(?=")/).join(', ')}]`,
    ) + '\n'
  );
}
