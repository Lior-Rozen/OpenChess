/**
 * Original 8-bit icons, one per opening, so each one is easy to tell apart at a glance. Each
 * string is a row of pixels and each character a colour from `theme.pixel` ('.' is see-through).
 * Rows may be narrower than the grid; the icon is centred in a square of at least 16 × 16.
 * Openings without an icon here get the pawn.
 */
const ART = {
  baguette: [
    '.............bb.',
    '............bBBb',
    '...........bBYBb',
    '..........bBBBb.',
    '.........bBYBb..',
    '........bBBBb...',
    '.......bBYBb....',
    '......bBBBb.....',
    '.....bBYBb......',
    '....bBBBb.......',
    '...bBYBb........',
    '..bBBBb.........',
    '.bBBBb..........',
    '.bBBb...........',
    '..bb............',
  ],
  shield: [
    'CCCCCCCCCCCC',
    'CVVVVVVVVVVC',
    'CVVVVWWVVVVC',
    'CVVVWWWWVVVC',
    'CVVVVWWVVVVC',
    'CVVVVWWVVVVC',
    'CVVVWWWWVVVC',
    'CVVWWWWWWVVC',
    '.CVVVVVVVVC.',
    '.CVVVVVVVVC.',
    '..CVVVVVVC..',
    '...CVVVVC...',
    '....CVVC....',
    '.....CC.....',
  ],
  lemon: [
    '.........nn....',
    '.......nNNn....',
    '......nNnn.....',
    '....yyYYyy.....',
    '..yYYYYYYYYy...',
    '.yYYWWYYYYYYy..',
    'yYYWYYYYYYYYYy.',
    'yYYYYYYYYYYYYYy',
    'yYYYYYYYYYYYYy.',
    '.yYYYYYYYYYYy..',
    '..yYYYYYYYYy...',
    '....yyyyyy.....',
  ],
  longship: [
    '.......o........',
    '......RWRWRW....',
    '......RWRWRW....',
    '......RWRWRW....',
    '......RWRWRW....',
    '.......o........',
    'o......o.......o',
    'oo.....o......oo',
    '.oooooooooooooo.',
    '..oPoCoPoCoPoC..',
    '...oooooooooo...',
    'CcCcCcCcCcCcCcCc',
    'cCcCcCcCcCcCcCcC',
  ],
  elephant: [
    '.....gGGGGGGg....',
    '...gGGPPPPPGGg...',
    '..gGGPPYPYPPGGg..',
    '.gGKGGgPPPPPGGGGg',
    '.gGGGGgGGGGGGGGGg',
    'gGGGGgGGGGGGGGGGg',
    'gGGgGgGGGGGGGGGGg',
    'gGg.gGGGGGGGGGGGg',
    'gGg.gGGGGGGGGGGg.',
    'gGg..gGGgggGGGg..',
    '.Wg..gGg...gGg...',
    '.....gGg...gGg...',
    '.....ggg...ggg...',
  ],
  matryoshka: [
    '.....rrrr.....',
    '....rRRRRr....',
    '...rRLLLLRr...',
    '...rRLKLKRr...',
    '...rRPLLPRr...',
    '...rRLLRLRr...',
    '....rRLLRr....',
    '...rRRRRRRr...',
    '..rRRYYYYRRr..',
    '..rRYYPPYYRr..',
    '..rRYPYYPYRr..',
    '..rRYYPPYYRr..',
    '..rRRYYYYRRr..',
    '..rRRRRRRRRr..',
    '...rRRRRRRr...',
    '....rrrrrr....',
  ],
  pizza: [
    'oooooooooooooo',
    'oOOOOOOOOOOOOo',
    '.YYRYYYYYRYYY.',
    '.YRRRYYYRRRYY.',
    '..YRYYYYYRYY..',
    '..YYYYRYYYYY..',
    '...YYRRRYYY...',
    '...YYYRYYYY...',
    '....YYYYYY....',
    '....YRYYYY....',
    '.....RRRY.....',
    '.....YRYY.....',
    '......YY......',
    '......YY......',
  ],
  guitar: [
    '......ooo.....',
    '......oyo.....',
    '......ooo.....',
    '.......o......',
    '.......o......',
    '.......o......',
    '.....OOoOO....',
    '....OOOoOOO...',
    '....OOOoOOO...',
    '.....OKoKO....',
    '....OOKKKOO...',
    '...OOOOoOOOO..',
    '...OOOOoOOOO..',
    '...OOOyyyOOO..',
    '....OOOOOOO...',
    '.....OOOOO....',
  ],
  coffee: [
    '....G..G......',
    '.....G..G.....',
    '....G..G......',
    '.....G..G.....',
    '..............',
    '.oooooooooo...',
    '.oOOOOOOOOooo.',
    '.WWWWWWWWWW..W',
    '.WWWWWWWWWW..W',
    '.WWWWWWWWWWWW.',
    '..WWWWWWWW....',
    '...WWWWWW.....',
    'GGGGGGGGGGGGG.',
    '.GGGGGGGGGGG..',
  ],
  bus: [
    '.rRRRRRRRRRRRRr.',
    '.RCCRCCRCCRCCCR.',
    '.RCCRCCRCCRCCCR.',
    '.RRRRRRRRRRRRRR.',
    '.RYYYYYYYYYYYYR.',
    '.RCCRCCRCCRKRCR.',
    '.RCCRCCRCCRKRCR.',
    '.RRRRRRRRRRKRRR.',
    '.rRRRRRRRRRRRRr.',
    '.rrGGrrrrrrGGrr.',
    '..GKKG....GKKG..',
    '...GG......GG...',
  ],
  crown: [
    'Y.....Y.....Y',
    'PY...YPY...YP',
    'Y.....Y.....Y',
    'YY...YYY...YY',
    'YYY.YYYYY.YYY',
    'YYYYYYYYYYYYY',
    'YYYYYYYYYYYYY',
    'YPYYYYCYYYYPY',
    'YYYYYYYYYYYYY',
    'yyyyyyyyyyyyy',
  ],
  pawn: [
    '....PPP....',
    '...PPPPP...',
    '...PPPPP...',
    '....PPP....',
    '...PPPPP...',
    '....PPP....',
    '....PPP....',
    '...PPPPP...',
    '..PPPPPPP..',
    '.PPPPPPPPP.',
    '.ppppppppp.',
  ],
};

export type IconName = keyof typeof ART;

/** Which icon each opening uses. */
const OPENING_ICONS: Record<string, IconName> = {
  french: 'baguette',
  'caro-kann': 'shield',
  sicilian: 'lemon',
  scandinavian: 'longship',
  'kings-indian': 'elephant',
  slav: 'matryoshka',
  italian: 'pizza',
  'ruy-lopez': 'guitar',
  vienna: 'coffee',
  london: 'bus',
  'queens-gambit': 'crown',
};

export const FALLBACK_ICON: IconName = 'pawn';

export function iconFor(openingId: string): IconName {
  return OPENING_ICONS[openingId] ?? FALLBACK_ICON;
}

export type Pixel = { x: number; y: number; color: string };

/** The icon as coloured pixels, centred in a square grid of `size` × `size`. */
export function iconPixels(name: IconName, palette: Record<string, string>): { size: number; pixels: Pixel[] } {
  const rows = ART[name];
  const width = Math.max(...rows.map((r) => r.length));
  const size = Math.max(16, width, rows.length);
  const offsetX = Math.floor((size - width) / 2);
  const offsetY = Math.floor((size - rows.length) / 2);
  const pixels: Pixel[] = [];
  rows.forEach((row, y) =>
    [...row].forEach((char, x) => {
      const color = palette[char];
      if (color) pixels.push({ x: x + offsetX, y: y + offsetY, color });
    }),
  );
  return { size, pixels };
}

/** Every icon's art, for tests. */
export const ICON_ART: Record<IconName, string[]> = ART;
