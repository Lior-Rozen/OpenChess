import { POOL, type EditorBoard, type PieceCode } from './editor';
import type { Color, Square } from './game';

/**
 * A position saved from the board editor. It keeps the editor's board (not a FEN), so a
 * half-finished setup can be saved too, even one that isn't playable yet.
 */
export type SavedPosition = { id: string; name: string; board: EditorBoard; turn: Color; savedAt: string };

const SQUARE = /^[a-h][1-8]$/;

/** The name a new position gets unless the user types one: "Position 1", "Position 2", … */
export function defaultName(list: SavedPosition[]): string {
  let n = list.length + 1;
  while (list.some((p) => p.name === `Position ${n}`)) n++;
  return `Position ${n}`;
}

/** Adds a position at the top of the list. A blank name falls back to defaultName(). */
export function addPosition(
  list: SavedPosition[],
  input: { name: string; board: EditorBoard; turn: Color },
  now = new Date(),
): SavedPosition[] {
  const name = input.name.trim() || defaultName(list);
  const id = `${now.getTime()}-${list.length}`;
  return [{ id, name, board: { ...input.board }, turn: input.turn, savedAt: now.toISOString() }, ...list];
}

export function removePosition(list: SavedPosition[], id: string): SavedPosition[] {
  return list.filter((p) => p.id !== id);
}

/** Reads saved positions, dropping anything malformed. */
export function parsePositions(saved: unknown): SavedPosition[] {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((item): SavedPosition[] => {
    const p = item as Partial<SavedPosition> | null;
    if (!p || typeof p.id !== 'string' || typeof p.name !== 'string' || (p.turn !== 'w' && p.turn !== 'b')) return [];
    const board: EditorBoard = {};
    for (const [square, code] of Object.entries(typeof p.board === 'object' && p.board ? p.board : {})) {
      if (SQUARE.test(square) && POOL.includes(code as PieceCode)) board[square as Square] = code as PieceCode;
    }
    return [{ id: p.id, name: p.name, board, turn: p.turn, savedAt: typeof p.savedAt === 'string' ? p.savedAt : '' }];
  });
}
