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

/**
 * Every position of a line, from the start (frame 0) to the end, for stepping back and forth.
 * Watch is the clean textbook pass: only the book moves and their notes. Other good moves and
 * known mistakes come up in Practice and Test, and in goodToKnow() at the end.
 */
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

/** "5.Nf3" for White's plies, "3…Nc6" for Black's. */
const label = (ply: number, san: string) => `${Math.floor(ply / 2) + 1}${ply % 2 === 0 ? '.' : '…'}${san}`;

/**
 * A one-line overview of the line's other good moves and known mistakes, for the end of
 * Watch: "Also good: 3…Nc6. Avoid: 5.d4?". Null when the line has neither.
 */
export function goodToKnow(line: OpeningLine): string | null {
  const plies = (record: Record<string, unknown> | undefined) =>
    Object.keys(record ?? {})
      .map(Number)
      .sort((a, b) => a - b);
  const good = plies(line.accept).flatMap((ply) => (line.accept?.[String(ply)] ?? []).map((san) => label(ply, san)));
  const avoid = plies(line.mistakes).flatMap((ply) =>
    Object.keys(line.mistakes?.[String(ply)] ?? {}).map((san) => `${label(ply, san)}?`),
  );
  const parts = [
    good.length > 0 ? `Also good: ${good.join(', ')}.` : null,
    avoid.length > 0 ? `Avoid: ${avoid.join(', ')}` : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(' ') : null;
}
