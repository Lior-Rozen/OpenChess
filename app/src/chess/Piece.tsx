import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import bB from '@/assets/pieces/bB.png';
import bK from '@/assets/pieces/bK.png';
import bN from '@/assets/pieces/bN.png';
import bP from '@/assets/pieces/bP.png';
import bQ from '@/assets/pieces/bQ.png';
import bR from '@/assets/pieces/bR.png';
import wB from '@/assets/pieces/wB.png';
import wK from '@/assets/pieces/wK.png';
import wN from '@/assets/pieces/wN.png';
import wP from '@/assets/pieces/wP.png';
import wQ from '@/assets/pieces/wQ.png';
import wR from '@/assets/pieces/wR.png';

import type { Color, PieceSymbol } from './game';

// One image per piece in app/assets/pieces, named colour + piece letter (wK, bP, …).
const IMAGES: Record<Color, Record<PieceSymbol, ImageSourcePropType>> = {
  w: { k: wK, q: wQ, r: wR, b: wB, n: wN, p: wP },
  b: { k: bK, q: bQ, r: bR, b: bB, n: bN, p: bP },
};

type Props = { type: PieceSymbol; color: Color; size: number };

export function Piece({ type, color, size }: Props) {
  const imageSize = size * 0.9;
  return (
    <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
      <Image source={IMAGES[color][type]} style={{ width: imageSize, height: imageSize }} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
});
