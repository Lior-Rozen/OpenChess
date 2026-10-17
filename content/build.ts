/// <reference types="node" />
// Compiles every content/pgn/<id>.pgn into content/openings/<id>.json.
// Run from app/: npm run build-content (validate-content fails if the JSON is out of date).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { compilePgn, openingToJson } from '../app/src/content/pgn';

const contentDir = __dirname;

/** Compiles the PGN sources; returns errors, and the JSON text per output file. */
export function compileAll(): { errors: string[]; outputs: { file: string; json: string }[] } {
  const errors: string[] = [];
  const outputs: { file: string; json: string }[] = [];
  for (const name of readdirSync(join(contentDir, 'pgn')).filter((f) => f.endsWith('.pgn')).sort()) {
    const result = compilePgn(readFileSync(join(contentDir, 'pgn', name), 'utf8'), `pgn/${name}`);
    errors.push(...result.errors);
    const id = name.replace(/\.pgn$/, '');
    if (result.opening && result.opening.id !== id) errors.push(`pgn/${name}: [Id "${result.opening.id}"] must be "${id}"`);
    if (result.opening && result.errors.length === 0) {
      outputs.push({ file: `openings/${id}.json`, json: openingToJson(result.opening) });
    }
  }
  return { errors, outputs };
}

if (require.main === module) {
  const { errors, outputs } = compileAll();
  if (errors.length > 0) {
    console.error(`PGN build failed (${errors.length} error${errors.length === 1 ? '' : 's'}):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  for (const { file, json } of outputs) writeFileSync(join(contentDir, file), json);
  console.log(`Built ${outputs.length} opening(s) from PGN.`);
}
