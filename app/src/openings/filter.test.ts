import type { Opening, OpeningTag, Side } from '@/content/types';

import { filterChoices, filterOpenings, firstMoves, isFiltering, NO_FILTER, toggle } from './filter';

function opening(id: string, side: Side, starts: string[], tags?: OpeningTag[]): Opening {
  return {
    id,
    name: id,
    side,
    eco: 'A00',
    description: '',
    tags,
    lines: starts.map((move, i) => ({ id: `${id}-${i}`, name: 'Line', level: 1, tier: 'main', moves: [move] })),
  };
}

const french = opening('french', 'black', ['e4'], ['solid', 'positional']);
const caro = opening('caro', 'black', ['e4'], ['solid', 'beginner-friendly']);
const slav = opening('slav', 'black', ['d4'], ['solid', 'positional']);
const london = opening('london', 'white', ['d4'], ['system', 'solid', 'beginner-friendly']);
const vienna = opening('vienna', 'white', ['e4'], ['aggressive', 'gambit']);
const english = opening('english', 'white', ['c4']);
const all = [french, caro, slav, london, vienna, english];
const ids = (list: Opening[]) => list.map((o) => o.id);

describe('openings filter', () => {
  it('shows everything with no filter', () => {
    expect(filterOpenings(all, NO_FILTER)).toEqual(all);
    expect(isFiltering(NO_FILTER)).toBe(false);
  });

  it('filters by side, any of the picked ones', () => {
    expect(ids(filterOpenings(all, { ...NO_FILTER, sides: ['white'] }))).toEqual(['london', 'vienna', 'english']);
    expect(filterOpenings(all, { ...NO_FILTER, sides: ['white', 'black'] })).toEqual(all);
  });

  it('filters by first move, any of the picked ones', () => {
    expect(ids(filterOpenings(all, { ...NO_FILTER, firstMoves: ['d4'] }))).toEqual(['slav', 'london']);
    expect(ids(filterOpenings(all, { ...NO_FILTER, firstMoves: ['d4', 'c4'] }))).toEqual(['slav', 'london', 'english']);
  });

  it('needs every picked tag', () => {
    expect(ids(filterOpenings(all, { ...NO_FILTER, tags: ['solid'] }))).toEqual(['french', 'caro', 'slav', 'london']);
    expect(ids(filterOpenings(all, { ...NO_FILTER, tags: ['solid', 'beginner-friendly'] }))).toEqual(['caro', 'london']);
    expect(filterOpenings(all, { ...NO_FILTER, tags: ['gambit', 'solid'] })).toEqual([]);
  });

  it('combines the groups', () => {
    const filter = { sides: ['black' as const], firstMoves: ['d4'], tags: ['solid' as const] };
    expect(ids(filterOpenings(all, filter))).toEqual(['slav']);
    expect(isFiltering(filter)).toBe(true);
  });

  it('matches an opening on any of its first moves', () => {
    const both = opening('both', 'black', ['e4', 'd4', 'e4']);
    expect(firstMoves(both)).toEqual(['e4', 'd4']);
    expect(ids(filterOpenings([both], { ...NO_FILTER, firstMoves: ['d4'] }))).toEqual(['both']);
  });

  it('offers only first moves and tags that are used, in a sensible order', () => {
    const odd = opening('odd', 'white', ['b3']);
    expect(filterChoices([...all, odd])).toEqual({
      firstMoves: ['e4', 'd4', 'c4', 'b3'],
      tags: ['gambit', 'aggressive', 'solid', 'positional', 'system', 'beginner-friendly'],
    });
    expect(filterChoices([english]).tags).toEqual([]);
  });

  it('toggles a value in and out of a list', () => {
    expect(toggle(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggle(['a', 'b'], 'a')).toEqual(['b']);
  });
});
