import { router } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { Animated, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { Board, type BoardFlash } from '@/chess/Board';
import type { Square } from '@/chess/game';
import { handleTap, type Selection } from '@/chess/tapToMove';
import { Button } from '@/components/Button';
import { Badge } from '@/components/ui';
import { lineTitle } from '@/content/loader';
import { useFeedback, type Cue } from '@/feedback/feedback';
import { GREETING, say, type LineKind } from '@/mastermind/lines';
import { MastermindSpeech } from '@/mastermind/Speech';
import { levelStatuses, nextLineTarget } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { useSettings } from '@/settings/SettingsContext';
import { SPEED_FACTOR } from '@/settings/settings';
import { TEST_MISTAKE_LIMIT, Trainer, type TrainerEvent, type TrainerMode, type TrainerState } from '@/trainer/trainer';

import { startRandomDrill } from './random';
import { DrillHeader } from './DrillHeader';
import { ResultCard, type ResultBadge } from './ResultCard';
import { drillStyles, formatMoves, MODE_LABELS, type DrillTarget, type Restart } from './shared';

/** What changed in the user's progress when a run finished. */
type RunResult = { newlyMastered: boolean; unlockedLevel: number | null; examPassed: boolean };

function greeting(mode: TrainerMode, exam: boolean): string {
  const kind: LineKind = exam ? 'startExam' : mode === 'practice' ? 'startPractice' : 'startTest';
  return `${GREETING} ${say(kind)}`;
}

/** Practice and Test runs (and level exams): the user plays their side against the Mastermind. */
export function TrainerRun({ target, mode, onRestart }: { target: DrillTarget; mode: TrainerMode; onRestart: Restart }) {
  const { opening, lines, examLevel } = target;
  const exam = examLevel !== null;
  const userColor = opening.side === 'white' ? 'w' : 'b';
  const { recordRun, recordExam } = useProgress();
  const feedback = useFeedback();
  const { settings } = useSettings();
  const [trainer] = useState(() => new Trainer(lines, userColor, mode, { triesBeforeHint: settings.autoHint }));
  const [state, setState] = useState(() => trainer.state());
  const [speech, setSpeech] = useState(() => greeting(mode, exam));
  const [selection, setSelection] = useState<Selection>(null);
  const [flash, setFlash] = useState<(BoardFlash & { id: number }) | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  // The Mastermind's moves slide in; the user's own moves land at once.
  const [slideLast, setSlideLast] = useState(false);
  // The latest move note. It stays up through the Mastermind's reply (which would otherwise
  // replace it at once) until a newer note arrives or the user moves again.
  const [note, setNote] = useState<string | null>(null);
  const [shake] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  /** The Mastermind says a line of this kind, unless he's been switched to silent. */
  function talk(kind: LineKind) {
    if (settings.talk) setSpeech(say(kind));
  }

  /** Plays sounds, lets the Mastermind react, and saves the outcome when a run ends. */
  function handleEvents(events: TrainerEvent[]) {
    const cue: Cue | null = events.some((e) => e.type === 'lineComplete')
      ? 'complete'
      : events.some((e) => e.type === 'wrongMove' || e.type === 'testFailed')
        ? 'mistake'
        : events.some((e) => e.type === 'moved')
          ? 'move'
          : null;
    if (cue) feedback(cue);

    for (const event of events) {
      if (event.type === 'moved' && (event.note || event.by === 'user')) setNote(event.note);
      if (event.type === 'wrongMove') talk('mistake');
      if (event.type === 'hintShown') talk('hint');
      if (event.type === 'alternativeMove') talk('alternative');
      if (event.type === 'testFailed') talk('failed');
      if (event.type !== 'lineComplete') continue;

      const saved = recordRun(opening.id, event.lineId, { mode, clean: event.clean });
      const examPassed = exam && event.clean;
      const after = examPassed ? recordExam(opening.id, examLevel).after : saved.after;
      const before = levelStatuses(opening, saved.before);
      const now = levelStatuses(opening, after);
      const mastered = (levels: typeof before) =>
        levels.flatMap((l) => [...l.mainLines, ...l.bonusLines]).find((l) => l.line.id === event.lineId)?.mastered ?? false;
      const unlocked = now.find((l, i) => l.unlocked && !before[i]?.unlocked);
      const outcome: RunResult = {
        newlyMastered: mastered(now) && !mastered(before),
        unlockedLevel: unlocked?.level ?? null,
        examPassed,
      };
      setResult(outcome);
      const kind: LineKind = outcome.examPassed
        ? 'examPassed'
        : outcome.unlockedLevel
          ? 'levelUnlocked'
          : outcome.newlyMastered
            ? 'mastered'
            : event.clean
              ? 'clean'
              : 'unclean';
      talk(kind);
    }
  }

  const autoMove = useEffectEvent(() => {
    const events = trainer.advance();
    setSlideLast(true);
    setState(trainer.state());
    handleEvents(events);
  });

  // The Mastermind plays his book moves after a short pause.
  useEffect(() => {
    if (state.phase !== 'auto') return;
    const timer = setTimeout(autoMove, 600 * SPEED_FACTOR[settings.speed]);
    return () => clearTimeout(timer);
  }, [state, settings.speed]);

  function showFlash(square: Square, kind: BoardFlash['kind']) {
    const id = Date.now();
    setFlash({ square, kind, id });
    setTimeout(() => setFlash((current) => (current?.id === id ? null : current)), 500);
  }

  function shakeBoard() {
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 7, -7, 3, 0].map((toValue) => Animated.timing(shake, { toValue, duration: 45, useNativeDriver: true })),
    ).start();
  }

  function onSquarePress(square: Square) {
    if (state.phase !== 'user') return;
    const tap = handleTap(trainer.board, selection, square);
    setSelection(tap.selection);
    if (!tap.move) return;

    const events = trainer.tryMove(tap.move.from, tap.move.to);
    if (events.some((e) => e.type === 'moved')) setSlideLast(false);
    setState(trainer.state());
    if (events.some((e) => e.type === 'wrongMove')) {
      showFlash(tap.move.to, 'bad');
      shakeBoard();
    } else {
      showFlash(tap.move.to, 'good');
    }
    handleEvents(events);
  }

  function onHint() {
    handleEvents(trainer.requestHint());
    setState(trainer.state());
  }

  const finished = state.phase === 'complete' || state.phase === 'failed';

  return (
    <View style={drillStyles.screen}>
      <DrillHeader target={target} />
      <ScrollView contentContainerStyle={drillStyles.content}>
        <MastermindSpeech text={settings.talk ? speech : null} />

        <View style={drillStyles.statusRow}>
          <Badge label={(exam ? 'Exam' : MODE_LABELS[mode]).toUpperCase()} tone="cyan" />
          <Text style={drillStyles.status}>{statusText(state)}</Text>
          {mode === 'test' ? (
            // One pip per allowed mistake; they fill red as mistakes are made.
            <View style={drillStyles.pips} accessibilityLabel={`${state.mistakes} of ${TEST_MISTAKE_LIMIT} mistakes`}>
              {Array.from({ length: TEST_MISTAKE_LIMIT }, (_, i) => (
                <View key={i} style={[drillStyles.pip, i < state.mistakes && drillStyles.pipOn]} />
              ))}
            </View>
          ) : (
            state.mistakes > 0 && (
              <Text style={drillStyles.bad}>
                {state.mistakes} {state.mistakes === 1 ? 'mistake' : 'mistakes'}
              </Text>
            )
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
            threat={state.mistake?.refutation}
            flash={flash}
            slide={slideLast}
          />
        </Animated.View>

        {finished ? (
          <RunResultCard target={target} mode={mode} state={state} result={result} onRestart={onRestart} />
        ) : (
          <View style={drillStyles.below}>
            <Text style={drillStyles.note}>{alternativeText(state) ?? mistakeText(state) ?? note ?? ' '}</Text>
            {mode === 'practice' && (
              <Button label="Hint" onPress={onHint} disabled={state.phase !== 'user' || state.hint !== null} />
            )}
          </View>
        )}

        <Text style={drillStyles.moveList}>{formatMoves(state.moves)}</Text>
      </ScrollView>
    </View>
  );
}

/** "…Nc6 is also good, but this line plays …c5." while an accepted alternative waits for the book move. */
/** "…Nxd4? Bb5+ wins the queen." after a known mistake, until the next try. */
function mistakeText(state: TrainerState): string | null {
  if (!state.mistake) return null;
  return `${state.userColor === 'b' ? '…' : ''}${state.mistake.san}? ${state.mistake.reason}`;
}

function alternativeText(state: TrainerState): string | null {
  if (!state.alternative) return null;
  const prefix = state.userColor === 'b' ? '…' : '';
  return `${prefix}${state.alternative.san} is also good, but this line plays ${prefix}${state.alternative.bookSan}.`;
}

function statusText(state: TrainerState): string {
  if (state.phase === 'complete') return 'Line complete';
  if (state.phase === 'failed') return 'Failed';
  if (state.phase === 'auto') return 'Thinking…';
  return state.hint ? 'Play the arrow' : 'Your move';
}

type RunResultCardProps = {
  target: DrillTarget;
  mode: TrainerMode;
  state: TrainerState;
  result: RunResult | null;
  onRestart: Restart;
};

function RunResultCard({ target, mode, state, result, onRestart }: RunResultCardProps) {
  const { progress } = useProgress();
  const exam = target.examLevel !== null;
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const lineId = state.lineId ?? target.lines[0].id;
  // After a random drill, another random one; otherwise the next line to learn in this opening.
  const following = target.random || exam ? null : nextLineTarget(target.opening, progress, lineId);
  const next = (primary: boolean) =>
    target.random
      ? [{ label: 'Next random', primary, onPress: () => startRandomDrill(progress, { exclude: lineId, replace: true }) }]
      : following
        ? [
            {
              label: 'Next line',
              primary,
              onPress: () =>
                router.replace({
                  pathname: '/drill',
                  params: { opening: following.openingId, line: following.lineId, mode: following.mode },
                }),
            },
          ]
        : [];

  if (state.phase === 'failed') {
    return (
      <ResultCard
        tone="bad"
        title={exam ? 'Exam failed' : 'Test failed'}
        outcome={plural(state.mistakes, 'mistake')}
        buttons={[
          { label: 'Try again', primary: true, onPress: () => onRestart('test') },
          ...(exam ? [] : [{ label: 'Practice', onPress: () => onRestart('practice') }]),
        ]}
      />
    );
  }

  const line = target.lines.find((l) => l.id === state.lineId);
  const outcome = state.clean
    ? mode === 'test'
      ? 'No mistakes'
      : 'No mistakes, no hints'
    : [plural(state.mistakes, 'mistake'), ...(state.hintsUsed > 0 ? [plural(state.hintsUsed, 'hint')] : [])].join(', ');
  const badges: ResultBadge[] = [
    ...(state.clean ? [{ label: 'CLEAN', tone: 'good' as const }] : []),
    ...(result?.newlyMastered ? [{ label: 'MASTERED', tone: 'accent' as const }] : []),
    ...(result?.unlockedLevel ? [{ label: `LEVEL ${result.unlockedLevel} UNLOCKED`, tone: 'accent' as const }] : []),
    ...(result?.examPassed ? [{ label: '★ EXAM PASSED', tone: 'gold' as const }] : []),
  ];
  const practice = !exam && mode === 'practice';

  return (
    <ResultCard
      tone={state.clean ? 'good' : mode === 'test' ? 'bad' : 'neutral'}
      title={exam ? `${line ? lineTitle(line) : 'Line'} complete` : 'Line complete'}
      outcome={outcome}
      badges={badges}
      tip={line?.summary}
      note={mode === 'test' && !state.clean ? 'Only clean runs count.' : undefined}
      buttons={[
        { label: 'Again', onPress: () => onRestart(mode) },
        ...(practice ? [{ label: 'Test', primary: true, onPress: () => onRestart('test') }] : []),
        ...next(!practice),
      ]}
    />
  );
}
