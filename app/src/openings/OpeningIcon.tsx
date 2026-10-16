import Svg, { Rect } from 'react-native-svg';

import { theme } from '@/theme';

import { iconFor, iconPixels } from './icons';

/** The 8-bit icon of an opening (the pawn if it has none yet). */
export function OpeningIcon({ openingId, size = 40 }: { openingId: string; size?: number }) {
  const { size: grid, pixels } = iconPixels(iconFor(openingId), theme.pixel);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${grid} ${grid}`}>
      {pixels.map(({ x, y, color }) => (
        // Slightly oversized so anti-aliasing doesn't leave hairline gaps between pixels.
        <Rect key={`${x}-${y}`} x={x} y={y} width={1.05} height={1.05} fill={color} />
      ))}
    </Svg>
  );
}
