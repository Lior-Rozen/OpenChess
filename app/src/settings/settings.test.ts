import { DEFAULT_SETTINGS, parseSettings } from './settings';

describe('parseSettings', () => {
  it('reads saved settings', () => {
    expect(parseSettings({ sound: false, haptics: false, chatter: 'silent' })).toEqual({
      sound: false,
      haptics: false,
      chatter: 'silent',
    });
  });

  it('falls back to the defaults for anything missing or unreadable', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('nonsense')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ sound: 'yes', chatter: 'loud' })).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ haptics: false })).toEqual({ ...DEFAULT_SETTINGS, haptics: false });
  });
});
