import type { Opening, OpeningLine } from '../content/types';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type LineProgress = {
  /** Clean Test runs so far. A failed run doesn't reset it (spaced review comes in phase 6). */
  cleanRuns: number;
  /** ISO timestamp of the last finished Practice/Test run. */
  lastPlayed?: string;
};

export type OpeningProgress = {
  difficulty: Difficulty;
  lines: Record<string, LineProgress>;
};

/** All progress, keyed by opening id. Unlocked levels are derived from it, never stored. */
export type Progress = Record<string, OpeningProgress>;

export const DEFAULT_DIFFICULTY: Difficulty = 'easy';

/** Clean Test runs needed to master a line. */
export const REQUIRED_CLEAN_RUNS: Record<Difficulty, number> = { easy: 1, normal: 2, hard: 3 };

export type LineStatus = { line: OpeningLine; cleanRuns: number; mastered: boolean };

export type LevelStatus = {
  level: number;
  /** Lines in this level that count for the difficulty. */
  lines: LineStatus[];
  unlocked: boolean;
  /** Every counting line is mastered (vacuously true if none count). */
  complete: boolean;
};

export function openingProgress(progress: Progress, openingId: string): OpeningProgress {
  return progress[openingId] ?? { difficulty: DEFAULT_DIFFICULTY, lines: {} };
}

/** Easy: main lines only. Normal and Hard: every line (Hard also randomises branches). */
export function countsFor(line: OpeningLine, difficulty: Difficulty): boolean {
  return difficulty !== 'easy' || line.tier === 'main';
}

/** Levels 1…N of an opening with their lines, mastery and lock state for the chosen difficulty. */
export function levelStatuses(opening: Opening, progress: Progress): LevelStatus[] {
  const { difficulty, lines } = openingProgress(progress, opening.id);
  const required = REQUIRED_CLEAN_RUNS[difficulty];
  const maxLevel = Math.max(0, ...opening.lines.map((l) => l.level));

  const statuses: LevelStatus[] = [];
  let previousComplete = true;
  for (let level = 1; level <= maxLevel; level++) {
    const levelLines = opening.lines
      .filter((l) => l.level === level && countsFor(l, difficulty))
      .map((line) => {
        const cleanRuns = lines[line.id]?.cleanRuns ?? 0;
        return { line, cleanRuns, mastered: cleanRuns >= required };
      });
    const complete = levelLines.every((l) => l.mastered);
    statuses.push({ level, lines: levelLines, unlocked: previousComplete, complete });
    previousComplete = previousComplete && complete;
  }
  return statuses;
}

/** Share of counting lines mastered, 0…1, for the chosen difficulty. */
export function masteredShare(opening: Opening, progress: Progress): number {
  const lines = levelStatuses(opening, progress).flatMap((l) => l.lines);
  return lines.length === 0 ? 0 : lines.filter((l) => l.mastered).length / lines.length;
}

/** Records a finished Practice/Test run. Only a clean Test run counts towards mastery. */
export function recordRun(
  progress: Progress,
  openingId: string,
  lineId: string,
  run: { mode: 'practice' | 'test'; clean: boolean },
  now = new Date(),
): Progress {
  const opening = openingProgress(progress, openingId);
  const line = opening.lines[lineId] ?? { cleanRuns: 0 };
  const cleanRuns = line.cleanRuns + (run.mode === 'test' && run.clean ? 1 : 0);
  return {
    ...progress,
    [openingId]: {
      ...opening,
      lines: { ...opening.lines, [lineId]: { ...line, cleanRuns, lastPlayed: now.toISOString() } },
    },
  };
}

export function setDifficulty(progress: Progress, openingId: string, difficulty: Difficulty): Progress {
  return { ...progress, [openingId]: { ...openingProgress(progress, openingId), difficulty } };
}
