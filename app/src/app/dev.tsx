import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board } from '@/chess/Board';
import { ChessGame, type Color, type GamePosition, type Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';

/** Dev screen: free play for both sides on the board. */
export default function FreePlay() {
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
      <Stack.Screen options={{ headerShown: true, title: 'Free play' }} />
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

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0e9d6',
    padding: 8,
  },
  status: {
    fontSize: 20,
    fontFamily: 'serif',
    color: '#2f3a2f',
    marginBottom: 12,
  },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#5b6b5b',
  },
  buttonPressed: { backgroundColor: '#e2d9c0' },
  buttonText: { fontSize: 16, fontFamily: 'serif', color: '#2f3a2f' },
});
