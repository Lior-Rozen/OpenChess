import type { ContentIndex, Opening, OpeningLine } from '../content/types';

export type LineProgress = {
  /** Clean Test runs so far; one masters the line. Kept as a count for stats and review later. */
  cleanRuns: number;
  /** A Watch run was played to the end. */
  watched?: boolean;
  /** A Practice or Test run was played to the end. */
  practiced?: boolean;
  /** ISO timestamp of the last finished run. */
  lastPlayed?: string;
};

export type OpeningProgress = {
  lines: Record<string, LineProgress>;
  /** Levels whose exam (random branches, every line) was passed cleanly. */
  examsPassed?: number[];
};

/** All progress, keyed by opening id. Unlocked levels are derived from it, never stored. */
export type Progress = Record<string, OpeningProgress>;

export type LineStatus = { line: OpeningLine; progress: LineProgress; mastered: boolean };

export type LevelStatus = {
  level: number;
  /** Required to complete the level. */
  mainLines: LineStatus[];
  /** Optional sidelines. */
  bonusLines: LineStatus[];
  unlocked: boolean;
  /** Every main line is mastered. */
  complete: boolean;
  /** The optional level exam was passed (shown as a star). */
  examPassed: boolean;
};

export type RunMode = 'watch' | 'practice' | 'test';

export function openingProgress(progress: Progress, openingId: string): OpeningProgress {
  return progress[openingId] ?? { lines: {} };
}

export function lineProgress(progress: Progress, openingId: string, lineId: string): LineProgress {
  return openingProgress(progress, openingId).lines[lineId] ?? { cleanRuns: 0 };
}

export const isMastered = (line: LineProgress) => line.cleanRuns >= 1;

/** Levels 1…N of an opening, with mastery and lock state. A level unlocks when the one before is complete. */
export function levelStatuses(opening: Opening, progress: Progress): LevelStatus[] {
  const saved = openingProgress(progress, opening.id);
  const maxLevel = Math.max(0, ...opening.lines.map((l) => l.level));
  const status = (line: OpeningLine): LineStatus => {
    const p = saved.lines[line.id] ?? { cleanRuns: 0 };
    return { line, progress: p, mastered: isMastered(p) };
  };

  const levels: LevelStatus[] = [];
  let previousComplete = true;
  for (let level = 1; level <= maxLevel; level++) {
    const lines = opening.lines.filter((l) => l.level === level);
    const mainLines = lines.filter((l) => l.tier === 'main').map(status);
    const complete = mainLines.every((l) => l.mastered);
    levels.push({
      level,
      mainLines,
      bonusLines: lines.filter((l) => l.tier === 'side').map(status),
      unlocked: previousComplete,
      complete,
      examPassed: saved.examsPassed?.includes(level) ?? false,
    });
    previousComplete = previousComplete && complete;
  }
  return levels;
}

/** Share of main lines mastered, 0…1. */
export function masteredShare(opening: Opening, progress: Progress): number {
  const lines = levelStatuses(opening, progress).flatMap((l) => l.mainLines);
  return lines.length === 0 ? 0 : lines.filter((l) => l.mastered).length / lines.length;
}

/** The mode to suggest for a line: Watch it first, then Practice, then Test until mastered. */
export function suggestedMode(line: LineProgress): RunMode {
  if (line.practiced) return 'test';
  if (line.watched) return 'practice';
  return 'watch';
}

export type ContinueTarget = { openingId: string; lineId: string; mode: RunMode };

/**
 * What the Home screen's Continue button opens: in the most recently played opening (else the
 * first one), the first unmastered main line of an unlocked level, then the bonus lines; if that
 * opening is all done, the next opening with something left. Null when everything is mastered.
 */
export function continueTarget(
  index: ContentIndex,
  loadOpening: (id: string) => Opening | null,
  progress: Progress,
): ContinueTarget | null {
  const lastPlayed = (id: string) =>
    Object.values(openingProgress(progress, id).lines).reduce(
      (latest, l) => (l.lastPlayed && l.lastPlayed > latest ? l.lastPlayed : latest),
      '',
    );
  const ids = index.openings.map((o) => o.id);
  const recent = [...ids].sort((a, b) => lastPlayed(b).localeCompare(lastPlayed(a)))[0];
  const order = recent ? [recent, ...ids.filter((id) => id !== recent)] : ids;

  for (const id of order) {
    const opening = loadOpening(id);
    if (!opening) continue;
    const unlocked = levelStatuses(opening, progress).filter((l) => l.unlocked);
    const next =
      unlocked.flatMap((l) => l.mainLines).find((l) => !l.mastered) ??
      unlocked.flatMap((l) => l.bonusLines).find((l) => !l.mastered);
    if (next) return { openingId: id, lineId: next.line.id, mode: suggestedMode(next.progress) };
  }
  return null;
}

/**
 * A random line from every unlocked level of every opening (main and bonus lines), in the mode
 * suggested for it. `exclude` skips a line, e.g. the one just played, unless it's the only one.
 * `random` returns a number in [0, 1), like Math.random.
 */
export function randomTarget(
  index: ContentIndex,
  loadOpening: (id: string) => Opening | null,
  progress: Progress,
  random: () => number = Math.random,
  exclude?: string,
): ContinueTarget | null {
  const candidates = index.openings.flatMap((entry) => {
    const opening = loadOpening(entry.id);
    if (!opening) return [];
    return levelStatuses(opening, progress)
      .filter((l) => l.unlocked)
      .flatMap((l) => [...l.mainLines, ...l.bonusLines])
      .map((l) => ({ openingId: opening.id, lineId: l.line.id, mode: suggestedMode(l.progress) }));
  });
  const pool = candidates.length > 1 ? candidates.filter((c) => c.lineId !== exclude) : candidates;
  if (pool.length === 0) return null;
  return pool[Math.min(Math.floor(random() * pool.length), pool.length - 1)];
}

/** Records a run that was played to the end. Only a clean Test run counts towards mastery. */
export function recordRun(
  progress: Progress,
  openingId: string,
  lineId: string,
  run: { mode: RunMode; clean: boolean },
  now = new Date(),
): Progress {
  const opening = openingProgress(progress, openingId);
  const line = opening.lines[lineId] ?? { cleanRuns: 0 };
  const updated: LineProgress = {
    ...line,
    cleanRuns: line.cleanRuns + (run.mode === 'test' && run.clean ? 1 : 0),
    lastPlayed: now.toISOString(),
    ...(run.mode === 'watch' ? { watched: true } : { practiced: true }),
  };
  return { ...progress, [openingId]: { ...opening, lines: { ...opening.lines, [lineId]: updated } } };
}

/** Records a passed level exam. */
export function recordExam(progress: Progress, openingId: string, level: number): Progress {
  const opening = openingProgress(progress, openingId);
  const examsPassed = [...new Set([...(opening.examsPassed ?? []), level])].sort((a, b) => a - b);
  return { ...progress, [openingId]: { ...opening, examsPassed } };
}
