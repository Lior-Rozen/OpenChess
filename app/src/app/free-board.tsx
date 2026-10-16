import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board } from '@/chess/Board';
import { Button } from '@/components/Button';
import { ChessGame, type Color, type GamePosition, type Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';
import { theme } from '@/theme';

/** Free board: play both sides freely, e.g. to try out ideas. */
export default function FreeBoard() {
  const [game] = useState(() => new ChessGame());
  const [position, setPosition] = useState(() => game.position());
  const [selection, setSelection] = useState<Selection>(null);
  const [orientation, setOrientation] = useState<Color>('w');
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  function onSquarePress(square: Square) {
    const result = handleTap(game, selection, square);
    if (result.move) {
      game.move(result.move.from, result.move.to);
      setPosition(game.position());
    }
    setSelection(result.selection);
  }

  function newGame() {
    game.reset();
    setPosition(game.position());
    setSelection(null);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: 'Free board' }} />
      <Text style={styles.status}>{describe(position)}</Text>
      <Board
        position={position}
        orientation={orientation}
        selection={selection}
        onSquarePress={onSquarePress}
        size={boardSize}
      />
      <View style={styles.buttons}>
        <Button label="Flip board" onPress={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))} />
        <Button label="New game" onPress={newGame} />
      </View>
    </View>
  );
}

function describe({ status, turn }: GamePosition): string {
  const side = turn === 'w' ? 'White' : 'Black';
  const other = turn === 'w' ? 'Black' : 'White';
  switch (status) {
    case 'checkmate':
      return `Checkmate — ${other} wins`;
    case 'stalemate':
      return 'Stalemate — draw';
    case 'draw':
      return 'Draw';
    case 'check':
      return `${side} to move — check!`;
    default:
      return `${side} to move`;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
    padding: 8,
  },
  status: {
    fontSize: 20,
    fontFamily: theme.font,
    color: theme.text,
    marginBottom: 12,
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
