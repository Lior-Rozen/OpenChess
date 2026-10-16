import { ChessGame } from '../chess/game';
import type { OpeningLine } from '../content/types';
import { Trainer, type TrainerEvent } from './trainer';

const advance: OpeningLine = {
  id: 'french-advance-main',
  name: 'Advance Variation',
  level: 1,
  tier: 'main',
  moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5'],
  notes: { '5': '…c5 strikes at d4.' },
};

/** Squares of each book move, worked out independently of the trainer. */
function bookSquares(line: OpeningLine) {
  const game = new ChessGame();
  return line.moves.map((san) => game.playSan(san)!);
}

/** Plays the whole line correctly and returns every event. */
function playThrough(trainer: Trainer, line: OpeningLine): TrainerEvent[] {
  const squares = bookSquares(line);
  const events: TrainerEvent[] = [];
  while (trainer.phase !== 'complete') {
    if (trainer.phase === 'auto') events.push(...trainer.advance());
    else {
      const { from, to } = squares[trainer.state().ply];
      events.push(...trainer.tryMove(from, to));
    }
  }
  return events;
}

describe('Trainer', () => {
  it('starts with the opponent to move when the user plays Black', () => {
    const trainer = new Trainer(advance, 'b', 'practice');

    expect(trainer.state()).toMatchObject({ phase: 'auto', ply: 0, totalPlies: 6, moves: [], mistakes: 0 });
  });

  it('starts with the user to move when the user plays White', () => {
    expect(new Trainer(advance, 'w', 'practice').phase).toBe('user');
  });

  it("plays the opponent's book move, then waits for the user", () => {
    const trainer = new Trainer(advance, 'b', 'practice');

    expect(trainer.advance()).toEqual([
      { type: 'moved', by: 'auto', ply: 0, san: 'e4', from: 'e2', to: 'e4', note: null },
    ]);
    expect(trainer.state()).toMatchObject({ phase: 'user', ply: 1, moves: ['e4'] });
    expect(trainer.advance()).toEqual([]); // not the app's turn
  });

  it('accepts the book move', () => {
    const trainer = new Trainer(advance, 'b', 'practice');
    trainer.advance();

    expect(trainer.tryMove('e7', 'e6')).toEqual([
      { type: 'moved', by: 'user', ply: 1, san: 'e6', from: 'e7', to: 'e6', note: null },
    ]);
    expect(trainer.state()).toMatchObject({ phase: 'auto', ply: 2 });
  });

  it('rejects and counts a wrong move without changing the board', () => {
    const trainer = new Trainer(advance, 'b', 'practice');
    trainer.advance();
    const before = trainer.state().position.fen;

    expect(trainer.tryMove('c7', 'c5')).toEqual([{ type: 'wrongMove', from: 'c7', to: 'c5', triesThisMove: 1 }]);
    expect(trainer.state()).toMatchObject({ phase: 'user', ply: 1, mistakes: 1, triesThisMove: 1, hint: null });
    expect(trainer.state().position.fen).toBe(before);
  });

  it('shows the correct move after 2 wrong tries, and clears it once played', () => {
    const trainer = new Trainer(advance, 'b', 'test');
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

  it('allows a hint on request in practice only', () => {
    const practice = new Trainer(advance, 'b', 'practice');
    practice.advance();
    expect(practice.requestHint()).toEqual([{ type: 'hintShown', from: 'e7', to: 'e6' }]);
    expect(practice.state()).toMatchObject({ hintsUsed: 1, clean: false });

    const test = new Trainer(advance, 'b', 'test');
    test.advance();
    expect(test.requestHint()).toEqual([]);
    expect(test.state().hint).toBeNull();
  });

  it('attaches move notes', () => {
    const trainer = new Trainer(advance, 'b', 'practice');
    const events = playThrough(trainer, advance);

    const c5 = events.find((e) => e.type === 'moved' && e.ply === 5);
    expect(c5).toMatchObject({ san: 'c5', note: '…c5 strikes at d4.' });
    expect(trainer.state().note).toBe('…c5 strikes at d4.');
  });

  it('completes a clean run', () => {
    const trainer = new Trainer(advance, 'b', 'test');
    const events = playThrough(trainer, advance);

    expect(events[events.length - 1]).toEqual({ type: 'lineComplete', mistakes: 0, hintsUsed: 0, clean: true });
    expect(trainer.state()).toMatchObject({ phase: 'complete', ply: 6, clean: true });
    expect(trainer.state().moves).toEqual(['e4', 'e6', 'd4', 'd5', 'e5', 'c5']);
    expect(trainer.tryMove('a7', 'a6')).toEqual([]);
  });

  it('marks a run with a mistake as not clean', () => {
    const trainer = new Trainer(advance, 'b', 'test');
    trainer.advance();
    trainer.tryMove('c7', 'c5');
    const events = playThrough(trainer, advance);

    expect(events[events.length - 1]).toEqual({ type: 'lineComplete', mistakes: 1, hintsUsed: 0, clean: false });
  });

  it('plays every move automatically in watch mode', () => {
    const trainer = new Trainer(advance, 'b', 'watch');

    expect(trainer.phase).toBe('auto');
    trainer.advance();
    expect(trainer.phase).toBe('auto'); // even on the user's own move
    expect(trainer.tryMove('e7', 'e6')).toEqual([]);

    const events = playThrough(trainer, advance);
    expect(events.every((e) => e.type !== 'moved' || e.by === 'auto')).toBe(true);
    expect(trainer.phase).toBe('complete');
  });
});
