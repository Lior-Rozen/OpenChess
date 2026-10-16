import { StyleSheet, Text, View } from 'react-native';

import type { Color, PieceSymbol } from './game';

// Unicode chess symbols: drawn by the phone's own font, so there are no image files or licences.
// ︎ asks for the plain-text glyph, so the black pawn doesn't render as an emoji.
const FILLED: Record<PieceSymbol, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟︎' };
const OUTLINE: Record<PieceSymbol, string> = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };

type Props = { type: PieceSymbol; color: Color; size: number };

/** A piece is the solid glyph in the piece's colour with the outline glyph drawn on top. */
export function Piece({ type, color, size }: Props) {
  const glyph = { fontSize: size * 0.8, lineHeight: size, width: size, height: size };
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      <Text style={[styles.glyph, glyph, { color: color === 'w' ? '#ffffff' : '#000000' }]}>
        {FILLED[type]}
      </Text>
      <Text style={[styles.glyph, glyph, styles.outline]}>{OUTLINE[type]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  glyph: {
    position: 'absolute',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  outline: { color: '#000000' },
});
