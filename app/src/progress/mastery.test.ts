import type { ContentIndex, Opening, OpeningLine } from '../content/types';
import {
  continueTarget,
  levelStatuses,
  masteredShare,
  randomTarget,
  recordExam,
  recordRun,
  suggestedMode,
  type Progress,
  type RunMode,
} from './mastery';

const line = (id: string, level: number, tier: 'main' | 'side'): OpeningLine => ({
  id,
  name: id,
  level,
  tier,
  moves: ['e4', 'e6'],
});

const french: Opening = {
  id: 'french',
  name: 'French',
  side: 'black',
  eco: 'C00',
  description: '',
  lines: [line('a', 1, 'main'), line('b', 1, 'main'), line('s', 1, 'side'), line('c', 2, 'main'), line('d', 3, 'main')],
};
const caro: Opening = { ...french, id: 'caro', lines: [line('k1', 1, 'main')] };

const index: ContentIndex = {
  contentVersion: 1,
  openings: [
    { id: 'french', name: 'French', side: 'black', file: 'f' },
    { id: 'caro', name: 'Caro', side: 'black', file: 'c' },
  ],
};
const load = (id: string) => ({ french, caro })[id as 'french' | 'caro'] ?? null;

const run = (progress: Progress, lineId: string, mode: RunMode = 'test', clean = true, openingId = 'french') =>
  recordRun(progress, openingId, lineId, { mode, clean });

describe('levels', () => {
  it('starts with only level 1 unlocked, sidelines as bonus', () => {
    const levels = levelStatuses(french, {});

    expect(levels.map((l) => [l.level, l.unlocked, l.complete])).toEqual([
      [1, true, false],
      [2, false, false],
      [3, false, false],
    ]);
    expect(levels[0].mainLines.map((l) => l.line.id)).toEqual(['a', 'b']);
    expect(levels[0].bonusLines.map((l) => l.line.id)).toEqual(['s']);
  });

  it('masters a line with one clean Test run', () => {
    expect(levelStatuses(french, run({}, 'a'))[0].mainLines[0].mastered).toBe(true);
  });

  it('does not master a line with Practice or an unclean Test', () => {
    const progress = run(run({}, 'a', 'practice'), 'a', 'test', false);
    expect(levelStatuses(french, progress)[0].mainLines[0].mastered).toBe(false);
  });

  it('unlocks the next level when every main line is mastered, bonus lines not needed', () => {
    const halfway = run({}, 'a');
    expect(levelStatuses(french, halfway)[1].unlocked).toBe(false);

    const levels = levelStatuses(french, run(halfway, 'b'));
    expect(levels[0].complete).toBe(true);
    expect(levels[1]).toMatchObject({ unlocked: true, complete: false });
    expect(levels[2].unlocked).toBe(false);
  });

  it('keeps later levels locked behind an incomplete earlier one', () => {
    expect(levelStatuses(french, run({}, 'c'))[2].unlocked).toBe(false);
  });

  it('records a passed exam as a star on that level', () => {
    const progress = recordExam(recordExam({}, 'french', 1), 'french', 1);
    expect(progress.french.examsPassed).toEqual([1]);
    expect(levelStatuses(french, progress).map((l) => l.examPassed)).toEqual([true, false, false]);
  });

  it('reports the share of main lines mastered', () => {
    expect(masteredShare(french, {})).toBe(0);
    expect(masteredShare(french, run({}, 'a'))).toBe(0.25);
  });
});

describe('runs', () => {
  it('tracks watched, practiced and when', () => {
    const watched = run({}, 'a', 'watch');
    expect(watched.french.lines.a).toMatchObject({ cleanRuns: 0, watched: true, lastPlayed: expect.any(String) });

    const practiced = run(watched, 'a', 'practice', false);
    expect(practiced.french.lines.a).toMatchObject({ watched: true, practiced: true });
  });

  it('suggests Watch, then Practice, then Test', () => {
    expect(suggestedMode({ cleanRuns: 0 })).toBe('watch');
    expect(suggestedMode({ cleanRuns: 0, watched: true })).toBe('practice');
    expect(suggestedMode({ cleanRuns: 0, watched: true, practiced: true })).toBe('test');
  });

  it('does not mutate the progress it is given', () => {
    const before: Progress = {};
    run(before, 'a');
    recordExam(before, 'french', 1);
    expect(before).toEqual({});
  });
});

describe('continueTarget', () => {
  it('starts with the first line of the first opening, in Watch', () => {
    expect(continueTarget(index, load, {})).toEqual({ openingId: 'french', lineId: 'a', mode: 'watch' });
  });

  it('moves on to the next unmastered main line, then the bonus lines', () => {
    expect(continueTarget(index, load, run({}, 'a'))).toMatchObject({ lineId: 'b', mode: 'watch' });
    expect(continueTarget(index, load, run(run({}, 'a'), 'b'))).toMatchObject({ lineId: 'c' });
  });

  it('suggests the next mode for a line in progress', () => {
    expect(continueTarget(index, load, run({}, 'a', 'watch'))).toMatchObject({ lineId: 'a', mode: 'practice' });
  });

  it('prefers the most recently played opening', () => {
    const progress = run({}, 'k1', 'watch', true, 'caro');
    expect(continueTarget(index, load, progress)).toMatchObject({ openingId: 'caro', lineId: 'k1' });
  });

  it('moves to another opening when one is finished, and returns null when all are', () => {
    let progress: Progress = {};
    for (const id of ['a', 'b', 's', 'c', 'd']) progress = run(progress, id);
    expect(continueTarget(index, load, progress)).toMatchObject({ openingId: 'caro', lineId: 'k1' });

    progress = run(progress, 'k1', 'test', true, 'caro');
    expect(continueTarget(index, load, progress)).toBeNull();
  });
});

describe('randomTarget', () => {
  const ids = (progress: Progress) =>
    [0, 0.2, 0.4, 0.6, 0.8, 0.99].map((r) => randomTarget(index, load, progress, () => r)?.lineId);

  it('picks from the unlocked levels of every opening, bonus lines included', () => {
    expect(new Set(ids({}))).toEqual(new Set(['a', 'b', 's', 'k1']));
    const level2 = run(run({}, 'a'), 'b');
    expect(new Set(ids(level2))).toEqual(new Set(['a', 'b', 's', 'c', 'k1']));
  });

  it('suggests the mode for the picked line', () => {
    const progress = run({}, 'a', 'watch');
    expect(randomTarget(index, load, progress, () => 0)).toEqual({ openingId: 'french', lineId: 'a', mode: 'practice' });
  });

  it('skips the excluded line unless it is the only one', () => {
    expect(randomTarget(index, load, {}, () => 0, 'a')?.lineId).toBe('b');
    const onlyCaro = (id: string) => (id === 'caro' ? caro : null);
    expect(randomTarget(index, onlyCaro, {}, () => 0, 'k1')?.lineId).toBe('k1');
    expect(randomTarget(index, () => null, {})).toBeNull();
  });
});
