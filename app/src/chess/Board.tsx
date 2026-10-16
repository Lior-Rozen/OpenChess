import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import type { Color, GamePosition, Square } from './game';
import { Piece } from './Piece';
import type { Selection } from './tapToMove';

const FILES = 'abcdefgh';

// Violet board with neon accents (magenta for the user's focus, cyan for the Mastermind's hints).
const colors = {
  light: '#b9a6d6',
  dark: '#5e3b8c',
  lastMove: 'rgba(255, 64, 200, 0.42)',
  selected: 'rgba(255, 64, 200, 0.6)',
  check: 'rgba(255, 40, 70, 0.7)',
  target: 'rgba(30, 10, 55, 0.5)',
  arrow: 'rgba(0, 229, 255, 0.85)',
  good: 'rgba(0, 230, 170, 0.6)',
  bad: 'rgba(255, 40, 70, 0.75)',
};

export type BoardArrow = { from: Square; to: Square };
export type BoardFlash = { square: Square; kind: 'good' | 'bad' };

type Props = {
  position: GamePosition;
  /** The side shown at the bottom. */
  orientation: Color;
  selection: Selection;
  onSquarePress: (square: Square) => void;
  /** Width and height in pixels. */
  size: number;
  /** A move to point out, e.g. a hint. */
  arrow?: BoardArrow | null;
  /** A brief green/red tint on a square, as feedback for a move. */
  flash?: BoardFlash | null;
};

export function Board({ position, orientation, selection, onSquarePress, size, arrow, flash }: Props) {
  const squareSize = size / 8;
  // position.board runs rank 8 → 1 and file a → h, which is White's view.
  const rowIndexes = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const colIndexes = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <View style={{ width: size, height: size }}>
      {rowIndexes.map((row, displayRow) => (
        <View key={row} style={styles.row}>
          {colIndexes.map((col, displayCol) => {
            const square = `${FILES[col]}${8 - row}` as Square;
            const piece = position.board[row][col];
            const isLight = (row + col) % 2 === 0;
            const isTarget = selection?.targets.includes(square) ?? false;
            const labelColor = isLight ? colors.dark : colors.light;
            const highlight =
              square === flash?.square
                ? colors[flash.kind]
                : square === position.checkedKing
                ? colors.check
                : square === selection?.from
                  ? colors.selected
                  : square === position.lastMove?.from || square === position.lastMove?.to
                    ? colors.lastMove
                    : null;

            return (
              <Pressable
                key={square}
                accessibilityLabel={square}
                onPress={() => onSquarePress(square)}
                style={{
                  width: squareSize,
                  height: squareSize,
                  backgroundColor: isLight ? colors.light : colors.dark,
                }}
              >
                {highlight && <View style={[StyleSheet.absoluteFill, { backgroundColor: highlight }]} />}
                {displayCol === 0 && (
                  <Text style={[styles.label, styles.rankLabel, { color: labelColor, fontSize: squareSize * 0.22 }]}>
                    {8 - row}
                  </Text>
                )}
                {displayRow === 7 && (
                  <Text style={[styles.label, styles.fileLabel, { color: labelColor, fontSize: squareSize * 0.22 }]}>
                    {FILES[col]}
                  </Text>
                )}
                {piece && <Piece type={piece.type} color={piece.color} size={squareSize} />}
                {isTarget && <TargetMarker capture={piece !== null} squareSize={squareSize} />}
              </Pressable>
            );
          })}
        </View>
      ))}
      {arrow && <ArrowOverlay arrow={arrow} orientation={orientation} size={size} />}
    </View>
  );
}

/** Centre of a square in pixels, as displayed. */
function squareCenter(square: Square, orientation: Color, squareSize: number) {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = Number(square[1]);
  const col = orientation === 'w' ? file : 7 - file;
  const row = orientation === 'w' ? 8 - rank : rank - 1;
  return { x: (col + 0.5) * squareSize, y: (row + 0.5) * squareSize };
}

function ArrowOverlay({ arrow, orientation, size }: { arrow: BoardArrow; orientation: Color; size: number }) {
  const squareSize = size / 8;
  const from = squareCenter(arrow.from, orientation, squareSize);
  const to = squareCenter(arrow.to, orientation, squareSize);
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const ux = (to.x - from.x) / length;
  const uy = (to.y - from.y) / length;
  const headLength = squareSize * 0.45;
  const headHalfWidth = squareSize * 0.28;
  const base = { x: to.x - ux * headLength, y: to.y - uy * headLength };
  const head = [
    `${to.x},${to.y}`,
    `${base.x - uy * headHalfWidth},${base.y + ux * headHalfWidth}`,
    `${base.x + uy * headHalfWidth},${base.y - ux * headHalfWidth}`,
  ].join(' ');

  return (
    <Svg width={size} height={size} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Line
        x1={from.x}
        y1={from.y}
        x2={base.x}
        y2={base.y}
        stroke={colors.arrow}
        strokeWidth={squareSize * 0.18}
        strokeLinecap="round"
      />
      <Polygon points={head} fill={colors.arrow} />
    </Svg>
  );
}

/** A dot on an empty target square, a ring around a piece that can be captured. */
function TargetMarker({ capture, squareSize }: { capture: boolean; squareSize: number }) {
  const style = capture
    ? {
        width: squareSize,
        height: squareSize,
        borderRadius: squareSize / 2,
        borderWidth: squareSize * 0.08,
        borderColor: colors.target,
      }
    : {
        width: squareSize * 0.3,
        height: squareSize * 0.3,
        borderRadius: squareSize * 0.15,
        backgroundColor: colors.target,
      };
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      <View style={style} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { position: 'absolute', fontWeight: '600' },
  rankLabel: { top: 1, left: 2 },
  fileLabel: { bottom: 0, right: 3 },
});
