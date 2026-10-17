import type { LevelStatus } from '@/progress/mastery';

/**
 * What the user opened or closed on an opening's screen. Only explicit choices are stored;
 * anything missing falls back to the defaults below.
 */
export type Folds = {
  /** Level number → open. */
  levels: Record<number, boolean>;
  /** Variation key (see variationKey) → open. Each heading folds on its own. */
  variations: Record<string, boolean>;
};

export const NO_FOLDS: Folds = { levels: {}, variations: {} };

/** By default only the level being worked on is open: the first unlocked one that isn't complete. */
export function levelOpenByDefault(level: number, levels: LevelStatus[]): boolean {
  return levels.find((l) => l.unlocked && !l.complete)?.level === level;
}

export function isLevelOpen(folds: Folds, level: number, levels: LevelStatus[]): boolean {
  const status = levels.find((l) => l.level === level);
  if (!status?.unlocked) return false;
  return folds.levels[level] ?? levelOpenByDefault(level, levels);
}

/** One heading's key: the same variation in another level, or among the bonus lines, folds separately. */
export function variationKey(level: number, bonus: boolean, variation: string): string {
  return `${level}:${bonus ? 'bonus' : 'main'}:${variation}`;
}

export function isVariationOpen(folds: Folds, variation: string): boolean {
  return folds.variations[variation] ?? true;
}

export function toggleLevel(folds: Folds, level: number, levels: LevelStatus[]): Folds {
  return { ...folds, levels: { ...folds.levels, [level]: !isLevelOpen(folds, level, levels) } };
}

export function toggleVariation(folds: Folds, variation: string): Folds {
  return { ...folds, variations: { ...folds.variations, [variation]: !isVariationOpen(folds, variation) } };
}

/** Reads saved folds, ignoring anything malformed. */
export function parseFolds(saved: unknown): Record<string, Folds> {
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved)) return {};
  const out: Record<string, Folds> = {};
  for (const [id, value] of Object.entries(saved as Record<string, unknown>)) {
    const v = value as Partial<Folds> | null;
    const bools = (o: unknown) =>
      Object.fromEntries(
        Object.entries(typeof o === 'object' && o !== null ? o : {}).filter(([, b]) => typeof b === 'boolean'),
      ) as Record<string, boolean>;
    out[id] = { levels: bools(v?.levels), variations: bools(v?.variations) };
  }
  return out;
}
