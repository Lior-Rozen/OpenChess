import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { lineTitle, loadLine, loadOpening } from '@/content/loader';
import { drillStyles, type DrillTarget } from '@/drill/shared';
import { TrainerRun } from '@/drill/TrainerRun';
import { WatchRun } from '@/drill/WatchRun';
import type { RunMode } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';

const MODES: RunMode[] = ['watch', 'practice', 'test'];

/** Route params: opening + line + mode drills one line; opening + level runs that level's exam. */
export default function DrillScreen() {
  const params = useLocalSearchParams<{ opening: string; line?: string; level?: string; mode?: string; random?: string }>();
  const { loaded } = useProgress();

  let target: DrillTarget | null = null;
  if (params.line) {
    const found = loadLine(params.opening, params.line);
    if (found) {
      target = {
        opening: found.opening,
        lines: [found.line],
        title: lineTitle(found.line),
        examLevel: null,
        random: params.random === '1',
      };
    }
  } else if (params.level) {
    const opening = loadOpening(params.opening);
    const level = Number(params.level);
    // The exam covers the level's main lines; bonus lines stay optional.
    const lines = opening?.lines.filter((l) => l.level === level && l.tier === 'main') ?? [];
    if (opening && lines.length > 0) target = { opening, lines, title: `Level ${level} exam`, examLevel: level };
  }

  const requested = MODES.find((m) => m === params.mode) ?? 'practice';
  const initialMode: RunMode = target?.examLevel != null ? 'test' : requested;

  if (!loaded) return <View style={drillStyles.screen} />;
  if (!target) {
    return (
      <View style={[drillStyles.screen, drillStyles.center]}>
        <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
        <Text style={drillStyles.note}>Nothing to drill here.</Text>
      </View>
    );
  }
  return <Runs target={target} initialMode={initialMode} />;
}

/** Holds the current run; "Again", "Practice" etc. start a fresh one. */
function Runs({ target, initialMode }: { target: DrillTarget; initialMode: RunMode }) {
  const [run, setRun] = useState({ mode: initialMode, id: 0 });
  const restart = (mode: RunMode) => setRun((current) => ({ mode, id: current.id + 1 }));

  return run.mode === 'watch' ? (
    <WatchRun key={run.id} target={target} onRestart={restart} />
  ) : (
    <TrainerRun key={run.id} target={target} mode={run.mode} onRestart={restart} />
  );
}
