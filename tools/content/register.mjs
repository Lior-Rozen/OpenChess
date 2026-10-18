import { fileURLToPath } from 'node:url';
// Registers content/openings/<id>.json in content/index.json and app/src/content/loader.ts.
import fs from 'node:fs';

const repo = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const id = process.argv[2];
const opening = JSON.parse(fs.readFileSync(`${repo}/content/openings/${id}.json`, 'utf8'));
const file = `openings/${id}.json`;

const indexPath = `${repo}/content/index.json`;
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
if (!index.openings.some((o) => o.id === id)) {
  index.openings.push({ id, name: opening.name, side: opening.side, file });
  const body = index.openings.map((o) => '    ' + JSON.stringify(o).replace(/":/g, '": ').replace(/,"/g, ', "').replace(/^\{/, '{ ').replace(/\}$/, ' }'));
  fs.writeFileSync(indexPath, `{\n  "contentVersion": ${index.contentVersion},\n  "openings": [\n${body.join(',\n')}\n  ]\n}\n`);
}

const loaderPath = `${repo}/app/src/content/loader.ts`;
let loader = fs.readFileSync(loaderPath, 'utf8');
const varName = id.replace(/-(\w)/g, (_, c) => c.toUpperCase());
if (!loader.includes(`'${file}'`)) {
  const imports = [...loader.matchAll(/^import \w+ from '\.\.\/\.\.\/\.\.\/content\/openings\/[^']+';$/gm)];
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length;
  loader = loader.slice(0, at) + `\nimport ${varName} from '../../../content/openings/${id}.json';` + loader.slice(at);
  const start = loader.indexOf('const bundledByFile');
  const end = loader.indexOf('\n};', start);
  loader = loader.slice(0, end) + `\n  '${file}': ${varName},` + loader.slice(end);
  fs.writeFileSync(loaderPath, loader);
}
console.log(`registered ${id} as ${varName}`);
