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
  font: 'serif',
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
    good: 'rgba(0, 230, 170, 0.6)',
    bad: 'rgba(255, 40, 70, 0.75)',
  },

  /** The 8-bit Mastermind: hood, skin shadow, skin, eyes. */
  mastermind: { hood: '#3b2a5c', shadow: '#9c8670', skin: '#e3c9ad', eyes: '#00e5ff' },
};
