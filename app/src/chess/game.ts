import { Chess, validateFen, type Color, type PieceSymbol, type Square } from 'chess.js';

export type { Color, PieceSymbol, Square };

export type BoardPiece = { square: Square; type: PieceSymbol; color: Color };
export type LastMove = { from: Square; to: Square };
export type ResolvedMove = { from: Square; to: Square; san: string };
export type GameStatus = 'playing' | 'check' | 'checkmate' | 'stalemate' | 'draw';

/** A plain, immutable snapshot of the game, safe to keep in React state. */
export type GamePosition = {
  fen: string;
  /** Rows from rank 8 down to rank 1, files a→h; null for empty squares. */
  board: (BoardPiece | null)[][];
  turn: Color;
  lastMove: LastMove | null;
  status: GameStatus;
  /** The side-to-move's king square when it is in check (or mated). */
  checkedKing: Square | null;
};

/** Thin wrapper around chess.js — the only place in the app that talks to it directly. */
export class ChessGame {
  private readonly chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  get turn(): Color {
    return this.chess.turn();
  }

  pieceAt(square: Square): BoardPiece | null {
    const piece = this.chess.get(square);
    return piece ? { square, ...piece } : null;
  }

  /** Squares the piece on `from` can legally move to (empty if it isn't that side's turn). */
  legalTargets(from: Square): Square[] {
    const targets = this.chess.moves({ square: from, verbose: true }).map((m) => m.to);
    return [...new Set(targets)]; // a promotion shows up once per promotion piece
  }

  /**
   * Plays from→to if it is legal and returns its SAN, or null if it isn't.
   * Pawns reaching the last rank always become queens.
   */
  move(from: Square, to: Square): string | null {
    if (!this.legalTargets(from).includes(to)) return null;
    return this.chess.move({ from, to, promotion: 'q' }).san;
  }

  /** Works out which squares a SAN move (e.g. "Nf3", "O-O") uses, without playing it. */
  resolveSan(san: string): ResolvedMove | null {
    const move = this.playSan(san);
    if (move) this.chess.undo();
    return move;
  }

  /** Plays a SAN move; returns it, or null if it is illegal or unreadable here. */
  playSan(san: string): ResolvedMove | null {
    try {
      const move = this.chess.move(san);
      return { from: move.from, to: move.to, san: move.san };
    } catch {
      return null;
    }
  }

  /** Starts from a set-up position (FEN). Check it with positionProblem() first. */
  load(fen: string): void {
    this.chess.load(fen);
  }

  /** Takes back the last move (checkmate included); returns false if there is none. */
  undo(): boolean {
    return this.chess.undo() !== null;
  }

  reset(): void {
    this.chess.reset();
  }

  position(): GamePosition {
    const history = this.chess.history({ verbose: true });
    const last = history[history.length - 1];
    const board = this.chess.board();
    const inCheck = this.chess.inCheck();

    return {
      fen: this.chess.fen(),
      board,
      turn: this.chess.turn(),
      lastMove: last ? { from: last.from, to: last.to } : null,
      status: this.status(),
      checkedKing: inCheck ? findKing(board, this.chess.turn()) : null,
    };
  }

  private status(): GameStatus {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isStalemate()) return 'stalemate';
    if (this.chess.isDraw()) return 'draw';
    if (this.chess.inCheck()) return 'check';
    return 'playing';
  }
}

/**
 * Why a set-up position (FEN) can't be played, or null if it can: chess.js's own checks, plus
 * the side not to move must not be in check (it would mean its king could be captured).
 */
export function positionProblem(fen: string): string | null {
  const check = validateFen(fen);
  if (!check.ok) return check.error ?? 'This position is not valid.';
  const chess = new Chess(fen);
  const waiting: Color = chess.turn() === 'w' ? 'b' : 'w';
  const king = findKing(chess.board(), waiting);
  if (king && chess.isAttacked(king, chess.turn())) {
    return `${waiting === 'w' ? 'White' : 'Black'} is in check but it's not their move.`;
  }
  return null;
}

function findKing(board: (BoardPiece | null)[][], color: Color): Square | null {
  for (const row of board) {
    for (const piece of row) {
      if (piece?.type === 'k' && piece.color === color) return piece.square;
    }
  }
  return null;
}
