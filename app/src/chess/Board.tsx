import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';

import { useSettings } from '@/settings/SettingsContext';
import { theme } from '@/theme';

import type { NoteArrow } from '@/content/types';

import type { BoardPiece, Color, GamePosition, Square } from './game';
import { Piece } from './Piece';
import type { Selection } from './tapToMove';

const FILES = 'abcdefgh';

// Violet board with neon accents (magenta for the user's focus, cyan for the Mastermind's hints).
const colors = theme.board;

const MARK_COLOURS: Record<NoteArrow['color'], string> = {
  green: colors.good,
  red: colors.threat,
  yellow: colors.mark,
  blue: colors.arrow,
};

/** How long a sliding piece takes to reach its square. */
const SLIDE_MS = 200;

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
  /** A move to point out, e.g. a hint (cyan). */
  arrow?: BoardArrow | null;
  /** A danger to point out, e.g. how a mistake gets punished (red). */
  threat?: BoardArrow | null;
  /** Arrows that go with a move's note, in the content's colours. */
  marks?: NoteArrow[];
  /** A brief green/red tint on a square, as feedback for a move. */
  flash?: BoardFlash | null;
  /** Slide the last move's piece into place instead of showing it there at once. */
  slide?: boolean;
};

export function Board({
  position,
  orientation,
  selection,
  onSquarePress,
  size,
  arrow,
  threat,
  marks = [],
  flash,
  slide = false,
}: Props) {
  const squareSize = size / 8;
  const { coordinates } = useSettings().settings;
  // While sliding, the moved piece is drawn on its own layer above the squares, not in its square.
  const lastMove = position.lastMove;
  const slider = slide && lastMove ? findPiece(position, lastMove.to) : null;
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
                {piece && square !== slider?.square && <Piece type={piece.type} color={piece.color} size={squareSize} />}
                {/* Coordinates go on top of the pieces so they stay readable on the edge ranks and files. */}
                {coordinates && displayCol === 0 && (
                  <Text style={[styles.label, styles.rankLabel, { color: labelColor, fontSize: squareSize * 0.22 }]}>
                    {8 - row}
                  </Text>
                )}
                {coordinates && displayRow === 7 && (
                  <Text style={[styles.label, styles.fileLabel, { color: labelColor, fontSize: squareSize * 0.22 }]}>
                    {FILES[col]}
                  </Text>
                )}
                {isTarget && <TargetMarker capture={piece !== null} squareSize={squareSize} />}
              </Pressable>
            );
          })}
        </View>
      ))}
      {slider && lastMove && (
        // Keyed by the position, so each new move starts a fresh slide.
        <SlidingPiece
          key={position.fen}
          piece={slider}
          from={lastMove.from}
          orientation={orientation}
          squareSize={squareSize}
        />
      )}
      {marks.map((m) => (
        <ArrowOverlay
          key={`${m.from}${m.to}`}
          arrow={{ from: m.from as Square, to: m.to as Square }}
          orientation={orientation}
          size={size}
          color={MARK_COLOURS[m.color]}
        />
      ))}
      {threat && <ArrowOverlay arrow={threat} orientation={orientation} size={size} color={colors.threat} />}
      {arrow && <ArrowOverlay arrow={arrow} orientation={orientation} size={size} color={colors.arrow} />}
    </View>
  );
}

function findPiece(position: GamePosition, square: Square): BoardPiece | null {
  return position.board.flat().find((p) => p?.square === square) ?? null;
}

type SlidingPieceProps = { piece: BoardPiece; from: Square; orientation: Color; squareSize: number };

/** A piece gliding from `from` to its square. */
function SlidingPiece({ piece, from, orientation, squareSize }: SlidingPieceProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const start = squareCenter(from, orientation, squareSize);
  const end = squareCenter(piece.square, orientation, squareSize);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [start.x - end.x, 0] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [start.y - end.y, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: end.x - squareSize / 2,
        top: end.y - squareSize / 2,
        width: squareSize,
        height: squareSize,
        transform: [{ translateX }, { translateY }],
      }}
    >
      <Piece type={piece.type} color={piece.color} size={squareSize} />
    </Animated.View>
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

type ArrowProps = { arrow: BoardArrow; orientation: Color; size: number; color: string };

function ArrowOverlay({ arrow, orientation, size, color }: ArrowProps) {
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
        stroke={color}
        strokeWidth={squareSize * 0.18}
        strokeLinecap="round"
      />
      <Polygon points={head} fill={color} />
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
  label: { position: 'absolute', fontFamily: theme.fontSemi },
  rankLabel: { top: 1, left: 2 },
  fileLabel: { bottom: 0, right: 3 },
});
