import type { LevelStatus, LineStatus } from '@/progress/mastery';

/** How a line's tile looks: done, the one to play next, started, untouched, or behind a lock. */
export type StageState = 'mastered' | 'next' | 'started' | 'new' | 'locked';

export type Stage = {
  status: LineStatus;
  /** "1.2": level, then the line's place in the level (main lines first, then bonus). */
  number: string;
  bonus: boolean;
  state: StageState;
};

export type StageRow = { variation: string | null; stages: Stage[] };

/**
 * A level as rows of stages, one row per variation in the order variations first appear. A
 * variation's bonus lines join its own row (after its main lines), so each variation shows once.
 * `nextLineId` is the line to play next in this opening, if any.
 */
export function stageRows(level: LevelStatus, nextLineId: string | null): StageRow[] {
  const all = [
    ...level.mainLines.map((status) => ({ status, bonus: false })),
    ...level.bonusLines.map((status) => ({ status, bonus: true })),
  ];
  const rows: StageRow[] = [];
  all.forEach(({ status, bonus }, i) => {
    const stage: Stage = {
      status,
      number: `${level.level}.${i + 1}`,
      bonus,
      state: stageState(status, level.unlocked, nextLineId),
    };
    const variation = status.line.variation ?? null;
    const row = rows.find((r) => r.variation === variation);
    if (row) row.stages.push(stage);
    else rows.push({ variation, stages: [stage] });
  });
  // Within a row, main lines come before bonus lines.
  for (const row of rows) row.stages.sort((a, b) => Number(a.bonus) - Number(b.bonus));
  return rows;
}

function stageState(status: LineStatus, unlocked: boolean, nextLineId: string | null): StageState {
  if (!unlocked) return 'locked';
  if (status.mastered) return 'mastered';
  if (status.line.id === nextLineId) return 'next';
  return status.progress.watched || status.progress.practiced ? 'started' : 'new';
}

/** How far a line has come: watched, practised, mastered (for the tile's dots and the card). */
export function stageSteps(status: LineStatus): [boolean, boolean, boolean] {
  return [!!status.progress.watched || status.mastered, !!status.progress.practiced || status.mastered, status.mastered];
}
