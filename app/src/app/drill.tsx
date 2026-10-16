import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board, type BoardFlash } from '@/chess/Board';
import type { Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';
import { Button } from '@/components/Button';
import { loadLine } from '@/content/loader';
import type { Opening, OpeningLine } from '@/content/types';
import { theme } from '@/theme';
import { Trainer, type TrainerMode, type TrainerState } from '@/trainer/trainer';

const MODES: TrainerMode[] = ['watch', 'practice', 'test'];
const MODE_LABELS: Record<TrainerMode, string> = { watch: 'Watch', practice: 'Practice', test: 'Test' };

/** Delay before the app plays its move, in ms. Watch mode is slower so notes can be read. */
function autoMoveDelay(state: TrainerState): number {
  if (state.mode !== 'watch') return 600;
  return state.note ? 2200 : 1100;
}

export default function DrillScreen() {
  const params = useLocalSearchParams<{ opening: string; line: string; mode: string }>();
  const found = loadLine(params.opening, params.line);
  const mode = MODES.find((m) => m === params.mode) ?? 'practice';

  if (!found) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
        <Text style={styles.note}>Line not found.</Text>
      </View>
    );
  }
  return <Drill key={`${found.line.id}-${mode}`} opening={found.opening} line={found.line} initialMode={mode} />;
}

function Drill({ opening, line, initialMode }: { opening: Opening; line: OpeningLine; initialMode: TrainerMode }) {
  const userColor = opening.side === 'white' ? 'w' : 'b';
  const [trainer, setTrainer] = useState(() => new Trainer(line, userColor, initialMode));
  const [state, setState] = useState(() => trainer.state());
  const [selection, setSelection] = useState<Selection>(null);
  const [flash, setFlash] = useState<(BoardFlash & { id: number }) | null>(null);
  const [shake] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  // The app plays its book moves after a short pause.
  useEffect(() => {
    if (state.phase !== 'auto') return;
    const timer = setTimeout(() => {
      trainer.advance();
      setState(trainer.state());
    }, autoMoveDelay(state));
    return () => clearTimeout(timer);
  }, [state, trainer]);

  function start(mode: TrainerMode) {
    const next = new Trainer(line, userColor, mode);
    setTrainer(next);
    setState(next.state());
    setSelection(null);
    setFlash(null);
  }

  function showFlash(square: Square, kind: BoardFlash['kind']) {
    const id = Date.now();
    setFlash({ square, kind, id });
    setTimeout(() => setFlash((current) => (current?.id === id ? null : current)), 500);
  }

  function shakeBoard() {
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 7, -7, 3, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 45, useNativeDriver: true }),
      ),
    ).start();
  }

  function onSquarePress(square: Square) {
    if (state.phase !== 'user') return;
    const result = handleTap(trainer.board, selection, square);
    setSelection(result.selection);
    if (!result.move) return;

    const events = trainer.tryMove(result.move.from, result.move.to);
    setState(trainer.state());
    if (events.some((e) => e.type === 'wrongMove')) {
      showFlash(result.move.to, 'bad');
      shakeBoard();
    } else {
      showFlash(result.move.to, 'good');
    }
  }

  function onHint() {
    trainer.requestHint();
    setState(trainer.state());
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: line.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <Text style={styles.status}>{MODE_LABELS[state.mode]}</Text>
          <Text style={styles.status}>{statusText(state)}</Text>
          {state.mode !== 'watch' && (
            <Text style={[styles.status, state.mistakes > 0 && styles.bad]}>Mistakes: {state.mistakes}</Text>
          )}
        </View>

        <Animated.View style={{ transform: [{ translateX: shake }] }}>
          <Board
            position={state.position}
            orientation={userColor}
            selection={selection}
            onSquarePress={onSquarePress}
            size={boardSize}
            arrow={state.hint}
            flash={flash}
          />
        </Animated.View>

        {state.phase === 'complete' ? (
          <CompleteCard
            state={state}
            summary={line.summary}
            onAgain={() => start(state.mode)}
            onMode={start}
            onBack={() => router.back()}
          />
        ) : (
          <View style={styles.below}>
            <Text style={styles.note}>{state.note ?? ' '}</Text>
            {state.mode === 'practice' && (
              <Button label="Hint" onPress={onHint} disabled={state.phase !== 'user' || state.hint !== null} />
            )}
          </View>
        )}

        <Text style={styles.moveList}>{formatMoves(state.moves)}</Text>
      </ScrollView>
    </View>
  );
}

function statusText(state: TrainerState): string {
  if (state.phase === 'complete') return 'Line complete';
  if (state.mode === 'watch') return `Move ${Math.ceil((state.ply + 1) / 2)} of ${Math.ceil(state.totalPlies / 2)}`;
  if (state.phase === 'auto') return 'Opponent…';
  return state.hint ? 'Play the arrow' : 'Your move';
}

function formatMoves(moves: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    parts.push(`${i / 2 + 1}. ${moves[i]}${moves[i + 1] ? ` ${moves[i + 1]}` : ''}`);
  }
  return parts.join('  ');
}

type CompleteCardProps = {
  state: TrainerState;
  summary: string | undefined;
  onAgain: () => void;
  onMode: (mode: TrainerMode) => void;
  onBack: () => void;
};

function CompleteCard({ state, summary, onAgain, onMode, onBack }: CompleteCardProps) {
  const nextMode: TrainerMode | null = state.mode === 'watch' ? 'practice' : state.mode === 'practice' ? 'test' : null;
  let result = 'You watched the whole line.';
  if (state.mode !== 'watch') {
    result = state.clean
      ? state.mode === 'test'
        ? 'Clean run: no mistakes.'
        : 'No mistakes, no hints.'
      : `${state.mistakes} mistake${state.mistakes === 1 ? '' : 's'}${
          state.hintsUsed > 0 ? `, ${state.hintsUsed} hint${state.hintsUsed === 1 ? '' : 's'}` : ''
        }.`;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Line complete</Text>
      <Text style={[styles.cardResult, state.mode !== 'watch' && (state.clean ? styles.good : styles.bad)]}>
        {result}
      </Text>
      {summary && <Text style={styles.note}>{summary}</Text>}
      <View style={styles.cardButtons}>
        <Button label="Again" onPress={onAgain} />
        {nextMode && <Button label={MODE_LABELS[nextMode]} primary onPress={() => onMode(nextMode)} />}
        <Button label="Back" onPress={onBack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', padding: 8, gap: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingHorizontal: 4 },
  status: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  good: { color: theme.good },
  bad: { color: theme.bad },
  below: { alignSelf: 'stretch', alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  note: { fontSize: 16, fontFamily: theme.font, fontStyle: 'italic', color: theme.muted, textAlign: 'center' },
  moveList: { fontSize: 15, fontFamily: theme.font, color: theme.text, alignSelf: 'stretch', paddingHorizontal: 8 },
  card: {
    alignSelf: 'stretch',
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 22, fontFamily: theme.font, color: theme.text },
  cardResult: { fontSize: 17, fontFamily: theme.font, color: theme.text },
  cardButtons: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
