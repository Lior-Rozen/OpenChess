import type { OpeningLine } from '../content/types';
import { watchFrames } from './watch';

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

  it('adds accepted alternatives to the note', () => {
    const withAlt = watchFrames({ ...line, accept: { '5': ['Nc6'], '3': ['c5', 'Nf6'] } });
    expect(withAlt[6].note).toBe('…c5 strikes at d4. Also good: …Nc6.');
    expect(withAlt[4].note).toBe('Also good: …c5 or …Nf6.');
  });

  it('rejects an illegal line', () => {
    expect(() => watchFrames({ ...line, moves: ['e4', 'e5', 'e5'] })).toThrow('ply 2 "e5" is illegal');
  });
});
