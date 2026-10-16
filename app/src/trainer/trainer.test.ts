import { ChessGame, type Square } from '../chess/game';
import type { OpeningLine } from '../content/types';
import { TEST_MISTAKE_LIMIT, Trainer, type TrainerEvent } from './trainer';

const line = (id: string, moves: string[], notes?: Record<string, string>): OpeningLine => ({
  id,
  name: id,
  level: 1,
  tier: 'main',
  moves,
  notes,
});

const advance = line('advance', ['e4', 'e6', 'd4', 'd5', 'e5', 'c5'], { '5': '…c5 strikes at d4.' });
const exchange = line('exchange', ['e4', 'e6', 'd4', 'd5', 'exd5', 'exd5']);
const winawer = line('winawer', ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4']);
const classical = line('classical', ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6']);

/** Squares of a SAN move after the given moves, worked out independently of the trainer. */
function squaresOf(moves: string[], san: string): { from: Square; to: Square } {
  const game = new ChessGame();
  for (const m of moves) game.playSan(m);
  return game.resolveSan(san)!;
}

/** Plays to the end, answering each user move with the first matching line's book move. */
function playThrough(trainer: Trainer, lines: OpeningLine[]): TrainerEvent[] {
  const events: TrainerEvent[] = [];
  while (trainer.phase === 'auto' || trainer.phase === 'user') {
    if (trainer.phase === 'auto') events.push(...trainer.advance());
    else {
      const { moves, ply } = trainer.state();
      const next = lines.find((l) => moves.every((m, i) => squaresMatch(moves, i, l.moves[i], m)));
      const { from, to } = squaresOf(moves, next!.moves[ply]);
      events.push(...trainer.tryMove(from, to));
    }
  }
  return events;
}

function squaresMatch(moves: string[], i: number, bookSan: string | undefined, playedSan: string): boolean {
  if (bookSan === undefined) return false;
  const a = squaresOf(moves.slice(0, i), bookSan);
  const b = squaresOf(moves.slice(0, i), playedSan);
  return a.from === b.from && a.to === b.to;
}

describe('Trainer with one line', () => {
  it('starts with the opponent to move when the user plays Black', () => {
    const trainer = new Trainer([advance], 'b', 'practice');

    expect(trainer.state()).toMatchObject({ phase: 'auto', ply: 0, totalPlies: 6, moves: [], lineId: 'advance' });
  });

  it('starts with the user to move when the user plays White', () => {
    expect(new Trainer([advance], 'w', 'practice').phase).toBe('user');
  });

  it("plays the opponent's book move, then waits for the user", () => {
    const trainer = new Trainer([advance], 'b', 'practice');

    expect(trainer.advance()).toEqual([
      { type: 'moved', by: 'auto', ply: 0, san: 'e4', from: 'e2', to: 'e4', note: null },
    ]);
    expect(trainer.state()).toMatchObject({ phase: 'user', ply: 1, moves: ['e4'] });
    expect(trainer.advance()).toEqual([]); // not the app's turn
  });

  it('accepts the book move', () => {
    const trainer = new Trainer([advance], 'b', 'practice');
    trainer.advance();

    expect(trainer.tryMove('e7', 'e6')).toEqual([
      { type: 'moved', by: 'user', ply: 1, san: 'e6', from: 'e7', to: 'e6', note: null },
    ]);
    expect(trainer.state()).toMatchObject({ phase: 'auto', ply: 2 });
  });

  it('rejects and counts a wrong move without changing the board', () => {
    const trainer = new Trainer([advance], 'b', 'practice');
    trainer.advance();
    const before = trainer.state().position.fen;

    expect(trainer.tryMove('c7', 'c5')).toEqual([{ type: 'wrongMove', from: 'c7', to: 'c5', triesThisMove: 1 }]);
    expect(trainer.state()).toMatchObject({ phase: 'user', ply: 1, mistakes: 1, triesThisMove: 1, hint: null });
    expect(trainer.state().position.fen).toBe(before);
  });

  it('practice: shows the correct move after 2 wrong tries, and clears it once played', () => {
    const trainer = new Trainer([advance], 'b', 'practice');
    trainer.advance();
    trainer.tryMove('c7', 'c5');

    expect(trainer.tryMove('d7', 'd5')).toEqual([
      { type: 'wrongMove', from: 'd7', to: 'd5', triesThisMove: 2 },
      { type: 'hintShown', from: 'e7', to: 'e6' },
    ]);
    expect(trainer.state().hint).toEqual({ from: 'e7', to: 'e6' });

    trainer.tryMove('e7', 'e6');
    expect(trainer.state()).toMatchObject({ hint: null, triesThisMove: 0, mistakes: 2 });
  });

  it('practice: allows a hint on request; test does not', () => {
    const practice = new Trainer([advance], 'b', 'practice');
    practice.advance();
    expect(practice.requestHint()).toEqual([{ type: 'hintShown', from: 'e7', to: 'e6' }]);
    expect(practice.state()).toMatchObject({ hintsUsed: 1, clean: false });

    const test = new Trainer([advance], 'b', 'test');
    test.advance();
    expect(test.requestHint()).toEqual([]);
    expect(test.state().hint).toBeNull();
  });

  it(`test: fails at ${TEST_MISTAKE_LIMIT} mistakes without ever showing the answer`, () => {
    const trainer = new Trainer([advance], 'b', 'test');
    trainer.advance();

    expect(trainer.tryMove('c7', 'c5')).toEqual([{ type: 'wrongMove', from: 'c7', to: 'c5', triesThisMove: 1 }]);
    expect(trainer.tryMove('d7', 'd5')).toEqual([
      { type: 'wrongMove', from: 'd7', to: 'd5', triesThisMove: 2 },
      { type: 'testFailed', mistakes: 2 },
    ]);
    expect(trainer.state()).toMatchObject({ phase: 'failed', hint: null });
    expect(trainer.tryMove('e7', 'e6')).toEqual([]);
    expect(trainer.advance()).toEqual([]);
  });

  it('test: mistakes spread over different moves also count towards the limit', () => {
    const trainer = new Trainer([advance], 'b', 'test');
    trainer.advance();
    trainer.tryMove('c7', 'c5');
    trainer.tryMove('e7', 'e6');
    trainer.advance();

    const events = trainer.tryMove('c7', 'c5');
    expect(events[events.length - 1]).toEqual({ type: 'testFailed', mistakes: 2 });
  });

  it('attaches move notes', () => {
    const trainer = new Trainer([advance], 'b', 'practice');
    const events = playThrough(trainer, [advance]);

    const c5 = events.find((e) => e.type === 'moved' && e.ply === 5);
    expect(c5).toMatchObject({ san: 'c5', note: '…c5 strikes at d4.' });
    expect(trainer.state().note).toBe('…c5 strikes at d4.');
  });

  it('completes a clean run', () => {
    const trainer = new Trainer([advance], 'b', 'test');
    const events = playThrough(trainer, [advance]);

    expect(events[events.length - 1]).toEqual({
      type: 'lineComplete',
      lineId: 'advance',
      mistakes: 0,
      hintsUsed: 0,
      clean: true,
    });
    expect(trainer.state()).toMatchObject({ phase: 'complete', ply: 6, clean: true, lineId: 'advance' });
    expect(trainer.state().moves).toEqual(['e4', 'e6', 'd4', 'd5', 'e5', 'c5']);
    expect(trainer.tryMove('a7', 'a6')).toEqual([]);
  });

  it('marks a test run with one mistake as complete but not clean', () => {
    const trainer = new Trainer([advance], 'b', 'test');
    trainer.advance();
    trainer.tryMove('c7', 'c5');
    const events = playThrough(trainer, [advance]);

    expect(events[events.length - 1]).toMatchObject({ type: 'lineComplete', mistakes: 1, clean: false });
  });

  it('plays every move automatically in watch mode', () => {
    const trainer = new Trainer([advance], 'b', 'watch');

    expect(trainer.phase).toBe('auto');
    trainer.advance();
    expect(trainer.phase).toBe('auto'); // even on the user's own move
    expect(trainer.tryMove('e7', 'e6')).toEqual([]);

    const events = playThrough(trainer, [advance]);
    expect(events.every((e) => e.type !== 'moved' || e.by === 'auto')).toBe(true);
    expect(trainer.phase).toBe('complete');
  });
});

describe('Trainer with several lines (Hard mode)', () => {
  const lines = [advance, exchange, winawer, classical];

  it("picks the opponent's branch at random", () => {
    const pick = (random: number) => {
      const trainer = new Trainer(lines, 'b', 'test', { random: () => random });
      playThrough(trainer, lines);
      return trainer.state().moves[4];
    };

    // At move 3 White has three distinct book moves: e5, exd5, Nc3 (shared by two lines).
    expect(pick(0)).toBe('e5');
    expect(pick(0.5)).toBe('exd5');
    expect(pick(0.99)).toBe('Nc3');
  });

  it('accepts any book reply when the lines split on the user move', () => {
    const viaNc3 = () => {
      const trainer = new Trainer(lines, 'b', 'test', { random: () => 0.99 });
      while (trainer.state().ply < 5) {
        if (trainer.phase === 'auto') trainer.advance();
        else {
          const { moves, ply } = trainer.state();
          trainer.tryMove(...(Object.values(squaresOf(moves, advance.moves[ply])) as [Square, Square]));
        }
      }
      return trainer;
    };

    const a = viaNc3();
    a.tryMove('f8', 'b4');
    expect(a.state()).toMatchObject({ phase: 'complete', lineId: 'winawer' });

    const b = viaNc3();
    b.tryMove('g8', 'f6');
    expect(b.state()).toMatchObject({ phase: 'complete', lineId: 'classical' });
  });

  it('reports the line that was played to the end', () => {
    const trainer = new Trainer(lines, 'b', 'test', { random: () => 0.5 });
    const events = playThrough(trainer, lines);

    expect(events[events.length - 1]).toMatchObject({ type: 'lineComplete', lineId: 'exchange', clean: true });
  });

  it('only knows the line once the branches have split', () => {
    const trainer = new Trainer(lines, 'b', 'practice', { random: () => 0 });
    expect(trainer.state().lineId).toBeNull();

    playThrough(trainer, lines);
    expect(trainer.state().lineId).toBe('advance');
  });
});
