export type Side = 'white' | 'black';
export type Tier = 'main' | 'side';

export type OpeningLine = {
  id: string;
  name: string;
  level: number;
  tier: Tier;
  /** SAN moves from the starting position, both sides. */
  moves: string[];
  /** One-line "why" notes, keyed by 0-based ply index. */
  notes?: Record<string, string>;
  /** Short takeaway shown on the "Line complete" card. */
  summary?: string;
};

export type Opening = {
  id: string;
  name: string;
  side: Side;
  eco: string;
  description: string;
  lines: OpeningLine[];
};

export type ContentIndexEntry = { id: string; name: string; side: Side; file: string };

export type ContentIndex = {
  contentVersion: number;
  openings: ContentIndexEntry[];
};
