import { OPENING_TAGS, type Opening, type OpeningTag, type Side } from '@/content/types';

/**
 * The Openings screen's filter. Within side and first move, picking several means "any of
 * them"; each tag narrows the list further (an opening needs all picked tags). The groups
 * narrow each other. An empty group doesn't filter.
 */
export type OpeningFilter = { sides: Side[]; firstMoves: string[]; tags: OpeningTag[] };

export const NO_FILTER: OpeningFilter = { sides: [], firstMoves: [], tags: [] };

/** White's first moves (SAN) across an opening's lines, e.g. ["e4"]. For Black, what it answers. */
export function firstMoves(opening: Opening): string[] {
  return sortMoves([...new Set(opening.lines.map((l) => l.moves[0]).filter(Boolean))]);
}

export function matchesFilter(opening: Opening, filter: OpeningFilter): boolean {
  const tags = opening.tags ?? [];
  return (
    (filter.sides.length === 0 || filter.sides.includes(opening.side)) &&
    (filter.firstMoves.length === 0 || firstMoves(opening).some((m) => filter.firstMoves.includes(m))) &&
    filter.tags.every((t) => tags.includes(t))
  );
}

export function filterOpenings(openings: Opening[], filter: OpeningFilter): Opening[] {
  return openings.filter((o) => matchesFilter(o, filter));
}

/** The chips worth showing: first moves and tags that at least one opening has. */
export function filterChoices(openings: Opening[]): { firstMoves: string[]; tags: OpeningTag[] } {
  const used = new Set(openings.flatMap((o) => o.tags ?? []));
  return {
    firstMoves: sortMoves([...new Set(openings.flatMap(firstMoves))]),
    tags: OPENING_TAGS.filter((t) => used.has(t)),
  };
}

export function isFiltering(filter: OpeningFilter): boolean {
  return filter.sides.length + filter.firstMoves.length + filter.tags.length > 0;
}

/** Adds the value if it's missing, removes it if it's there. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// The usual first moves in their usual order, anything rarer after them alphabetically.
const COMMON_FIRST_MOVES = ['e4', 'd4', 'c4', 'Nf3'];

function sortMoves(moves: string[]): string[] {
  const rank = (m: string) => {
    const i = COMMON_FIRST_MOVES.indexOf(m);
    return i === -1 ? COMMON_FIRST_MOVES.length : i;
  };
  return moves.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
