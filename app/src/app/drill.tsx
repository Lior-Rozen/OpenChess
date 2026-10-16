import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board, type BoardFlash } from '@/chess/Board';
import type { Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';
import { Button } from '@/components/Button';
import { loadLine, loadOpening } from '@/content/loader';
import type { Opening, OpeningLine } from '@/content/types';
import { countsFor, levelStatuses, openingProgress } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';
import {
  TEST_MISTAKE_LIMIT,
  Trainer,
  type TrainerEvent,
  type TrainerMode,
  type TrainerState,
} from '@/trainer/trainer';

const MODES: TrainerMode[] = ['watch', 'practice', 'test'];
const MODE_LABELS: Record<TrainerMode, string> = { watch: 'Watch', practice: 'Practice', test: 'Test' };

/** Delay before the app plays its move, in ms. Watch mode is slower so notes can be read. */
function autoMoveDelay(state: TrainerState): number {
  if (state.mode !== 'watch') return 600;
  return state.note ? 2200 : 1100;
}

/** What to drill: one line, or (Hard) a whole level with random branches. */
type DrillTarget = { opening: Opening; lines: OpeningLine[]; title: string; levelTest: boolean };

/**
 * Route params: opening + line + mode drills one line; opening + level drills every line of
 * that level for the current difficulty in Test mode, with random branches (Hard).
 */
export default function DrillScreen() {
  const params = useLocalSearchParams<{ opening: string; line?: string; level?: string; mode?: string }>();
  const { progress, loaded } = useProgress();
  const mode = MODES.find((m) => m === params.mode) ?? 'practice';

  let target: DrillTarget | null = null;
  if (params.line) {
    const found = loadLine(params.opening, params.line);
    if (found) target = { opening: found.opening, lines: [found.line], title: found.line.name, levelTest: false };
  } else if (params.level) {
    const opening = loadOpening(params.opening);
    const level = Number(params.level);
    const { difficulty } = openingProgress(progress, params.opening);
    const lines = opening?.lines.filter((l) => l.level === level && countsFor(l, difficulty)) ?? [];
    if (opening && lines.length > 0) target = { opening, lines, title: `Level ${level} test`, levelTest: true };
  }

  if (!loaded) return <View style={styles.screen} />;
  if (!target) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
        <Text style={styles.note}>Nothing to drill here.</Text>
      </View>
    );
  }
  return <Drill key={`${params.line ?? params.level}-${mode}`} target={target} initialMode={target.levelTest ? 'test' : mode} />;
}

/** What changed in the user's progress when a run finished. */
type RunResult = { newlyMastered: boolean; unlockedLevel: number | null };

function Drill({ target, initialMode }: { target: DrillTarget; initialMode: TrainerMode }) {
  const { opening, lines, title, levelTest } = target;
  const userColor = opening.side === 'white' ? 'w' : 'b';
  const { recordRun } = useProgress();
  const [trainer, setTrainer] = useState(() => new Trainer(lines, userColor, initialMode));
  const [state, setState] = useState(() => trainer.state());
  const [selection, setSelection] = useState<Selection>(null);
  const [flash, setFlash] = useState<(BoardFlash & { id: number }) | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [shake] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  /** Saves the outcome of a finished Practice/Test run. */
  function handleEvents(events: TrainerEvent[], mode: TrainerMode) {
    if (mode === 'watch') return;
    for (const event of events) {
      if (event.type !== 'lineComplete') continue;
      const saved = recordRun(opening.id, event.lineId, { mode, clean: event.clean });
      const before = levelStatuses(opening, saved.before);
      const after = levelStatuses(opening, saved.after);
      const isMastered = (levels: typeof before) =>
        levels.flatMap((l) => l.lines).find((l) => l.line.id === event.lineId)?.mastered ?? false;
      const unlocked = after.find((l, i) => l.unlocked && !before[i]?.unlocked);
      setResult({ newlyMastered: isMastered(after) && !isMastered(before), unlockedLevel: unlocked?.level ?? null });
    }
  }

  const autoMove = useEffectEvent(() => {
    const events = trainer.advance();
    setState(trainer.state());
    handleEvents(events, state.mode);
  });

  // The app plays its book moves after a short pause.
  useEffect(() => {
    if (state.phase !== 'auto') return;
    const timer = setTimeout(autoMove, autoMoveDelay(state));
    return () => clearTimeout(timer);
  }, [state]);

  function start(mode: TrainerMode) {
    const next = new Trainer(lines, userColor, mode);
    setTrainer(next);
    setState(next.state());
    setSelection(null);
    setFlash(null);
    setResult(null);
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
    const tap = handleTap(trainer.board, selection, square);
    setSelection(tap.selection);
    if (!tap.move) return;

    const events = trainer.tryMove(tap.move.from, tap.move.to);
    setState(trainer.state());
    if (events.some((e) => e.type === 'wrongMove')) {
      showFlash(tap.move.to, 'bad');
      shakeBoard();
    } else {
      showFlash(tap.move.to, 'good');
    }
    handleEvents(events, state.mode);
  }

  function onHint() {
    trainer.requestHint();
    setState(trainer.state());
  }

  const finished = state.phase === 'complete' || state.phase === 'failed';
  const completedLine = lines.find((l) => l.id === state.lineId);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusRow}>
          <Text style={styles.status}>{MODE_LABELS[state.mode]}</Text>
          <Text style={styles.status}>{statusText(state)}</Text>
          {state.mode !== 'watch' && (
            <Text style={[styles.status, state.mistakes > 0 && styles.bad]}>
              Mistakes: {state.mistakes}
              {state.mode === 'test' ? ` / ${TEST_MISTAKE_LIMIT}` : ''}
            </Text>
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

        {finished ? (
          <ResultCard
            state={state}
            result={result}
            lineName={levelTest ? completedLine?.name : undefined}
            summary={state.phase === 'complete' ? completedLine?.summary : undefined}
            levelTest={levelTest}
            onRestart={start}
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
  if (state.phase === 'failed') return 'Test failed';
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

type ResultCardProps = {
  state: TrainerState;
  result: RunResult | null;
  /** For a level test: the line the random branches ended up in. */
  lineName: string | undefined;
  summary: string | undefined;
  levelTest: boolean;
  onRestart: (mode: TrainerMode) => void;
  onBack: () => void;
};

function ResultCard({ state, result, lineName, summary, levelTest, onRestart, onBack }: ResultCardProps) {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  if (state.phase === 'failed') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Test failed</Text>
        <Text style={[styles.cardResult, styles.bad]}>{plural(state.mistakes, 'mistake')}. Go over it again.</Text>
        <View style={styles.cardButtons}>
          <Button label="Try again" primary onPress={() => onRestart('test')} />
          {!levelTest && <Button label="Practice" onPress={() => onRestart('practice')} />}
          <Button label="Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  const nextMode: TrainerMode | null =
    levelTest ? null : state.mode === 'watch' ? 'practice' : state.mode === 'practice' ? 'test' : null;
  let outcome = 'You watched the whole line.';
  if (state.mode !== 'watch') {
    outcome = state.clean
      ? state.mode === 'test'
        ? 'Clean run: no mistakes.'
        : 'No mistakes, no hints.'
      : `${plural(state.mistakes, 'mistake')}${state.hintsUsed > 0 ? `, ${plural(state.hintsUsed, 'hint')}` : ''}.`;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{lineName ?? 'Line complete'}</Text>
      <Text style={[styles.cardResult, state.mode !== 'watch' && (state.clean ? styles.good : styles.bad)]}>
        {outcome}
      </Text>
      {state.mode === 'test' && !state.clean && <Text style={styles.note}>Only clean runs count towards mastery.</Text>}
      {result?.newlyMastered && <Text style={[styles.cardResult, styles.good]}>Line mastered!</Text>}
      {result?.unlockedLevel && (
        <Text style={[styles.cardResult, styles.good]}>Level {result.unlockedLevel} unlocked!</Text>
      )}
      {summary && <Text style={styles.note}>{summary}</Text>}
      <View style={styles.cardButtons}>
        <Button label="Again" onPress={() => onRestart(state.mode)} />
        {nextMode && <Button label={MODE_LABELS[nextMode]} primary onPress={() => onRestart(nextMode)} />}
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
  cardTitle: { fontSize: 22, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
  cardResult: { fontSize: 17, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
  cardButtons: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
});
