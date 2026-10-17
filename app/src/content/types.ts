export type Side = 'white' | 'black';
export type Tier = 'main' | 'side';

/** Labels for filtering openings. Add new ones here (the validator only accepts these). */
export const OPENING_TAGS = ['gambit', 'aggressive', 'solid', 'positional', 'system', 'beginner-friendly'] as const;
export type OpeningTag = (typeof OPENING_TAGS)[number];

export type OpeningLine = {
  id: string;
  name: string;
  level: number;
  tier: Tier;
  /** The variation the line belongs to, e.g. "Advance". The Opening screen groups lines by it. */
  variation?: string;
  /** SAN moves from the starting position, both sides. */
  moves: string[];
  /** One-line "why" notes, keyed by 0-based ply index. */
  notes?: Record<string, string>;
  /**
   * Other good moves for the user, keyed by 0-based ply index. They aren't mistakes: the app says
   * so, shows the book move as an arrow, and the line goes on with the book move.
   */
  accept?: Record<string, string[]>;
  /**
   * Common mistakes for the user, keyed by 0-based ply index, then by SAN, with a one-line
   * reason. Playing one still counts as a mistake, but the reason is shown.
   */
  mistakes?: Record<string, Record<string, string>>;
  /** Short takeaway shown on the "Line complete" card. */
  summary?: string;
};

export type Opening = {
  id: string;
  name: string;
  side: Side;
  eco: string;
  description: string;
  /** Optional labels for filtering, e.g. ["gambit", "aggressive"]. */
  tags?: OpeningTag[];
  lines: OpeningLine[];
};

export type ContentIndexEntry = { id: string; name: string; side: Side; file: string };

export type ContentIndex = {
  contentVersion: number;
  openings: ContentIndexEntry[];
};
