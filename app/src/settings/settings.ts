/** How long the Mastermind waits before his moves (and how fast Watch plays). */
export const SPEEDS = ['slow', 'normal', 'fast'] as const;
export type Speed = (typeof SPEEDS)[number];

/** Practice: wrong tries before the arrow appears; 0 means never (the Hint button still works). */
export const AUTO_HINTS = [1, 2, 0] as const;
export type AutoHint = (typeof AUTO_HINTS)[number];

export type Settings = {
  sound: boolean;
  /** Vibration on moves, mistakes and finished lines. */
  haptics: boolean;
  /** The Mastermind speaks at key moments. Off: he still plays, silently. */
  talk: boolean;
  speed: Speed;
  /** File and rank letters on the board. */
  coordinates: boolean;
  autoHint: AutoHint;
};

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  haptics: true,
  talk: true,
  speed: 'normal',
  coordinates: true,
  autoHint: 2,
};

/** Multiplies the Mastermind's pause and Watch's pace. */
export const SPEED_FACTOR: Record<Speed, number> = { slow: 1.7, normal: 1, fast: 0.5 };

/** Reads saved settings, keeping the default for anything missing or unreadable. */
export function parseSettings(saved: unknown): Settings {
  const s = typeof saved === 'object' && saved !== null ? (saved as Record<string, unknown>) : {};
  const bool = (key: 'sound' | 'haptics' | 'coordinates') =>
    typeof s[key] === 'boolean' ? (s[key] as boolean) : DEFAULT_SETTINGS[key];
  return {
    sound: bool('sound'),
    haptics: bool('haptics'),
    // Settings saved before the on/off switch had a three-way "chatter"; only "silent" meant off.
    talk: typeof s.talk === 'boolean' ? s.talk : s.chatter !== 'silent',
    speed: SPEEDS.find((v) => v === s.speed) ?? DEFAULT_SETTINGS.speed,
    coordinates: bool('coordinates'),
    autoHint: AUTO_HINTS.find((v) => v === s.autoHint) ?? DEFAULT_SETTINGS.autoHint,
  };
}
