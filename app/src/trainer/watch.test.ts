import type { OpeningLine } from '../content/types';
import { goodToKnow, watchFrames } from './watch';

const line: OpeningLine = {
  id: 'advance',
  name: 'Advance',
  level: 1,
  tier: 'main',
  moves: ['e4', 'e6', 'd4', 'd5', 'e5', 'c5'],
  notes: { '5': '…c5 strikes at d4.' },
};

describe('watchFrames', () => {
  const frames = watchFrames(line);

  it('has the start position plus one frame per move', () => {
    expect(frames).toHaveLength(7);
    expect(frames[0]).toMatchObject({ ply: 0, moves: [], note: null });
    expect(frames[0].position.lastMove).toBeNull();
  });

  it('records the moves, last move and note at each step', () => {
    expect(frames[1]).toMatchObject({ ply: 1, moves: ['e4'], note: null });
    expect(frames[1].position.lastMove).toEqual({ from: 'e2', to: 'e4' });
    expect(frames[6]).toMatchObject({ ply: 6, note: '…c5 strikes at d4.' });
    expect(frames[6].moves).toEqual(['e4', 'e6', 'd4', 'd5', 'e5', 'c5']);
  });

  it('keeps the notes clean: no alternatives or mistakes in Watch', () => {
    const withExtras = watchFrames({ ...line, accept: { '5': ['Nc6'] }, mistakes: { '5': { f6: 'It weakens e6.' } } });
    expect(withExtras[6].note).toBe('…c5 strikes at d4.');
  });

  it('rejects an illegal line', () => {
    expect(() => watchFrames({ ...line, moves: ['e4', 'e5', 'e5'] })).toThrow('ply 2 "e5" is illegal');
  });
});

describe('goodToKnow', () => {
  it('lists other good moves and known mistakes in move order', () => {
    expect(goodToKnow({ ...line, accept: { '5': ['Nc6'], '3': ['c5'] }, mistakes: { '5': { f6: 'x' } } })).toBe(
      'Also good: 2…c5, 3…Nc6. Avoid: 3…f6?',
    );
    expect(goodToKnow({ ...line, mistakes: { '4': { Nf3: 'x' } } })).toBe('Avoid: 3.Nf3?');
    expect(goodToKnow(line)).toBeNull();
  });
});
