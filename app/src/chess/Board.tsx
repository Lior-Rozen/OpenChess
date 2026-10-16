import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Color, GamePosition, Square } from './game';
import { Piece } from './Piece';
import type { Selection } from './tapToMove';

const FILES = 'abcdefgh';

const colors = {
  light: '#eeeed2',
  dark: '#769656',
  lastMove: 'rgba(205, 210, 106, 0.75)',
  selected: 'rgba(20, 85, 30, 0.5)',
  check: 'rgba(220, 40, 40, 0.65)',
  target: 'rgba(20, 85, 30, 0.45)',
};

type Props = {
  position: GamePosition;
  /** The side shown at the bottom. */
  orientation: Color;
  selection: Selection;
  onSquarePress: (square: Square) => void;
  /** Width and height in pixels. */
  size: number;
};

export function Board({ position, orientation, selection, onSquarePress, size }: Props) {
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
              square === position.checkedKing
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
    </View>
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
