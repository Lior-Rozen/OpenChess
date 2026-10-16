import { theme } from '@/theme';

import { FALLBACK_ICON, ICON_ART, iconFor, iconPixels, type IconName } from './icons';

describe('opening icons', () => {
  it('uses the pawn for an opening without an icon', () => {
    expect(iconFor('no-such-opening')).toBe(FALLBACK_ICON);
    expect(iconFor('french')).toBe('baguette');
  });

  it.each(Object.keys(ICON_ART) as IconName[])('%s only uses palette colours and fits its grid', (name) => {
    for (const row of ICON_ART[name]) {
      for (const char of row) expect(char === '.' || char in theme.pixel).toBe(true);
    }
    const { size, pixels } = iconPixels(name, theme.pixel);
    expect(pixels.length).toBeGreaterThan(0);
    for (const { x, y } of pixels) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(size);
      expect(y).toBeLessThan(size);
    }
  });
});
