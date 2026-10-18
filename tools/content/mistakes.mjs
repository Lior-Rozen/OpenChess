import { fileURLToPath } from 'node:url';
// Finds common club inaccuracies at the user's moves: popular (>= 10%) moves that the engine
// rates clearly worse (>= 0.6 pawns) than the book move, with the refutation line.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const repo = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const require = createRequire(repo + '/app/package.json');
const { Chess } = require('chess.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const token = fs.readFileSync('C:/Users/lmyhr/.lichess_token', 'utf8').trim();
const cache = JSON.parse(fs.readFileSync(path.join(here, 'cache', 'lichess-cache.json'), 'utf8'));
const evalFile = path.join(here, 'cache', 'eval-cache.json');
const evals = fs.existsSync(evalFile) ? JSON.parse(fs.readFileSync(evalFile, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const headers = { Authorization: `Bearer ${token}` };

async function club(ucis) {
  const key = ucis.join(',');
  if (cache[key]) return cache[key];
  for (;;) {
    await sleep(1500);
    const res = await fetch(`https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=1600,1800,2000&moves=15&play=${key}`, { headers });
    if (res.status === 429) { await sleep(60000); continue; }
    const data = await res.json();
    const moves = data.moves.map((m) => ({ san: m.san, n: m.white + m.draws + m.black }));
    cache[key] = { total: moves.reduce((a, m) => a + m.n, 0), moves };
    fs.writeFileSync(path.join(here, 'cache', 'lichess-cache.json'), JSON.stringify(cache));
    return cache[key];
  }
}
async function engine(fen) {
  if (evals[fen] !== undefined) return evals[fen];
  for (;;) {
    await sleep(700);
    const res = await fetch(`https://lichess.org/api/cloud-eval?multiPv=3&fen=${encodeURIComponent(fen)}`, { headers });
    if (res.status === 429) { await sleep(60000); continue; }
    evals[fen] = res.ok ? (await res.json()).pvs : null;
    fs.writeFileSync(evalFile, JSON.stringify(evals));
    return evals[fen];
  }
}
// Eval in pawns from the point of view of the side to move in `fen`.
const score = (pv, turn) => (pv.mate ? (pv.mate > 0 ? 10 : -10) : pv.cp / 100) * (turn === 'w' ? 1 : -1);
const sanLine = (fen, uciLine, n) => {
  const g = new Chess(fen);
  const out = [];
  for (const u of uciLine.split(' ').slice(0, n)) {
    try { out.push(g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }).san); } catch { break; }
  }
  return out.join(' ');
};

const index = JSON.parse(fs.readFileSync(`${repo}/content/index.json`, 'utf8'));
for (const entry of index.openings.filter((e) => !process.env.ONLY || process.env.ONLY.split(",").includes(e.id))) {
  const op = JSON.parse(fs.readFileSync(`${repo}/content/${entry.file}`, 'utf8'));
  const userParity = op.side === 'white' ? 0 : 1;
  const seen = new Set();
  const found = [];
  for (const line of op.lines) {
    const g = new Chess();
    const ucis = [];
    for (const [ply, san] of line.moves.entries()) {
      if (ply % 2 === userParity && !seen.has(ucis.join(','))) {
        seen.add(ucis.join(','));
        const data = await club(ucis);
        const fen = g.fen();
        const accepted = line.accept?.[ply] ?? [];
        for (const m of data.moves) {
          const share = Math.round((100 * m.n) / (data.total || 1));
          if (share < Number(process.env.MIN_SHARE ?? 10) || m.san === san || accepted.includes(m.san)) continue;
          const pvsHere = await engine(fen);
          if (!pvsHere) continue;
          const best = score(pvsHere[0], g.turn());
          const after = new Chess(fen);
          after.move(m.san);
          const pvsAfter = await engine(after.fen());
          if (!pvsAfter) continue;
          const mine = -score(pvsAfter[0], after.turn());
          const loss = best - mine;
          if (loss >= Number(process.env.MIN_LOSS ?? 0.6)) {
            found.push(`  ${Math.floor(ply / 2) + 1}${ply % 2 ? '…' : '.'}${m.san} (${share}%, loses ${loss.toFixed(1)}; book ${san}) after: ${line.moves.slice(0, ply).join(' ')}\n      refutation: ${sanLine(after.fen(), pvsAfter[0].moves, 6)}`);
          }
        }
      }
      const mv = g.move(san);
      ucis.push(mv.from + mv.to + (mv.promotion ?? ''));
    }
  }
  console.log(`## ${entry.id}\n${found.join('\n')}`);
}
