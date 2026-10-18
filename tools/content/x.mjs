import { fileURLToPath } from 'node:url';
// Position lookup: club move shares (Lichess 1600-2000) and the cloud engine's top moves.
// Usage: node x.mjs "e4 c6 d4 d5" "d4 d5 c4 c6 Nc3"   (one position per argument)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const repo = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const require = createRequire(repo + '/app/package.json');
const { Chess } = require('chess.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const token = fs.readFileSync('C:/Users/lmyhr/.lichess_token', 'utf8').trim();
const cacheFile = path.join(here, 'cache', 'lichess-cache.json');
const evalFile = path.join(here, 'cache', 'eval-cache.json');
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
const evals = fs.existsSync(evalFile) ? JSON.parse(fs.readFileSync(evalFile, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = { Authorization: `Bearer ${token}` };

async function get(url) {
  for (;;) {
    const res = await fetch(url, { headers });
    if (res.status === 429) { console.error('  (rate limited, waiting 60s)'); await sleep(60000); continue; }
    return res;
  }
}

async function club(ucis) {
  const key = ucis.join(',');
  if (cache[key]) return cache[key];
  await sleep(1200);
  const res = await get(`https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=1600,1800,2000&moves=15&play=${key}`);
  const data = await res.json();
  const moves = data.moves.map((m) => ({ san: m.san, n: m.white + m.draws + m.black }));
  cache[key] = { total: moves.reduce((a, m) => a + m.n, 0), moves };
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
  return cache[key];
}

async function engine(fen) {
  if (evals[fen] !== undefined) return evals[fen];
  await sleep(600);
  const res = await get(`https://lichess.org/api/cloud-eval?multiPv=5&fen=${encodeURIComponent(fen)}`);
  evals[fen] = res.ok ? (await res.json()).pvs : null;
  fs.writeFileSync(evalFile, JSON.stringify(evals));
  return evals[fen];
}

for (const arg of process.argv.slice(2)) {
  const g = new Chess();
  const ucis = [];
  for (const san of arg.trim().split(/\s+/).filter(Boolean)) {
    const m = g.move(san);
    ucis.push(m.from + m.to + (m.promotion ?? ''));
  }
  const data = await club(ucis);
  const pvs = await engine(g.fen());
  const sanOf = (uci) => { try { return new Chess(g.fen()).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san; } catch { return uci; } };
  const side = g.turn() === 'w' ? 1 : -1;
  const pct = (n) => Math.round((100 * n) / (data.total || 1));
  const top = data.moves.filter((m) => pct(m.n) >= 3).slice(0, 7).map((m) => `${m.san} ${pct(m.n)}%`).join(', ');
  const eng = pvs
    ? pvs.map((p) => `${sanOf(p.moves.split(' ')[0])} ${p.mate ? `#${p.mate}` : ((side * p.cp) / 100).toFixed(2)}`).join(', ')
    : 'no cloud eval';
  console.log(`[${arg.trim() || 'start'}] (${g.turn() === 'w' ? 'White' : 'Black'} to move, ${data.total} games)\n  club: ${top}\n  engine (for side to move): ${eng}`);
}
