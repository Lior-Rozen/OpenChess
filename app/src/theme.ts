/**
 * Every colour in the app ("Midnight Arcade"): dark violet with neon accents. Magenta is the
 * user's colour (main actions, progress, selection), cyan is the Mastermind's (his speech, hints).
 */
export const theme = {
  background: '#130c20',
  card: '#1f1533',
  pressed: '#2c1f48',
  border: '#4a3670',
  text: '#efe8ff',
  muted: '#a395c9',
  accent: '#ff40c8',
  accent2: '#00e5ff',
  /** Text on an accent-coloured background. */
  onAccent: '#1a0720',
  good: '#00e6aa',
  bad: '#ff4766',
  /** Stars and tips. */
  gold: '#ffd23f',
  /** Inter (OFL, loaded in app/_layout.tsx). On Android each weight is its own font family. */
  font: 'Inter_400Regular',
  fontMedium: 'Inter_500Medium',
  fontSemi: 'Inter_600SemiBold',
  fontBold: 'Inter_700Bold',
  /** The 8-bit accents (the Mastermind's name, small labels). */
  mono: 'monospace',

  /** Soft neon glow (React Native's CSS-style boxShadow). */
  glow: '0 0 16px rgba(255, 64, 200, 0.45)',

  board: {
    light: '#b9a6d6',
    dark: '#5e3b8c',
    lastMove: 'rgba(255, 64, 200, 0.42)',
    selected: 'rgba(255, 64, 200, 0.6)',
    check: 'rgba(255, 40, 70, 0.7)',
    target: 'rgba(30, 10, 55, 0.5)',
    arrow: 'rgba(0, 229, 255, 0.85)',
    threat: 'rgba(255, 71, 102, 0.6)',
    mark: 'rgba(255, 210, 63, 0.85)',
    good: 'rgba(0, 230, 170, 0.6)',
    bad: 'rgba(255, 40, 70, 0.75)',
  },

  /** The 8-bit Mastermind: hood, skin shadow, skin, eyes. */
  mastermind: { hood: '#3b2a5c', shadow: '#9c8670', skin: '#e3c9ad', eyes: '#00e5ff' },

  /** The opening icons' 8-bit palette, one character per colour (see `src/openings/icons.ts`). */
  pixel: {
    Y: '#ffd23f', // yellow
    y: '#c98a1a',
    O: '#ff8a3d', // orange
    o: '#7a4220', // brown
    B: '#e0a458', // bread
    b: '#9a5a24',
    W: '#f4eefc', // white
    G: '#a79dbf', // grey
    g: '#5d5378',
    R: '#ff4766', // red
    r: '#a8203a',
    P: '#ff40c8', // magenta
    p: '#a0207e',
    C: '#00e5ff', // cyan
    c: '#0088a8',
    V: '#9b6dff', // violet
    N: '#5fd36a', // leaf green
    n: '#2f8a3a',
    L: '#ffd9b0', // skin
    K: '#120a1e', // near black
  } as Record<string, string>,
};
