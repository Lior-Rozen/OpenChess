import { fileURLToPath } from 'node:url';
// Renders pixel-icon candidates (edit the `candidates` object; the current ones are the
// candidates once shown for the 5 newest openings) plus the existing icons to
// cache/icon-candidates.html, so the user can pick. Run: node tools/content/icons-gen.mjs
import fs from 'node:fs';

const repo = fileURLToPath(new URL('../..', import.meta.url)).replace(/[\\/]$/, '');
const src = fs.readFileSync(`${repo}/app/src/openings/icons.ts`, 'utf8');
const existing = eval('(' + src.slice(src.indexOf('const ART = {') + 'const ART = '.length, src.indexOf('\n};', src.indexOf('const ART = {')) + 2) + ')');
const themeSrc = fs.readFileSync(`${repo}/app/src/theme.ts`, 'utf8');
const palette = Object.fromEntries([...themeSrc.matchAll(/^\s+([A-Za-z]): '(#[0-9a-f]{6})'/gm)].map((m) => [m[1], m[2]]));

const candidates = {
  'Sicilian: Alapin': {
    'lemon slice': [
      'yyyyyyyyyyyyyyyy',
      'yWWWWWWWWWWWWWWy',
      '.yWYYYWYYWYYYWy.',
      '.yWYYYWYYWYYYWy.',
      '..yWYYWYYWYYWy..',
      '..yWYYYWWYYYWy..',
      '...yWYYWWYYWy...',
      '....yWYWWYWy....',
      '.....yWWWWy.....',
      '......yyyy......',
    ],
    lemonade: [
      '..........R.....',
      '.........R......',
      '..YY....R.......',
      '.YYYY..R........',
      '.CCCCCCCCCCC....',
      '.C.WW..R...C....',
      '.CYYYYYYYYYC....',
      '.CYYYYYYYYYC....',
      '.CYYWYYYYYYC....',
      '..CYYYYYWYC.....',
      '..CYYYYYYYC.....',
      '..CYYYYYYYC.....',
      '...CYYYYYC......',
      '...CCCCCCC......',
    ],
    'lemon on a branch': [
      '......nn........',
      '.....nNNn.......',
      '....nNNNn.nn....',
      '.....nNnnNNn....',
      '.......nNNn.....',
      '......yy........',
      '....yYYYYy......',
      '...yYYYWYYy.....',
      '..yYYYYYWYYy....',
      '..yYYYYYYYYy....',
      '..yYYYYYYYYy....',
      '...yYYYYYYy.....',
      '....yYYYYy......',
      '......yy........',
    ],
  },
  'Scotch Game': {
    thistle: [
      '....P..P..P.....',
      '.....PPPPPP.....',
      '....PVPVPVPP....',
      '....PPVPVPVP....',
      '.....VPVPVP.....',
      '....nNnNnNnN....',
      '.....NnNnNn.....',
      '....n.NNNN.n....',
      '.......NN.......',
      '.......Nn.......',
      '.....n.Nn.n.....',
      '.....nNNnNn.....',
      '.......Nn.......',
      '.......Nn.......',
    ],
    'whisky glass': [
      '..CCCCCCCCCCCC..',
      '..C..........C..',
      '..C..........C..',
      '..CWW....WW..C..',
      '..COOWOOOOWOOC..',
      '..COWWOOOOOOOC..',
      '..COOOOOWWOOOC..',
      '..COOOOOOOOOOC..',
      '..COOOOOOOOOOC..',
      '..CCCCCCCCCCCC..',
      '..cccccccccccc..',
    ],
    'Loch Ness monster': [
      '.....NNN........',
      '....NNKNN.......',
      '....NNNNN.......',
      '.....NNN........',
      '.....NN.........',
      '.....NN.........',
      '.....NN....NN...',
      '.....NNN..NNNN..',
      '....NNNNNNNNNNN.',
      'CCCCCCCCCCCCCCCC',
      'cCCcCCcCCcCCcCCc',
      'cccccccccccccccc',
    ],
  },
  'English Opening': {
    teacup: [
      '....W..W..W.....',
      '...W..W..W......',
      '....W..W..W.....',
      '................',
      '.RRRRRRRRRRR....',
      '.RWWWWWWWWWRRR..',
      '.RWWRWWRWWWR..R.',
      '.RWWWWWWWWWR..R.',
      '.RWWWWWWWWWRRR..',
      '..RWWWWWWWR.....',
      '...RRRRRRR......',
      'GGGGGGGGGGGGGG..',
      '.gggggggggggg...',
    ],
    'bowler hat': [
      '.....gggggg.....',
      '....gGgggggg....',
      '...gGggggggg....',
      '...gGggggggg....',
      '...gggggggggg...',
      '...RRRRRRRRRR...',
      '...gggggggggg...',
      'gggggggggggggggg',
      '.gggggggggggggg.',
    ],
    umbrella: [
      '.......G.......',
      '.....PPPPP.....',
      '...PPPPPPPPP...',
      '..PPPPPPPPPPP..',
      '.PPPPPPPPPPPPP.',
      'PPpPPPpPPPpPPPp',
      '.......G.......',
      '.......G.......',
      '.......G.......',
      '.......G.......',
      '.......G.......',
      '...G...G.......',
      '...G..G........',
      '....GG.........',
    ],
  },
  'Nimzo-Indian Defense': {
    'push pin (the …Bb4 pin)': [
      '......RRRR......',
      '.....RRRRRR.....',
      '.....RWRRRR.....',
      '.....RRRRRR.....',
      '......RRRR......',
      '.....rrrrrr.....',
      '....rRRRRRRr....',
      '.......GG.......',
      '.......GG.......',
      '.......G........',
      '.......G........',
      '.......G........',
    ],
    lotus: [
      '.......P.......',
      '......PPP......',
      '...P..PWP..P...',
      '...PP.PWP.PP...',
      '....PPPWPPP....',
      '.P..PPPWPPP..P.',
      '.PPPPPPWPPPPPP.',
      '..PPPPPWPPPPP..',
      '...PPPPPPPPP...',
      'nNNNNNNNNNNNNNn',
      '.nnnnnnnnnnnnn.',
    ],
    tiger: [
      '.OO........OO.',
      'OOOO......OOOO',
      'OOOOOOOOOOOOOO',
      'OKOOOKOOKOOOKO',
      'OOOOOOOOOOOOOO',
      'OOWKWOOOOWKWOO',
      'OOWWWOOOOWWWOO',
      'OKOOOOKKOOOOKO',
      '.OOOOWKKWOOOO.',
      '.OOOWWWWWWOOO.',
      '..OOWWRRWWOO..',
      '...OOWWWWOO...',
      '....OOOOOO....',
    ],
  },
  "Queen's Gambit Declined": {
    'castle tower': [
      '.GG..GG..GG..GG.',
      '.GG..GG..GG..GG.',
      '.GGGGGGGGGGGGGG.',
      '..GGGGGGGGGGGG..',
      '..GgGGGGGGGGgG..',
      '..GGGGGgGGGGGG..',
      '..GGGGGGGGGGGG..',
      '..GGgGGGGGgGGG..',
      '..GGGGGooGGGGG..',
      '..GGGGooooGGGG..',
      '..GGGGooooGGGG..',
      '..GGGGooooGGGG..',
      '.GGGGGooooGGGGG.',
    ],
    'brick wall': [
      'rrrrrrrrrrrrrrrr',
      'RRRRRRRrRRRRRRRr',
      'RRRRRRRrRRRRRRRr',
      'rrrrrrrrrrrrrrrr',
      'RRRrRRRRRRRrRRRR',
      'RRRrRRRRRRRrRRRR',
      'rrrrrrrrrrrrrrrr',
      'RRRRRRRrRRRRRRRr',
      'RRRRRRRrRRRRRRRr',
      'rrrrrrrrrrrrrrrr',
    ],
    'sealed letter ("no, thank you")': [
      'WWWWWWWWWWWWWWWW',
      'WGWWWWWWWWWWWWGW',
      'WWGWWWWWWWWWWGWW',
      'WWWGWWWWWWWWGWWW',
      'WWWWGWWWWWWGWWWW',
      'WWWWWGWRRWGWWWWW',
      'WWWWWWRRRRWWWWWW',
      'WWWWWWRRRRWWWWWW',
      'WWWWWWWRRWWWWWWW',
      'WWWWWWWWWWWWWWWW',
    ],
  },
};

function svg(rows, px) {
  const width = Math.max(...rows.map((r) => r.length));
  const size = Math.max(16, width, rows.length);
  const ox = Math.floor((size - width) / 2);
  const oy = Math.floor((size - rows.length) / 2);
  let rects = '';
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (palette[ch]) rects += `<rect x="${x + ox}" y="${y + oy}" width="1" height="1" fill="${palette[ch]}"/>`;
  }));
  return `<svg width="${px}" height="${px}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${rects}</svg>`;
}

let html = `<!doctype html><html><head><meta charset="utf-8"><title>Opening icon candidates</title><style>
body{background:#130c20;color:#efe8ff;font-family:system-ui,sans-serif;margin:24px}
h2{margin:28px 0 10px;font-weight:600} .row{display:flex;gap:16px;flex-wrap:wrap}
.card{background:#1f1533;border:1px solid #4a3670;border-radius:10px;padding:14px;text-align:center;width:150px}
.card .small{margin-top:8px} .label{margin-top:8px;font-size:14px} .num{color:#00e5ff;font-weight:700}
.existing .card{width:110px}</style></head><body>
<h1>Icon candidates for the 5 new openings</h1><p>Pick one per opening (e.g. "Alapin 2, Scotch 1, …"). Each is shown large and at app size.</p>`;
for (const [opening, opts] of Object.entries(candidates)) {
  html += `<h2>${opening}</h2><div class="row">`;
  Object.entries(opts).forEach(([name, rows], i) => {
    html += `<div class="card">${svg(rows, 112)}<div class="small">${svg(rows, 32)}</div><div class="label"><span class="num">${i + 1}.</span> ${name}</div></div>`;
  });
  html += '</div>';
}
html += `<h2>Existing icons, for comparison</h2><div class="row existing">`;
for (const [name, rows] of Object.entries(existing)) html += `<div class="card">${svg(rows, 64)}<div class="label">${name}</div></div>`;
html += '</div></body></html>';

const out = fileURLToPath(new URL('./cache/icon-candidates.html', import.meta.url));
fs.writeFileSync(out, html);
console.log(out);
