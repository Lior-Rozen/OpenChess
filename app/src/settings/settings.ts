export type Settings = {
  sound: boolean;
  /** Vibration on moves, mistakes and finished lines. */
  haptics: boolean;
  /** The Mastermind speaks at key moments. Off: he still plays, silently. */
  talk: boolean;
};

export const DEFAULT_SETTINGS: Settings = { sound: true, haptics: true, talk: true };

/** Reads saved settings, keeping the default for anything missing or unreadable. */
export function parseSettings(saved: unknown): Settings {
  const s = typeof saved === 'object' && saved !== null ? (saved as Record<string, unknown>) : {};
  return {
    sound: typeof s.sound === 'boolean' ? s.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof s.haptics === 'boolean' ? s.haptics : DEFAULT_SETTINGS.haptics,
    // Settings saved before the on/off switch had a three-way "chatter"; only "silent" meant off.
    talk: typeof s.talk === 'boolean' ? s.talk : s.chatter !== 'silent',
  };
}
