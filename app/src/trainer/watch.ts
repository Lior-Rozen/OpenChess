import { ChessGame, type GamePosition } from '../chess/game';
import type { OpeningLine } from '../content/types';

/** One step of a watched line: the position after `ply` moves. */
export type WatchFrame = {
  ply: number;
  position: GamePosition;
  /** SAN of the moves played so far. */
  moves: string[];
  /** The note on the move that led here, if any. */
  note: string | null;
};

/** Every position of a line, from the start (frame 0) to the end, for stepping back and forth. */
export function watchFrames(line: OpeningLine): WatchFrame[] {
  const game = new ChessGame();
  const frames: WatchFrame[] = [{ ply: 0, position: game.position(), moves: [], note: null }];
  const moves: string[] = [];

  line.moves.forEach((san, ply) => {
    const move = game.playSan(san);
    if (!move) throw new Error(`Line ${line.id}: ply ${ply} "${san}" is illegal`);
    moves.push(move.san);
    frames.push({ ply: ply + 1, position: game.position(), moves: [...moves], note: line.notes?.[String(ply)] ?? null });
  });
  return frames;
}
