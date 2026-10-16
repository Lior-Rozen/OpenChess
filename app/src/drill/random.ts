import { router } from 'expo-router';

import { contentIndex, loadOpening } from '@/content/loader';
import { randomTarget, type Progress } from '@/progress/mastery';

/**
 * Opens a random unlocked line in its suggested mode. `exclude` avoids repeating the line just
 * played; `replace` swaps the current drill screen instead of stacking a new one.
 */
export function startRandomDrill(progress: Progress, { exclude, replace = false }: { exclude?: string; replace?: boolean } = {}) {
  const target = randomTarget(contentIndex, loadOpening, progress, Math.random, exclude);
  if (!target) return;
  const route = {
    pathname: '/drill' as const,
    params: { opening: target.openingId, line: target.lineId, mode: target.mode, random: '1' },
  };
  if (replace) router.replace(route);
  else router.push(route);
}
