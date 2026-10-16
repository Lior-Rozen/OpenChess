/** How much the Mastermind talks: everything, only when a run starts and ends, or not at all. */
export const CHATTER_LEVELS = ['normal', 'minimal', 'silent'] as const;
export type Chatter = (typeof CHATTER_LEVELS)[number];

export type Settings = {
  sound: boolean;
  /** Vibration on moves, mistakes and finished lines. */
  haptics: boolean;
  chatter: Chatter;
};

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true, chatter: 'normal' };

/** Reads saved settings, keeping the default for anything missing or unreadable. */
export function parseSettings(saved: unknown): Settings {
  const s = typeof saved === 'object' && saved !== null ? (saved as Record<string, unknown>) : {};
  return {
    sound: typeof s.sound === 'boolean' ? s.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics,
    chatter: CHATTER_LEVELS.find((c) => c === s.chatter) ?? DEFAULT_SETTINGS.chatter,
  };
}
