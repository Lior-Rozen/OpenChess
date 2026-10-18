import { fileURLToPath } from 'node:url';
// Checks every line against the Lichess explorer (club games, 1600-2000) and reports
// rare opponent moves, unusual user moves, and popular opponent replies with no branch.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const repo = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const require = createRequire(repo + '/app/package.json');
const { Chess } = require('chess.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const token = fs.readFileSync('C:/Users/lmyhr/.lichess_token', 'utf8').trim();
const cacheFile = path.join(here, 'cache', 'lichess-cache.json');
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DB = 'https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=1600,1800,2000';

async function explore(ucis) {
  const key = ucis.join(',');
  if (cache[key]) return cache[key];
  for (;;) {
    await sleep(1500);
    const res = await fetch(`${DB}&moves=15&play=${key}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) { console.error('429, waiting 60s'); await sleep(60000); continue; }
    if (!res.ok) throw new Error(`${res.status} for ${key}`);
    const data = await res.json();
    const moves = data.moves.map((m) => ({ san: m.san, n: m.white + m.draws + m.black }));
    cache[key] = { total: moves.reduce((a, m) => a + m.n, 0), moves };
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
    return cache[key];
  }
}

const index = JSON.parse(fs.readFileSync(`${repo}/content/index.json`, 'utf8'));
const only = process.argv[2];
const pct = (n, t) => (t ? Math.round((100 * n) / t) : 0);
const label = (ply, san) => `${Math.floor(ply / 2) + 1}${ply % 2 ? '…' : '.'}${san}`;

for (const entry of index.openings) {
  if (only && entry.id !== only) continue;
  const op = JSON.parse(fs.readFileSync(`${repo}/content/${entry.file}`, 'utf8'));
  const userParity = op.side === 'white' ? 0 : 1;
  const out = [];
  // Opponent replies covered by any line, per position (move prefix).
  const covered = new Map();
  for (const line of op.lines) {
    line.moves.forEach((san, ply) => {
      if (ply % 2 === userParity) return;
      const key = line.moves.slice(0, ply).join(' ');
      if (!covered.has(key)) covered.set(key, new Set());
      covered.get(key).add(san);
    });
  }
  const seenGap = new Set();
  const gaps = [];

  for (const line of op.lines) {
    const g = new Chess();
    const ucis = [];
    const issues = [];
    for (const [ply, san] of line.moves.entries()) {
      const data = await explore(ucis);
      const idx = data.moves.findIndex((m) => m.san === san);
      const mine = data.moves[idx];
      const top = data.moves[0];
      const who = ply % 2 === userParity ? 'you' : 'opp';
      const share = mine ? pct(mine.n, data.total) : 0;
      const topText = data.moves.slice(0, 3).map((m) => `${m.san} ${pct(m.n, data.total)}%`).join(', ');
      if (data.total < 30) { issues.push(`  ${label(ply, san)}: only ${data.total} games from here, stopping`); break; }
      if (who === 'opp' && idx !== 0) {
        issues.push(`  ${label(ply, san)} (opp) ${share}%, rank ${idx < 0 ? '-' : idx + 1}; top: ${topText}`);
      }
      if (who === 'you') { if (ply > 1) {
        const accepted = line.accept?.[ply] ?? [];
        if (idx !== 0) issues.push(`  ${label(ply, san)} (you) ${share}%, rank ${idx < 0 ? '-' : idx + 1}; top: ${topText}${accepted.length ? `; accepted: ${accepted.join(',')}` : ''}`); }
      } else {
        // Popular opponent replies that no line covers.
        const key = line.moves.slice(0, ply).join(' ');
        if (!seenGap.has(key)) {
          seenGap.add(key);
          const missing = data.moves.filter((m) => !covered.get(key)?.has(m.san) && pct(m.n, data.total) >= 15);
          if (missing.length) gaps.push(`  GAP after ${line.moves.slice(0, ply).join(' ') || 'start'}: ${missing.map((m) => `${m.san} ${pct(m.n, data.total)}%`).join(', ')} (covered: ${[...covered.get(key)].join(',')})`);
        }
      }
      const m = g.move(san);
      ucis.push(m.from + m.to + (m.promotion ?? ''));
    }
    if (issues.length) out.push(`${line.id} [L${line.level} ${line.tier}]\n${issues.join('\n')}`);
  }
  console.log(`\n## ${entry.id}\n${out.join('\n')}\n${gaps.join('\n')}`);
}
