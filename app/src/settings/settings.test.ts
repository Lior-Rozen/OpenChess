import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('reads saved settings', () => {
    expect(parseSettings({ sound: false, haptics: false, talk: false })).toEqual({
      sound: false,
      haptics: false,
      talk: false,
    });
  });

  it('falls back to the defaults for anything missing or unreadable', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('nonsense')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ sound: 'yes', talk: 'loud' })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ haptics: false })).toEqual({ ...DEFAULT_SETTINGS, haptics: false });
  });

  it('carries over the old three-way chatter setting', () => {
    expect(parseSettings({ chatter: 'silent' }).talk).toBe(false);
    expect(parseSettings({ chatter: 'minimal' }).talk).toBe(true);
  });
});
