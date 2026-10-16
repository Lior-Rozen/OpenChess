import { ChessGame, type Color, type GamePosition, type Square } from '../chess/game';
import type { OpeningLine } from '../content/types';

export type TrainerMode = 'watch' | 'practice' | 'test';

/** auto = the app plays the next book move; user = waiting for the user's move. */
export type TrainerPhase = 'auto' | 'user' | 'complete';

export type Arrow = { from: Square; to: Square };

export type TrainerEvent =
  | { type: 'moved'; by: 'auto' | 'user'; ply: number; san: string; from: Square; to: Square; note: string | null }
  | { type: 'wrongMove'; from: Square; to: Square; triesThisMove: number }
  | { type: 'hintShown'; from: Square; to: Square }
  | { type: 'lineComplete'; mistakes: number; hintsUsed: number; clean: boolean };

export type TrainerState = {
  mode: TrainerMode;
  userColor: Color;
  phase: TrainerPhase;
  position: GamePosition;
  /** Number of book moves played so far. */
  ply: number;
  totalPlies: number;
  /** SAN of the moves played so far. */
  moves: string[];
  mistakes: number;
  hintsUsed: number;
  triesThisMove: number;
  /** The correct move, shown as an arrow, after a hint or 2 wrong tries. */
  hint: Arrow | null;
  /** The note of the most recently played move, if it has one. */
  note: string | null;
  /** No mistakes and no hints. Only meaningful in practice/test. */
  clean: boolean;
};

/** Wrong tries on one move before the answer is shown. */
export const TRIES_BEFORE_HINT = 2;

/**
 * Drills one opening line. The app plays the opponent's book moves (every move in watch mode);
 * the user must find their side's book moves. Wrong moves are rejected and counted; after
 * TRIES_BEFORE_HINT wrong tries the correct move is shown and must be played. Practice also
 * allows asking for a hint at any time. A run is clean with no mistakes and no hints.
 *
 * Pure TypeScript: the UI calls advance() / tryMove() / requestHint() and re-reads state().
 */
export class Trainer {
  private readonly game = new ChessGame();
  private ply = 0;
  private moves: string[] = [];
  private mistakes = 0;
  private hintsUsed = 0;
  private triesThisMove = 0;
  private hint: Arrow | null = null;
  private note: string | null = null;

  constructor(
    private readonly line: OpeningLine,
    private readonly userColor: Color,
    private readonly mode: TrainerMode,
  ) {}

  /** Read-only board access for tap-to-move. */
  get board(): Pick<ChessGame, 'turn' | 'pieceAt' | 'legalTargets'> {
    return this.game;
  }

  get phase(): TrainerPhase {
    if (this.ply >= this.line.moves.length) return 'complete';
    if (this.mode === 'watch') return 'auto';
    return this.game.turn === this.userColor ? 'user' : 'auto';
  }

  state(): TrainerState {
    return {
      mode: this.mode,
      userColor: this.userColor,
      phase: this.phase,
      position: this.game.position(),
      ply: this.ply,
      totalPlies: this.line.moves.length,
      moves: [...this.moves],
      mistakes: this.mistakes,
      hintsUsed: this.hintsUsed,
      triesThisMove: this.triesThisMove,
      hint: this.hint,
      note: this.note,
      clean: this.mistakes === 0 && this.hintsUsed === 0,
    };
  }

  /** Plays the next book move for the app. Does nothing unless the phase is 'auto'. */
  advance(): TrainerEvent[] {
    if (this.phase !== 'auto') return [];
    return this.playBookMove('auto');
  }

  /** The user tries a move. Does nothing unless the phase is 'user'. */
  tryMove(from: Square, to: Square): TrainerEvent[] {
    if (this.phase !== 'user') return [];

    const expected = this.expectedMove();
    if (expected.from === from && expected.to === to) return this.playBookMove('user');

    this.mistakes++;
    this.triesThisMove++;
    const events: TrainerEvent[] = [{ type: 'wrongMove', from, to, triesThisMove: this.triesThisMove }];
    if (this.triesThisMove >= TRIES_BEFORE_HINT && this.hint === null) {
      this.hint = { from: expected.from, to: expected.to };
      events.push({ type: 'hintShown', ...this.hint });
    }
    return events;
  }

  /** Practice only: show the correct move now. Using it means the run isn't clean. */
  requestHint(): TrainerEvent[] {
    if (this.mode !== 'practice' || this.phase !== 'user' || this.hint !== null) return [];
    const expected = this.expectedMove();
    this.hint = { from: expected.from, to: expected.to };
    this.hintsUsed++;
    return [{ type: 'hintShown', ...this.hint }];
  }

  private expectedMove() {
    const move = this.game.resolveSan(this.line.moves[this.ply]);
    if (!move) throw new Error(`Line ${this.line.id}: ply ${this.ply} "${this.line.moves[this.ply]}" is illegal`);
    return move;
  }

  private playBookMove(by: 'auto' | 'user'): TrainerEvent[] {
    const ply = this.ply;
    const move = this.game.playSan(this.line.moves[ply]);
    if (!move) throw new Error(`Line ${this.line.id}: ply ${ply} "${this.line.moves[ply]}" is illegal`);

    this.ply++;
    this.moves.push(move.san);
    this.triesThisMove = 0;
    this.hint = null;
    this.note = this.line.notes?.[String(ply)] ?? null;

    const events: TrainerEvent[] = [{ type: 'moved', by, ply, san: move.san, from: move.from, to: move.to, note: this.note }];
    if (this.phase === 'complete') {
      events.push({
        type: 'lineComplete',
        mistakes: this.mistakes,
        hintsUsed: this.hintsUsed,
        clean: this.mistakes === 0 && this.hintsUsed === 0,
      });
    }
    return events;
  }
}
