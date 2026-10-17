import { StyleSheet } from 'react-native';

import type { Opening, OpeningLine } from '@/content/types';
import type { RunMode } from '@/progress/mastery';
import { theme } from '@/theme';

/**
 * One line, or a level exam: every line of a level, with the Mastermind picking branches at random.
 * `random` marks a line picked by the random drill, so the result card offers another one.
 */
export type DrillTarget = {
  opening: Opening;
  lines: OpeningLine[];
  title: string;
  examLevel: number | null;
  random?: boolean;
};

export const MODE_LABELS: Record<RunMode, string> = { watch: 'Watch', practice: 'Practice', test: 'Test' };

/** Starts a new run of the same target in the given mode. */
export type Restart = (mode: RunMode) => void;

export function formatMoves(moves: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    parts.push(`${i / 2 + 1}. ${moves[i]}${moves[i + 1] ? ` ${moves[i + 1]}` : ''}`);
  }
  return parts.join('  ');
}

export const drillStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', padding: 8, gap: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 4 },
  status: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  good: { color: theme.good },
  bad: { color: theme.bad },
  below: { alignSelf: 'stretch', alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  note: { fontSize: 16, fontFamily: theme.font, color: theme.muted, textAlign: 'center' },
  moveList: { fontSize: 15, fontFamily: theme.mono, color: theme.muted, alignSelf: 'stretch', paddingHorizontal: 8 },
});
