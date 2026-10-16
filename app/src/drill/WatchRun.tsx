import { router } from 'expo-router';
import { useEffect, useEffectEvent, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Board } from '@/chess/Board';
import { useFeedback } from '@/feedback/feedback';
import { GREETING, say, speaks } from '@/mastermind/lines';
import { MastermindSpeech } from '@/mastermind/Speech';
import { useProgress } from '@/progress/ProgressContext';
import { useSettings } from '@/settings/SettingsContext';
import { theme } from '@/theme';
import { watchFrames } from '@/trainer/watch';

import { startRandomDrill } from './random';
import { DrillHeader } from './DrillHeader';
import { ResultCard } from './ResultCard';
import { drillStyles, formatMoves, type DrillTarget, type Restart } from './shared';

/** Watch mode: the line plays itself, and the user can pause and step back and forth at will. */
export function WatchRun({ target, onRestart }: { target: DrillTarget; onRestart: Restart }) {
  const line = target.lines[0];
  const userColor = target.opening.side === 'white' ? 'w' : 'b';
  const { progress, recordRun } = useProgress();
  const { settings } = useSettings();
  const feedback = useFeedback();
  const [frames] = useState(() => watchFrames(line));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [watched, setWatched] = useState(false);
  // Stepping forward one move slides the piece; going back or jumping shows the position at once.
  const [slideIn, setSlideIn] = useState(false);
  const [speech, setSpeech] = useState(() => `${GREETING} ${say('startWatch')}`);
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 520);

  const last = frames.length - 1;
  const frame = frames[index];
  // Pause longer after a move with a note, so it can be read.
  const delay = index === 0 ? 900 : frame.note ? 2400 : 1200;

  function goTo(next: number) {
    const clamped = Math.max(0, Math.min(next, last));
    if (clamped === index) return;
    setSlideIn(clamped === index + 1);
    setIndex(clamped);
    const firstFinish = clamped === last && !watched;
    feedback(firstFinish ? 'complete' : 'move');
    if (clamped === last) {
      setPlaying(false);
      if (firstFinish) {
        setWatched(true);
        recordRun(target.opening.id, line.id, { mode: 'watch', clean: true });
        if (speaks(settings.chatter, 'watchDone')) setSpeech(say('watchDone'));
      }
    }
  }

  /** Stepping by hand pauses the autoplay. */
  function step(next: number) {
    setPlaying(false);
    goTo(next);
  }

  function togglePlay() {
    if (playing) return setPlaying(false);
    if (index === last) {
      setSlideIn(false);
      setIndex(0);
    }
    setPlaying(true);
  }

  const autoStep = useEffectEvent(() => goTo(index + 1));

  useEffect(() => {
    if (!playing || index >= last) return;
    const timer = setTimeout(autoStep, delay);
    return () => clearTimeout(timer);
  }, [playing, index, last, delay]);

  return (
    <View style={drillStyles.screen}>
      <DrillHeader target={target} />
      <ScrollView contentContainerStyle={drillStyles.content}>
        {settings.chatter !== 'silent' && <MastermindSpeech text={speech} />}

        <View style={drillStyles.statusRow}>
          <Text style={drillStyles.status}>Watch</Text>
          <Text style={drillStyles.status}>
            {index === 0 ? 'Start' : `Move ${Math.ceil(index / 2)} of ${Math.ceil(last / 2)}`}
          </Text>
        </View>

        <Board position={frame.position} orientation={userColor} selection={null} onSquarePress={() => {}} size={boardSize} slide={slideIn} />

        <View style={styles.controls}>
          <Control label="|◁" description="Start" onPress={() => step(0)} disabled={index === 0} />
          <Control label="◁" description="Previous move" onPress={() => step(index - 1)} disabled={index === 0} />
          <Control label={playing ? '❙❙' : '▷'} description={playing ? 'Pause' : 'Play'} onPress={togglePlay} wide />
          <Control label="▷" description="Next move" onPress={() => step(index + 1)} disabled={index === last} />
          <Control label="▷|" description="End" onPress={() => step(last)} disabled={index === last} />
        </View>

        {index === last && watched ? (
          <ResultCard
            title="Line complete"
            outcome="You watched the whole line."
            tone={null}
            notes={line.summary ? [line.summary] : []}
            buttons={[
              { label: 'Watch again', onPress: () => onRestart('watch') },
              { label: 'Practice', primary: true, onPress: () => onRestart('practice') },
              ...(target.random
                ? [{ label: 'Next random', onPress: () => startRandomDrill(progress, { exclude: line.id, replace: true }) }]
                : []),
              { label: 'Back', onPress: () => router.back() },
            ]}
          />
        ) : (
          <Text style={drillStyles.note}>{frame.note ?? ' '}</Text>
        )}

        <Text style={drillStyles.moveList}>{formatMoves(frame.moves)}</Text>
      </ScrollView>
    </View>
  );
}

type ControlProps = { label: string; description: string; onPress: () => void; disabled?: boolean; wide?: boolean };

function Control({ label, description, onPress, disabled = false, wide = false }: ControlProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={description}
      hitSlop={6}
      style={({ pressed }) => [styles.control, wide && styles.wide, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.controlText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controls: { flexDirection: 'row', gap: 8 },
  control: {
    minWidth: 52,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  wide: { minWidth: 72, borderColor: theme.accent },
  pressed: { backgroundColor: theme.pressed },
  disabled: { opacity: 0.35 },
  controlText: { fontSize: 18, color: theme.text, fontWeight: '600' },
});
