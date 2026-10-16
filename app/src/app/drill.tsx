import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board, type BoardFlash } from '@/chess/Board';
import type { Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';
import { Button } from '@/components/Button';
import { loadLine, loadOpening } from '@/content/loader';
import type { Opening, OpeningLine } from '@/content/types';
import { GREETING, say, type LineKind } from '@/mastermind/lines';
import { MastermindSpeech } from '@/mastermind/Speech';
import { levelStatuses } from '@/progress/mastery';
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

/** Delay before the Mastermind plays his move, in ms. Watch mode is slower so notes can be read. */
function autoMoveDelay(state: TrainerState): number {
  if (state.mode !== 'watch') return 600;
  return state.note ? 2200 : 1100;
}

/** One line, or a level exam: every line of a level, with the Mastermind picking branches at random. */
type DrillTarget = { opening: Opening; lines: OpeningLine[]; title: string; examLevel: number | null };

/** Route params: opening + line + mode drills one line; opening + level runs that level's exam. */
export default function DrillScreen() {
  const params = useLocalSearchParams<{ opening: string; line?: string; level?: string; mode?: string }>();
  const { loaded } = useProgress();
  const mode = MODES.find((m) => m === params.mode) ?? 'practice';

  let target: DrillTarget | null = null;
  if (params.line) {
    const found = loadLine(params.opening, params.line);
    if (found) target = { opening: found.opening, lines: [found.line], title: found.line.name, examLevel: null };
  } else if (params.level) {
    const opening = loadOpening(params.opening);
    const level = Number(params.level);
    const lines = opening?.lines.filter((l) => l.level === level) ?? [];
    if (opening && lines.length > 0) target = { opening, lines, title: `Level ${level} exam`, examLevel: level };
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
  const initialMode = target.examLevel !== null ? 'test' : mode;
  return <Drill key={`${params.line ?? params.level}-${initialMode}`} target={target} initialMode={initialMode} />;
}

/** What changed in the user's progress when a run finished. */
type RunResult = { newlyMastered: boolean; unlockedLevel: number | null; examPassed: boolean };

function greeting(mode: TrainerMode, exam: boolean): string {
  const kind: LineKind = exam ? 'startExam' : mode === 'watch' ? 'startWatch' : mode === 'practice' ? 'startPractice' : 'startTest';
  return `${GREETING} ${say(kind)}`;
}

function Drill({ target, initialMode }: { target: DrillTarget; initialMode: TrainerMode }) {
  const { opening, lines, title, examLevel } = target;
  const userColor = opening.side === 'white' ? 'w' : 'b';
  const { recordRun, recordExam } = useProgress();
  const [trainer, setTrainer] = useState(() => new Trainer(lines, userColor, initialMode));
  const [state, setState] = useState(() => trainer.state());
  const [speech, setSpeech] = useState(() => greeting(initialMode, examLevel !== null));
  const [selection, setSelection] = useState<Selection>(null);
  const [flash, setFlash] = useState<(BoardFlash & { id: number }) | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [shake] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  /** Lets the Mastermind react, and saves the outcome when a run ends. */
  function handleEvents(events: TrainerEvent[], mode: TrainerMode) {
    for (const event of events) {
      if (event.type === 'wrongMove') setSpeech(say('mistake'));
      if (event.type === 'hintShown') setSpeech(say('hint'));
      if (event.type === 'testFailed') setSpeech(say('failed'));
      if (event.type !== 'lineComplete') continue;

      const saved = recordRun(opening.id, event.lineId, { mode, clean: event.clean });
      const examPassed = examLevel !== null && event.clean;
      const after = examPassed ? recordExam(opening.id, examLevel).after : saved.after;
      const before = levelStatuses(opening, saved.before);
      const now = levelStatuses(opening, after);
      const mastered = (levels: typeof before) =>
        levels.flatMap((l) => [...l.mainLines, ...l.bonusLines]).find((l) => l.line.id === event.lineId)?.mastered ?? false;
      const unlocked = now.find((l, i) => l.unlocked && !before[i]?.unlocked);
      const outcome = {
        newlyMastered: mastered(now) && !mastered(before),
        unlockedLevel: unlocked?.level ?? null,
        examPassed,
      };
      setResult(outcome);
      setSpeech(
        say(
          mode === 'watch'
            ? 'watchDone'
            : outcome.examPassed
              ? 'examPassed'
              : outcome.unlockedLevel
                ? 'levelUnlocked'
                : outcome.newlyMastered
                  ? 'mastered'
                  : event.clean
                    ? 'clean'
                    : 'unclean',
        ),
      );
    }
  }

  const autoMove = useEffectEvent(() => {
    const events = trainer.advance();
    setState(trainer.state());
    handleEvents(events, state.mode);
  });

  // The Mastermind plays his book moves after a short pause.
  useEffect(() => {
    if (state.phase !== 'auto') return;
    const timer = setTimeout(autoMove, autoMoveDelay(state));
    return () => clearTimeout(timer);
  }, [state]);

  function start(mode: TrainerMode) {
    const next = new Trainer(lines, userColor, mode);
    setTrainer(next);
    setState(next.state());
    setSpeech(greeting(mode, examLevel !== null));
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
    handleEvents(trainer.requestHint(), state.mode);
    setState(trainer.state());
  }

  const finished = state.phase === 'complete' || state.phase === 'failed';
  const completedLine = lines.find((l) => l.id === state.lineId);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <MastermindSpeech text={speech} />

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
            lineName={examLevel !== null ? completedLine?.name : undefined}
            summary={state.phase === 'complete' ? completedLine?.summary : undefined}
            exam={examLevel !== null}
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
  if (state.phase === 'auto') return 'Thinking…';
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
  /** For an exam: the line the random branches ended up in. */
  lineName: string | undefined;
  summary: string | undefined;
  exam: boolean;
  onRestart: (mode: TrainerMode) => void;
  onBack: () => void;
};

function ResultCard({ state, result, lineName, summary, exam, onRestart, onBack }: ResultCardProps) {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

  if (state.phase === 'failed') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{exam ? 'Exam failed' : 'Test failed'}</Text>
        <Text style={[styles.cardResult, styles.bad]}>{plural(state.mistakes, 'mistake')}.</Text>
        <View style={styles.cardButtons}>
          <Button label="Try again" primary onPress={() => onRestart('test')} />
          {!exam && <Button label="Practice" onPress={() => onRestart('practice')} />}
          <Button label="Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  const nextMode: TrainerMode | null =
    exam ? null : state.mode === 'watch' ? 'practice' : state.mode === 'practice' ? 'test' : null;
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
      <Text style={styles.cardTitle}>{exam ? `${lineName ?? 'Line'} complete` : 'Line complete'}</Text>
      <Text style={[styles.cardResult, state.mode !== 'watch' && (state.clean ? styles.good : styles.bad)]}>
        {outcome}
      </Text>
      {state.mode === 'test' && !state.clean && <Text style={styles.note}>Only clean runs count.</Text>}
      {result?.examPassed && <Text style={[styles.cardResult, styles.good]}>★ Exam passed</Text>}
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
