import type { LevelStatus } from '@/progress/mastery';

import { isLevelOpen, isVariationOpen, NO_FOLDS, parseFolds, toggleLevel, toggleVariation, variationKey } from './folds';

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

  it('keeps variations open until folded, each heading on its own', () => {
    const main = variationKey(1, false, 'Vienna Gambit');
    const bonus = variationKey(1, true, 'Vienna Gambit');
    const level2 = variationKey(2, false, 'Vienna Gambit');
    expect(isVariationOpen(NO_FOLDS, main)).toBe(true);
    const folds = toggleVariation(NO_FOLDS, main);
    expect(isVariationOpen(folds, main)).toBe(false);
    expect(isVariationOpen(folds, bonus)).toBe(true);
    expect(isVariationOpen(folds, level2)).toBe(true);
    expect(isVariationOpen(toggleVariation(folds, main), main)).toBe(true);
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
