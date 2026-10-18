import { addPosition, defaultName, parsePositions, removePosition } from './savedPositions';

const now = new Date('2026-10-18T10:00:00Z');

describe('saved positions', () => {
  it('adds new positions at the top, with a default name when none is typed', () => {
    let list = addPosition([], { name: '  ', board: { e1: 'wK', e8: 'bK' }, turn: 'w' }, now);
    list = addPosition(list, { name: 'Lucena', board: { a1: 'wR' }, turn: 'b' }, now);
    expect(list.map((p) => [p.name, p.turn])).toEqual([
      ['Lucena', 'b'],
      ['Position 1', 'w'],
    ]);
    expect(list[1].board).toEqual({ e1: 'wK', e8: 'bK' });
    expect(new Set(list.map((p) => p.id)).size).toBe(2);
  });

  it('skips default names that are taken', () => {
    const list = addPosition([], { name: 'Position 2', board: {}, turn: 'w' }, now);
    expect(defaultName(list)).toBe('Position 3');
  });

  it('removes a position by id', () => {
    const list = addPosition(addPosition([], { name: 'A', board: {}, turn: 'w' }, now), { name: 'B', board: {}, turn: 'w' }, now);
    expect(removePosition(list, list[0].id).map((p) => p.name)).toEqual(['A']);
  });

  it('reads saved positions and drops anything malformed', () => {
    expect(parsePositions(null)).toEqual([]);
    expect(
      parsePositions([
        { id: '1', name: 'Ok', turn: 'b', savedAt: 'x', board: { e1: 'wK', z9: 'wK', e2: 'wX' } },
        { id: '2', name: 'No turn', board: {} },
        null,
      ]),
    ).toEqual([{ id: '1', name: 'Ok', turn: 'b', savedAt: 'x', board: { e1: 'wK' } }]);
  });
});
