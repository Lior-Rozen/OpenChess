import { positionProblem, type BoardPiece, type Color, type GamePosition, type PieceSymbol, type Square } from './game';

/** A piece as the editor stores it, e.g. "wK" or "bP". */
export type PieceCode = `${Color}${Uppercase<PieceSymbol>}`;

/** The board being set up: which piece stands on which square. */
export type EditorBoard = Partial<Record<Square, PieceCode>>;

const FILES = 'abcdefgh';

/** The pool under the board: White's pieces, then Black's, in two rows of six. */
export const POOL: PieceCode[] = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
export const POOL_COLUMNS = 6;

export function pieceOf(code: PieceCode): { color: Color; type: PieceSymbol } {
  return { color: code[0] as Color, type: code[1].toLowerCase() as PieceSymbol };
}

/** The editor board for a position, e.g. to start editing from where free play is. */
export function editorBoardFrom(position: GamePosition): EditorBoard {
  const board: EditorBoard = {};
  for (const piece of position.board.flat()) {
    if (piece) board[piece.square] = `${piece.color}${piece.type.toUpperCase()}` as PieceCode;
  }
  return board;
}

/** The editor board drawn as a GamePosition, so the normal Board component can show it. */
export function editorPosition(board: EditorBoard, turn: Color): GamePosition {
  const rows: (BoardPiece | null)[][] = [];
  for (let rank = 8; rank >= 1; rank--) {
    rows.push(
      [...FILES].map((file) => {
        const square = `${file}${rank}` as Square;
        const code = board[square];
        return code ? { square, ...pieceOf(code) } : null;
      }),
    );
  }
  return { fen: '', board: rows, turn, lastMove: null, status: 'playing', checkedKing: null };
}

/**
 * The FEN for the set-up board. Castling is allowed wherever the king and that rook still stand
 * on their home squares; there is no en passant square.
 */
export function editorFen(board: EditorBoard, turn: Color): string {
  const ranks: string[] = [];
  for (let rank = 8; rank >= 1; rank--) {
    let row = '';
    let empty = 0;
    for (const file of FILES) {
      const code = board[`${file}${rank}` as Square];
      if (!code) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += code[0] === 'w' ? code[1] : code[1].toLowerCase();
    }
    ranks.push(row + (empty || ''));
  }
  const castling =
    (board.e1 === 'wK' && board.h1 === 'wR' ? 'K' : '') +
    (board.e1 === 'wK' && board.a1 === 'wR' ? 'Q' : '') +
    (board.e8 === 'bK' && board.h8 === 'bR' ? 'k' : '') +
    (board.e8 === 'bK' && board.a8 === 'bR' ? 'q' : '');
  return `${ranks.join('/')} ${turn} ${castling || '-'} - 0 1`;
}

/** Why the set-up board can't be played from, in plain words, or null if it can. */
export function editorProblem(board: EditorBoard, turn: Color): string | null {
  const codes = Object.values(board);
  const kings = (color: Color) => codes.filter((c) => c === `${color}K`).length;
  if (kings('w') !== 1 || kings('b') !== 1) return 'Each side needs exactly one king.';
  const pawnOnEdge = Object.entries(board).some(([square, code]) => code[1] === 'P' && /[18]$/.test(square));
  if (pawnOnEdge) return "Pawns can't stand on the first or last rank.";
  return positionProblem(editorFen(board, turn));
}

/** The square under a point on the board (pixels from its top-left corner), or null if off the board. */
export function squareAt(x: number, y: number, boardSize: number, orientation: Color): Square | null {
  const col = Math.floor((x / boardSize) * 8);
  const row = Math.floor((y / boardSize) * 8);
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  const file = orientation === 'w' ? col : 7 - col;
  const rank = orientation === 'w' ? 8 - row : row + 1;
  return `${FILES[file]}${rank}` as Square;
}

/** The pool piece under a point in the pool (pixels from its top-left corner), or null. */
export function poolPieceAt(x: number, y: number, poolWidth: number): PieceCode | null {
  const tile = poolWidth / POOL_COLUMNS;
  const col = Math.floor(x / tile);
  const row = Math.floor(y / tile);
  if (x < 0 || y < 0 || col >= POOL_COLUMNS) return null;
  return POOL[row * POOL_COLUMNS + col] ?? null;
}
