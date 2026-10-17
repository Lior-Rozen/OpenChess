import type { LevelStatus } from '@/progress/mastery';

import { isLevelOpen, isVariationOpen, NO_FOLDS, parseFolds, toggleLevel, toggleVariation } from './folds';

const level = (n: number, unlocked: boolean, complete: boolean): LevelStatus => ({
  level: n,
  mainLines: [],
  bonusLines: [],
  unlocked,
  complete,
  examPassed: false,
});

const levels = [level(1, true, true), level(2, true, false), level(3, false, false)];

describe('opening screen folds', () => {
  it('opens only the level being worked on by default', () => {
    expect(levels.map((l) => isLevelOpen(NO_FOLDS, l.level, levels))).toEqual([false, true, false]);
  });

  it('opens nothing by default once every level is complete', () => {
    const done = [level(1, true, true), level(2, true, true)];
    expect(done.map((l) => isLevelOpen(NO_FOLDS, l.level, done))).toEqual([false, false]);
  });

  it('toggles levels, but a locked level stays closed', () => {
    let folds = toggleLevel(NO_FOLDS, 1, levels);
    folds = toggleLevel(folds, 2, levels);
    expect(levels.map((l) => isLevelOpen(folds, l.level, levels))).toEqual([true, false, false]);
    expect(isLevelOpen(toggleLevel(NO_FOLDS, 3, levels), 3, levels)).toBe(false);
  });

  it('keeps variations open until folded, by name', () => {
    expect(isVariationOpen(NO_FOLDS, 'vs 2…Nc6')).toBe(true);
    const folds = toggleVariation(NO_FOLDS, 'vs 2…Nc6');
    expect(isVariationOpen(folds, 'vs 2…Nc6')).toBe(false);
    expect(isVariationOpen(folds, 'Vienna Gambit')).toBe(true);
    expect(isVariationOpen(toggleVariation(folds, 'vs 2…Nc6'), 'vs 2…Nc6')).toBe(true);
  });

  it('reads saved folds and drops anything malformed', () => {
    expect(parseFolds(null)).toEqual({});
    expect(parseFolds([1])).toEqual({});
    expect(parseFolds({ vienna: { levels: { 1: true, 2: 'x' }, variations: { A: false } }, bad: null })).toEqual({
      vienna: { levels: { 1: true }, variations: { A: false } },
      bad: { levels: {}, variations: {} },
    });
  });
});
