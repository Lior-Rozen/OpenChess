import { ChessGame, type GamePosition } from '../chess/game';
import type { OpeningLine } from '../content/types';

/** One step of a watched line: the position after `ply` moves. */
export type WatchFrame = {
  ply: number;
  position: GamePosition;
  /** SAN of the moves played so far. */
  moves: string[];
  /** The note on the move that led here, plus other good moves and known mistakes there, if any. */
  note: string | null;
};

/** "…Nc6 or …a6" for Black's plies, "Nc3" for White's. */
function alternativesText(sans: string[], ply: number): string {
  return sans.map((san) => (ply % 2 === 1 ? `…${san}` : san)).join(' or ');
}

/** Every position of a line, from the start (frame 0) to the end, for stepping back and forth. */
export function watchFrames(line: OpeningLine): WatchFrame[] {
  const game = new ChessGame();
  const frames: WatchFrame[] = [{ ply: 0, position: game.position(), moves: [], note: null }];
  const moves: string[] = [];

  line.moves.forEach((san, ply) => {
    const move = game.playSan(san);
    if (!move) throw new Error(`Line ${line.id}: ply ${ply} "${san}" is illegal`);
    moves.push(move.san);
    const alternatives = line.accept?.[String(ply)];
    const mistakes = Object.entries(line.mistakes?.[String(ply)] ?? {});
    const parts = [
      line.notes?.[String(ply)],
      alternatives?.length ? `Also good: ${alternativesText(alternatives, ply)}.` : undefined,
      ...mistakes.map(([san, reason]) => `Avoid ${alternativesText([san], ply)}? ${reason}`),
    ].filter((part) => part !== undefined);
    frames.push({ ply: ply + 1, position: game.position(), moves: [...moves], note: parts.join(' ') || null });
  });
  return frames;
}
