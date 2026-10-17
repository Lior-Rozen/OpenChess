/// <reference types="node" />
// Validates content/index.json and every opening file it lists, and checks that the JSON is
// up to date with its PGN source. Run from app/: npm run validate-content
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { validateContent } from '../app/src/content/validateContent';
import { compileAll } from './build';

const contentDir = __dirname;

function readJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(join(contentDir, file), 'utf8'));
  } catch (error) {
    return error instanceof SyntaxError ? `invalid JSON: ${error.message}` : undefined;
  }
}

const index = readJson('index.json');
const openingsByFile: Record<string, unknown> = {};
const errors: string[] = [];

if (typeof index === 'string' || index === undefined) {
  errors.push(`index.json: ${index ?? 'not found'}`);
} else {
  const entries = (index as { openings?: { file?: unknown }[] }).openings ?? [];
  for (const { file } of Array.isArray(entries) ? entries : []) {
    if (typeof file !== 'string') continue;
    const opening = readJson(file);
    if (typeof opening === 'string') errors.push(`${file}: ${opening}`);
    else if (opening !== undefined) openingsByFile[file] = opening;
  }
  errors.push(...validateContent(index, openingsByFile));
}

const built = compileAll();
errors.push(...built.errors);
for (const { file, json } of built.outputs) {
  const current = existsSync(join(contentDir, file)) ? readFileSync(join(contentDir, file), 'utf8') : null;
  if (current?.replace(/\r\n/g, '\n') !== json) errors.push(`${file}: out of date with its PGN, run npm run build-content`);
}

if (errors.length > 0) {
  console.error(`Content validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

const lineCount = Object.values(openingsByFile).reduce<number>(
  (sum, opening) => sum + ((opening as { lines: unknown[] }).lines.length ?? 0),
  0,
);
console.log(`Content OK: ${Object.keys(openingsByFile).length} opening(s), ${lineCount} line(s).`);
