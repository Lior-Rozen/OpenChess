import type { OpeningLine } from '@/content/types';
import type { LevelStatus, LineStatus } from '@/progress/mastery';

import { stageRows, stageSteps } from './stages';

const status = (id: string, variation: string | undefined, p: Partial<LineStatus['progress']> = {}): LineStatus => {
  const line: OpeningLine = { id, name: id, level: 1, tier: 'main', moves: ['e4'], variation };
  const progress = { cleanRuns: 0, ...p };
  return { line, progress, mastered: progress.cleanRuns >= 1 };
};

const level = (unlocked = true): LevelStatus => ({
  level: 1,
  mainLines: [status('a', 'Gambit', { cleanRuns: 1 }), status('b', 'Gambit', { practiced: true }), status('c', 'vs Nc6')],
  bonusLines: [status('s', 'Gambit'), status('t', 'vs Bc5')],
  unlocked,
  complete: false,
  examPassed: false,
});

describe('stage rows', () => {
  it('puts each variation in one row, bonus lines after its main lines, numbered through the level', () => {
    const rows = stageRows(level(), 'c');
    expect(rows.map((r) => [r.variation, r.stages.map((s) => `${s.number}${s.bonus ? 'b' : ''}`)])).toEqual([
      ['Gambit', ['1.1', '1.2', '1.4b']],
      ['vs Nc6', ['1.3']],
      ['vs Bc5', ['1.5b']],
    ]);
  });

  it('marks mastered, next, started and new lines, and everything in a locked level', () => {
    const states = (rows: ReturnType<typeof stageRows>) => rows.flatMap((r) => r.stages.map((s) => s.state));
    expect(states(stageRows(level(), 'c'))).toEqual(['mastered', 'started', 'new', 'next', 'new']);
    expect(new Set(states(stageRows(level(false), 'c')))).toEqual(new Set(['locked']));
  });

  it('reports the steps a line has been through', () => {
    expect(stageSteps(status('x', undefined))).toEqual([false, false, false]);
    expect(stageSteps(status('x', undefined, { watched: true }))).toEqual([true, false, false]);
    expect(stageSteps(status('x', undefined, { cleanRuns: 1 }))).toEqual([true, true, true]);
  });
});
