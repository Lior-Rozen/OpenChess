import type { ChessGame, Square } from './game';

export type Selection = { from: Square; targets: Square[] } | null;
export type TapResult = { selection: Selection; move?: { from: Square; to: Square } };

type GameView = Pick<ChessGame, 'turn' | 'pieceAt' | 'legalTargets'>;

/**
 * Tap-to-move: tap one of your pieces to select it, then tap one of its targets to move.
 * Tapping the selected piece again, or anything else, clears the selection.
 */
export function handleTap(game: GameView, selection: Selection, square: Square): TapResult {
  if (selection?.targets.includes(square)) {
    return { selection: null, move: { from: selection.from, to: square } };
  }
  if (selection?.from === square) {
    return { selection: null };
  }
  const piece = game.pieceAt(square);
  if (piece && piece.color === game.turn) {
    return { selection: { from: square, targets: game.legalTargets(square) } };
  }
  return { selection: null };
}
