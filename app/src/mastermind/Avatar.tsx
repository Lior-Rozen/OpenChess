import Svg, { Rect } from 'react-native-svg';

// An original 8-bit hooded figure. Each character is one pixel: H hood, S shadow, F face, E eye.
const PIXELS = [
  '....HHHH....',
  '..HHHHHHHH..',
  '.HHHHHHHHHH.',
  '.HHHSSSSHHH.',
  'HHHSFFFFSHHH',
  'HHHFEFFEFHHH',
  'HHHFFFFFFHHH',
  'HHHSFFFFSHHH',
  'HHHHSFFSHHHH',
  '.HHHHHHHHHH.',
  'HHHHHHHHHHHH',
  'HHHHHHHHHHHH',
];

const COLORS: Record<string, string> = { H: '#1f2421', S: '#9c8670', F: '#e3c9ad', E: '#1f2421' };

export function MastermindAvatar({ size = 40 }: { size?: number }) {
  const n = PIXELS.length;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
      {PIXELS.flatMap((row, y) =>
        [...row].map((pixel, x) =>
          COLORS[pixel] ? (
            // Slightly oversized so anti-aliasing doesn't leave hairline gaps between pixels.
            <Rect key={`${x}-${y}`} x={x} y={y} width={1.05} height={1.05} fill={COLORS[pixel]} />
          ) : null,
        ),
      )}
    </Svg>
  );
}
