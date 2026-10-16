import index from '../../../content/index.json';
import french from '../../../content/openings/french.json';
import caroKann from '../../../content/openings/caro-kann.json';
import sicilian from '../../../content/openings/sicilian.json';
import scandinavian from '../../../content/openings/scandinavian.json';
import kingsIndian from '../../../content/openings/kings-indian.json';
import slav from '../../../content/openings/slav.json';
import italian from '../../../content/openings/italian.json';
import ruyLopez from '../../../content/openings/ruy-lopez.json';

import type { ContentIndex, Opening, OpeningLine } from './types';

// The content is bundled into the app, so it works offline. Metro can't import by a computed
// path, so every opening file listed in content/index.json must also be listed here.
const bundledByFile: Record<string, unknown> = {
  'openings/french.json': french,
  'openings/caro-kann.json': caroKann,
  'openings/sicilian.json': sicilian,
  'openings/scandinavian.json': scandinavian,
  'openings/kings-indian.json': kingsIndian,
  'openings/slav.json': slav,
  'openings/italian.json': italian,
  'openings/ruy-lopez.json': ruyLopez,
};

export const contentIndex = index as ContentIndex;
export const bundledContent: Readonly<Record<string, unknown>> = bundledByFile;

export function loadOpening(id: string): Opening | null {
  const entry = contentIndex.openings.find((o) => o.id === id);
  return entry ? ((bundledByFile[entry.file] as Opening | undefined) ?? null) : null;
}

export function loadLine(openingId: string, lineId: string): { opening: Opening; line: OpeningLine } | null {
  const opening = loadOpening(openingId);
  const line = opening?.lines.find((l) => l.id === lineId);
  return opening && line ? { opening, line } : null;
}
