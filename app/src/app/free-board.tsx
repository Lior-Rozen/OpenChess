import { Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board } from '@/chess/Board';
import { BoardEditor } from '@/chess/BoardEditor';
import { editorBoardFrom } from '@/chess/editor';
import { Button } from '@/components/Button';
import { ChessGame, type Color, type GamePosition, type Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';
import { useFeedback } from '@/feedback/feedback';
import { theme } from '@/theme';

/** Free board: play both sides freely, e.g. to try out ideas, or set up any position first. */
export default function FreeBoard() {
  const [game] = useState(() => new ChessGame());
  const [position, setPosition] = useState(() => game.position());
  const [selection, setSelection] = useState<Selection>(null);
  const [orientation, setOrientation] = useState<Color>('w');
  const [editing, setEditing] = useState(false);
  const feedback = useFeedback();
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  function onSquarePress(square: Square) {
    const result = handleTap(game, selection, square);
    if (result.move) {
      game.move(result.move.from, result.move.to);
      const next = game.position();
      setPosition(next);
      feedback(next.status === 'checkmate' ? 'complete' : 'move');
    }
    setSelection(result.selection);
  }

  /** Takes back one move at a time, at any point, checkmate included. */
  function takeBack() {
    if (game.undo()) setPosition(game.position());
    setSelection(null);
  }

  function newGame() {
    game.reset();
    setPosition(game.position());
    setSelection(null);
  }

  /** Plays on from a position set up in the editor. Take back stops there. */
  function playFrom(fen: string) {
    game.load(fen);
    setPosition(game.position());
    setSelection(null);
    setEditing(false);
  }

  if (editing) {
    return (
      <View style={[styles.container, styles.editing]}>
        <Stack.Screen options={{ headerShown: true, title: 'Set up a position' }} />
        <BoardEditor
          initial={editorBoardFrom(position)}
          initialTurn={position.turn}
          orientation={orientation}
          size={boardSize}
          onPlay={playFrom}
          onCancel={() => setEditing(false)}
        />
      </View>
    );
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
        <Button label="Take back" onPress={takeBack} disabled={position.lastMove === null} />
        <Button label="Flip board" onPress={() => setOrientation((o) => (o === 'w' ? 'b' : 'w'))} />
        <Button label="New game" onPress={newGame} />
        <Button label="Edit position" onPress={() => setEditing(true)} />
      </View>
    </View>
  );
}

function describe({ status, turn }: GamePosition): string {
  const side = turn === 'w' ? 'White' : 'Black';
  const other = turn === 'w' ? 'Black' : 'White';
  switch (status) {
    case 'checkmate':
      return `Checkmate. ${other} wins.`;
    case 'stalemate':
      return 'Stalemate. Draw.';
    case 'draw':
      return 'Draw';
    case 'check':
      return `Check! ${side} to move.`;
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
  editing: { justifyContent: 'flex-start', paddingTop: 12 },
  status: {
    fontSize: 20,
    fontFamily: theme.font,
    color: theme.text,
    marginBottom: 12,
  },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 },
});
