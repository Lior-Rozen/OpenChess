import { ChessGame, type Color, type GamePosition, type ResolvedMove, type Square } from '../chess/game';
import type { OpeningLine } from '../content/types';

/** Watch mode isn't a drill: it steps through precomputed frames (see watch.ts). */
export type TrainerMode = 'practice' | 'test';

/**
 * auto = the app plays the next book move; user = waiting for the user's move;
 * complete = a line was played to the end; failed = a Test run hit the mistake limit.
 */
export type TrainerPhase = 'auto' | 'user' | 'complete' | 'failed';

export type Arrow = { from: Square; to: Square };

export type TrainerEvent =
  | { type: 'moved'; by: 'auto' | 'user'; ply: number; san: string; from: Square; to: Square; note: string | null }
  | { type: 'wrongMove'; from: Square; to: Square; triesThisMove: number }
  | { type: 'hintShown'; from: Square; to: Square }
  /** The user played an accepted alternative: not a mistake. The book move is shown as an arrow. */
  | { type: 'alternativeMove'; from: Square; to: Square; san: string; bookSan: string }
  | { type: 'lineComplete'; lineId: string; mistakes: number; hintsUsed: number; clean: boolean }
  | { type: 'testFailed'; mistakes: number };

export type TrainerState = {
  mode: TrainerMode;
  userColor: Color;
  phase: TrainerPhase;
  position: GamePosition;
  /** Number of book moves played so far. */
  ply: number;
  /** Length of the longest line still possible from here. */
  totalPlies: number;
  /** SAN of the moves played so far. */
  moves: string[];
  mistakes: number;
  hintsUsed: number;
  triesThisMove: number;
  /** The correct move, shown as an arrow, after a hint, 2 wrong tries or an accepted alternative. */
  hint: Arrow | null;
  /** The accepted alternative the user just played, until they play the book move. */
  alternative: { san: string; bookSan: string } | null;
  /** The note of the most recently played move, if it has one. */
  note: string | null;
  /** The line played to the end (phase 'complete'), or the only line still possible. */
  lineId: string | null;
  /** No mistakes and no hints. Only meaningful in practice/test. */
  clean: boolean;
};

export type TrainerOptions = {
  /** Random source for picking the opponent's branch; injectable for tests. */
  random?: () => number;
  /** Practice: wrong tries on one move before the arrow appears; 0 means never. Default TRIES_BEFORE_HINT. */
  triesBeforeHint?: number;
};

/** Practice: wrong tries on one move before the answer is shown as an arrow. */
export const TRIES_BEFORE_HINT = 2;
/** Test: the run fails when it reaches this many mistakes. Test never shows the answer. */
export const TEST_MISTAKE_LIMIT = 2;

/**
 * Drills opening lines. The app plays the opponent's book moves;
 * the user must find their side's book moves.
 *
 * With several lines (Hard mode), the lines form a tree: wherever they split on the opponent's
 * move, the app picks a branch at random, and on the user's move any book reply is accepted.
 * The run ends when one of the lines has been played to the end.
 *
 * A line can list other good moves for the user (`accept`). Playing one isn't a mistake: the
 * move is taken back, the book move is shown as an arrow (even in Test), and the run stays clean.
 *
 * Wrong moves are rejected and counted. In Practice the correct move is shown after
 * TRIES_BEFORE_HINT wrong tries (or on request); a Test run fails at TEST_MISTAKE_LIMIT
 * mistakes. A run is clean with no mistakes and no hints.
 *
 * Pure TypeScript: the UI calls advance() / tryMove() / requestHint() and re-reads state().
 */
export class Trainer {
  private readonly game = new ChessGame();
  private readonly random: () => number;
  /** Lines that match every move played so far. */
  private candidates: OpeningLine[];
  private completedLine: OpeningLine | null = null;
  private failed = false;
  private ply = 0;
  private moves: string[] = [];
  private mistakes = 0;
  private hintsUsed = 0;
  private triesThisMove = 0;
  private hint: Arrow | null = null;
  private readonly triesBeforeHint: number;
  private alternative: { san: string; bookSan: string } | null = null;
  private note: string | null = null;

  constructor(
    lines: OpeningLine[],
    private readonly userColor: Color,
    private readonly mode: TrainerMode,
    options: TrainerOptions = {},
  ) {
    if (lines.length === 0) throw new Error('Trainer needs at least one line');
    this.candidates = [...lines];
    this.random = options.random ?? Math.random;
    this.triesBeforeHint = options.triesBeforeHint ?? TRIES_BEFORE_HINT;
  }

  /** Read-only board access for tap-to-move. */
  get board(): Pick<ChessGame, 'turn' | 'pieceAt' | 'legalTargets'> {
    return this.game;
  }

  get phase(): TrainerPhase {
    if (this.failed) return 'failed';
    if (this.completedLine) return 'complete';
    return this.game.turn === this.userColor ? 'user' : 'auto';
  }

  state(): TrainerState {
    const line = this.completedLine ?? (this.candidates.length === 1 ? this.candidates[0] : null);
    return {
      mode: this.mode,
      userColor: this.userColor,
      phase: this.phase,
      position: this.game.position(),
      ply: this.ply,
      totalPlies: Math.max(...this.candidates.map((l) => l.moves.length)),
      moves: [...this.moves],
      mistakes: this.mistakes,
      hintsUsed: this.hintsUsed,
      triesThisMove: this.triesThisMove,
      hint: this.hint,
      alternative: this.alternative,
      note: this.note,
      lineId: line?.id ?? null,
      clean: this.mistakes === 0 && this.hintsUsed === 0,
    };
  }

  /** Plays the next book move for the app. Does nothing unless the phase is 'auto'. */
  advance(): TrainerEvent[] {
    if (this.phase !== 'auto') return [];
    const options = this.nextMoves();
    const choice = options[Math.min(Math.floor(this.random() * options.length), options.length - 1)];
    return this.play(choice, 'auto');
  }

  /** The user tries a move. Does nothing unless the phase is 'user'. */
  tryMove(from: Square, to: Square): TrainerEvent[] {
    if (this.phase !== 'user') return [];

    const options = this.nextMoves();
    const match = options.find((m) => m.move.from === from && m.move.to === to);
    if (match) return this.play(match, 'user');

    const alternative = this.acceptedAlternative(from, to);
    if (alternative) {
      const book = options[0].move;
      this.alternative = { san: alternative.san, bookSan: book.san };
      this.hint = { from: book.from, to: book.to };
      return [{ type: 'alternativeMove', from, to, san: alternative.san, bookSan: book.san }];
    }

    this.mistakes++;
    this.triesThisMove++;
    const events: TrainerEvent[] = [{ type: 'wrongMove', from, to, triesThisMove: this.triesThisMove }];

    if (this.mode === 'test') {
      if (this.mistakes >= TEST_MISTAKE_LIMIT) {
        this.failed = true;
        events.push({ type: 'testFailed', mistakes: this.mistakes });
      }
    } else if (this.triesBeforeHint > 0 && this.triesThisMove >= this.triesBeforeHint && this.hint === null) {
      this.hint = this.expectedArrow();
      events.push({ type: 'hintShown', ...this.hint });
    }
    return events;
  }

  /** Practice only: show the correct move now. Using it means the run isn't clean. */
  requestHint(): TrainerEvent[] {
    if (this.mode !== 'practice' || this.phase !== 'user' || this.hint !== null) return [];
    this.hint = this.expectedArrow();
    this.hintsUsed++;
    return [{ type: 'hintShown', ...this.hint }];
  }

  private expectedArrow(): Arrow {
    const { from, to } = this.nextMoves()[0].move;
    return { from, to };
  }

  /** The move, if it's one of the candidate lines' accepted alternatives at this ply. */
  private acceptedAlternative(from: Square, to: Square): ResolvedMove | null {
    for (const line of this.candidates) {
      for (const san of line.accept?.[String(this.ply)] ?? []) {
        const move = this.game.resolveSan(san);
        if (move && move.from === from && move.to === to) return move;
      }
    }
    return null;
  }

  /** The distinct book moves from here, each with the candidate lines that continue with it. */
  private nextMoves(): { move: ResolvedMove; lines: OpeningLine[] }[] {
    const options: { move: ResolvedMove; lines: OpeningLine[] }[] = [];
    for (const line of this.candidates) {
      const san = line.moves[this.ply];
      const move = this.game.resolveSan(san);
      if (!move) throw new Error(`Line ${line.id}: ply ${this.ply} "${san}" is illegal`);
      const existing = options.find((o) => o.move.from === move.from && o.move.to === move.to);
      if (existing) existing.lines.push(line);
      else options.push({ move, lines: [line] });
    }
    return options;
  }

  private play(option: { move: ResolvedMove; lines: OpeningLine[] }, by: 'auto' | 'user'): TrainerEvent[] {
    const ply = this.ply;
    const move = this.game.playSan(option.move.san)!;

    this.candidates = option.lines;
    this.ply++;
    this.moves.push(move.san);
    this.triesThisMove = 0;
    this.hint = null;
    this.alternative = null;
    this.note = this.candidates.map((l) => l.notes?.[String(ply)]).find((n) => n !== undefined) ?? null;

    const events: TrainerEvent[] = [{ type: 'moved', by, ply, san: move.san, from: move.from, to: move.to, note: this.note }];

    const finished = this.candidates.find((l) => l.moves.length === this.ply);
    if (finished) {
      this.completedLine = finished;
      events.push({
        type: 'lineComplete',
        lineId: finished.id,
        mistakes: this.mistakes,
        hintsUsed: this.hintsUsed,
        clean: this.mistakes === 0 && this.hintsUsed === 0,
      });
    }
    return events;
  }
}
