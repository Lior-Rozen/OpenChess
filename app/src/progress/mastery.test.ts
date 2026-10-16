import type { Opening, OpeningLine } from '../content/types';
import {
  countsFor,
  levelStatuses,
  masteredShare,
  recordRun,
  setDifficulty,
  type Progress,
} from './mastery';

const line = (id: string, level: number, tier: 'main' | 'side'): OpeningLine => ({
  id,
  name: id,
  level,
  tier,
  moves: ['e4', 'e6'],
});

const opening: Opening = {
  id: 'french',
  name: 'French',
  side: 'black',
  eco: 'C00',
  description: '',
  lines: [line('a', 1, 'main'), line('b', 1, 'main'), line('s', 1, 'side'), line('c', 2, 'main'), line('d', 3, 'main')],
};

type Run = { mode: 'practice' | 'test'; clean: boolean };
const test: Run = { mode: 'test', clean: true };

/** Records the same run `times` times. */
function runs(progress: Progress, lineId: string, times: number, run: Run = test): Progress {
  let next = progress;
  for (let i = 0; i < times; i++) next = recordRun(next, 'french', lineId, run);
  return next;
}

describe('mastery', () => {
  it('counts only main lines on Easy, every line otherwise', () => {
    expect(countsFor(line('s', 1, 'side'), 'easy')).toBe(false);
    expect(countsFor(line('s', 1, 'side'), 'normal')).toBe(true);
    expect(countsFor(line('s', 1, 'side'), 'hard')).toBe(true);
  });

  it('starts with only level 1 unlocked, on Easy', () => {
    const levels = levelStatuses(opening, {});

    expect(levels.map((l) => [l.level, l.unlocked, l.complete])).toEqual([
      [1, true, false],
      [2, false, false],
      [3, false, false],
    ]);
    expect(levels[0].lines.map((l) => l.line.id)).toEqual(['a', 'b']); // no sideline on Easy
  });

  it('unlocks level 2 once every Easy line of level 1 has a clean Test run', () => {
    const halfway = runs({}, 'a', 1);
    expect(levelStatuses(opening, halfway)[1].unlocked).toBe(false);

    const done = runs(halfway, 'b', 1);
    const levels = levelStatuses(opening, done);
    expect(levels[0]).toMatchObject({ complete: true });
    expect(levels[1]).toMatchObject({ unlocked: true, complete: false });
    expect(levels[2]).toMatchObject({ unlocked: false });
  });

  it('needs 2 clean runs on Normal and 3 on Hard, sidelines included', () => {
    let progress = setDifficulty({}, 'french', 'normal');
    progress = runs(progress, 'a', 2);
    progress = runs(progress, 'b', 2);
    expect(levelStatuses(opening, progress)[1].unlocked).toBe(false); // sideline 's' still missing

    progress = runs(progress, 's', 2);
    expect(levelStatuses(opening, progress)[1].unlocked).toBe(true);

    progress = setDifficulty(progress, 'french', 'hard');
    expect(levelStatuses(opening, progress)[1].unlocked).toBe(false); // 2 runs aren't enough on Hard
  });

  it('only counts clean Test runs', () => {
    let progress = runs({}, 'a', 1, { mode: 'practice', clean: true });
    progress = runs(progress, 'a', 1, { mode: 'test', clean: false });

    expect(progress.french.lines.a.cleanRuns).toBe(0);
    expect(progress.french.lines.a.lastPlayed).toEqual(expect.any(String));
  });

  it('keeps later levels locked behind an incomplete earlier one', () => {
    const progress = runs({}, 'c', 1); // level 2 mastered, level 1 not
    expect(levelStatuses(opening, progress)[2].unlocked).toBe(false);
  });

  it('reports the share of mastered lines', () => {
    expect(masteredShare(opening, {})).toBe(0);
    expect(masteredShare(opening, runs({}, 'a', 1))).toBe(0.25); // 1 of 4 main lines
  });

  it('does not mutate the progress it is given', () => {
    const before: Progress = {};
    recordRun(before, 'french', 'a', test);
    setDifficulty(before, 'french', 'hard');
    expect(before).toEqual({});
  });
});
