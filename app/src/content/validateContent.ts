// Relative imports only: this file also runs outside the app, via content/validate.ts.
import { ChessGame } from '../chess/game';
import { OPENING_TAGS } from './types';

const SIDES = ['white', 'black'];
const TIERS = ['main', 'side'];

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';
const isPositiveInt = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 1;

/**
 * Checks the whole content set: the index plus every opening file it lists (keyed by the index
 * entry's `file`). Returns human-readable errors; an empty list means the content is valid.
 */
export function validateContent(index: unknown, openingsByFile: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!isObject(index)) return ['index.json: must be an object'];

  if (!isPositiveInt(index.contentVersion)) errors.push('index.json: contentVersion must be a positive integer');
  if (!Array.isArray(index.openings) || index.openings.length === 0) {
    errors.push('index.json: openings must be a non-empty array');
    return errors;
  }

  const openingIds = new Set<string>();
  const lineIds = new Set<string>();

  index.openings.forEach((entry: unknown, i) => {
    const where = `index.json openings[${i}]`;
    if (!isObject(entry)) {
      errors.push(`${where}: must be an object`);
      return;
    }
    if (!isNonEmptyString(entry.id)) errors.push(`${where}: id is missing`);
    else if (openingIds.has(entry.id)) errors.push(`${where}: duplicate opening id "${entry.id}"`);
    else openingIds.add(entry.id);
    if (!isNonEmptyString(entry.name)) errors.push(`${where}: name is missing`);
    if (!SIDES.includes(entry.side as string)) errors.push(`${where}: side must be "white" or "black"`);
    if (!isNonEmptyString(entry.file)) {
      errors.push(`${where}: file is missing`);
      return;
    }

    const opening = openingsByFile[entry.file];
    if (opening === undefined) {
      errors.push(`${where}: file "${entry.file}" not found`);
      return;
    }
    errors.push(...validateOpening(opening, entry.file, lineIds));
    if (isObject(opening)) {
      if (opening.id !== entry.id) errors.push(`${entry.file}: id "${opening.id}" doesn't match index id "${entry.id}"`);
      if (opening.side !== entry.side) errors.push(`${entry.file}: side doesn't match index.json`);
    }
  });

  return errors;
}

/** Checks one opening file. `lineIds` collects line ids across files so duplicates are caught. */
export function validateOpening(opening: unknown, file: string, lineIds = new Set<string>()): string[] {
  const errors: string[] = [];
  if (!isObject(opening)) return [`${file}: must be an object`];

  for (const field of ['id', 'name', 'eco', 'description']) {
    if (!isNonEmptyString(opening[field])) errors.push(`${file}: ${field} is missing`);
  }
  if (!SIDES.includes(opening.side as string)) {
    errors.push(`${file}: side must be "white" or "black"`);
    return errors;
  }
  if (opening.tags !== undefined) {
    if (!Array.isArray(opening.tags)) errors.push(`${file}: tags must be an array`);
    else {
      for (const tag of opening.tags) {
        if (!(OPENING_TAGS as readonly unknown[]).includes(tag)) {
          errors.push(`${file}: unknown tag "${String(tag)}" (allowed: ${OPENING_TAGS.join(', ')})`);
        }
      }
      if (new Set(opening.tags).size !== opening.tags.length) errors.push(`${file}: duplicate tags`);
    }
  }
  if (!Array.isArray(opening.lines) || opening.lines.length === 0) {
    errors.push(`${file}: lines must be a non-empty array`);
    return errors;
  }

  // Ply parity of the user's moves: White moves on even plies, Black on odd ones.
  const userParity = opening.side === 'white' ? 0 : 1;
  const levels = new Set<number>();
  const levelsWithMainLine = new Set<number>();

  opening.lines.forEach((line: unknown, i) => {
    let where = `${file} lines[${i}]`;
    if (!isObject(line)) {
      errors.push(`${where}: must be an object`);
      return;
    }
    if (!isNonEmptyString(line.id)) errors.push(`${where}: id is missing`);
    else {
      where = `${file} "${line.id}"`;
      if (lineIds.has(line.id)) errors.push(`${where}: duplicate line id`);
      lineIds.add(line.id);
    }
    if (!isNonEmptyString(line.name)) errors.push(`${where}: name is missing`);
    if (!isPositiveInt(line.level)) errors.push(`${where}: level must be a positive integer`);
    else levels.add(line.level);
    if (!TIERS.includes(line.tier as string)) errors.push(`${where}: tier must be "main" or "side"`);
    if (line.tier === 'main' && isPositiveInt(line.level)) levelsWithMainLine.add(line.level);
    if (line.summary !== undefined && !isNonEmptyString(line.summary)) {
      errors.push(`${where}: summary must be a non-empty string`);
    }

    if (!Array.isArray(line.moves) || line.moves.length === 0) {
      errors.push(`${where}: moves must be a non-empty array`);
      return;
    }
    if (!line.moves.some((_, ply) => ply % 2 === userParity)) {
      errors.push(`${where}: has no moves for ${opening.side}`);
    }

    const game = new ChessGame();
    for (const [ply, san] of line.moves.entries()) {
      if (typeof san !== 'string' || game.playSan(san) === null) {
        errors.push(`${where}: move ${ply + 1} (ply ${ply}) "${String(san)}" is illegal or not valid SAN`);
        break;
      }
    }

    if (line.notes !== undefined) {
      if (!isObject(line.notes)) errors.push(`${where}: notes must be an object`);
      else {
        for (const [key, note] of Object.entries(line.notes)) {
          const ply = Number(key);
          if (!Number.isInteger(ply) || ply < 0 || ply >= line.moves.length) {
            errors.push(`${where}: note key "${key}" is not a ply index of this line`);
          }
          if (!isNonEmptyString(note)) errors.push(`${where}: note "${key}" must be a non-empty string`);
        }
      }
    }
  });

  const maxLevel = Math.max(0, ...levels);
  for (let level = 1; level <= maxLevel; level++) {
    if (!levels.has(level)) errors.push(`${file}: levels must be contiguous, level ${level} is missing`);
    else if (!levelsWithMainLine.has(level)) {
      errors.push(`${file}: level ${level} needs at least one main line (main lines unlock the next level)`);
    }
  }

  return errors;
}
