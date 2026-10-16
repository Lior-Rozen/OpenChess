import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { loadOpening } from '@/content/loader';
import type { Opening } from '@/content/types';
import {
  levelStatuses,
  openingProgress,
  REQUIRED_CLEAN_RUNS,
  type Difficulty,
  type LevelStatus,
  type LineStatus,
} from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';
import type { TrainerMode } from '@/trainer/trainer';

const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: 'easy', label: 'Easy', description: 'Main lines only. One clean test masters a line.' },
  { value: 'normal', label: 'Normal', description: 'Main lines and sidelines. Two clean tests per line.' },
  {
    value: 'hard',
    label: 'Hard',
    description: 'All lines, and the level test picks a random branch, so every reply must be known. Three clean tests per line.',
  },
];

export default function OpeningScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const opening = loadOpening(id);

  if (!opening) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: true, title: 'Not found' }} />
        <Text style={styles.description}>Opening {`"${id}"`} not found.</Text>
      </View>
    );
  }
  return <OpeningDetails opening={opening} />;
}

function OpeningDetails({ opening }: { opening: Opening }) {
  const { progress, loaded, setDifficulty } = useProgress();
  const { difficulty } = openingProgress(progress, opening.id);
  const levels = levelStatuses(opening, progress);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: opening.name }} />
      <Text style={styles.description}>
        {opening.description} You play {opening.side === 'white' ? 'White' : 'Black'}.
      </Text>

      <View style={styles.segmented}>
        {DIFFICULTIES.map(({ value, label }) => (
          <Pressable
            key={value}
            onPress={() => setDifficulty(opening.id, value)}
            style={[styles.segment, value === difficulty && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, value === difficulty && styles.segmentTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>{DIFFICULTIES.find((d) => d.value === difficulty)?.description}</Text>

      {loaded &&
        levels.map((level) => (
          <LevelCard key={level.level} opening={opening} level={level} difficulty={difficulty} />
        ))}
    </ScrollView>
  );
}

function LevelCard({ opening, level, difficulty }: { opening: Opening; level: LevelStatus; difficulty: Difficulty }) {
  const mastered = level.lines.filter((l) => l.mastered).length;
  const status = !level.unlocked
    ? `Locked: complete level ${level.level - 1} to unlock`
    : level.lines.length === 0
      ? 'No lines on this difficulty'
      : level.complete
        ? 'Complete ✓'
        : `${mastered} of ${level.lines.length} mastered`;

  return (
    <View style={[styles.card, !level.unlocked && styles.locked]}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelTitle}>Level {level.level}</Text>
        <Text style={[styles.levelStatus, level.complete && level.unlocked && styles.good]}>{status}</Text>
      </View>

      {level.unlocked && (
        <>
          {level.lines.map((line) => (
            <LineRow key={line.line.id} opening={opening} status={line} difficulty={difficulty} />
          ))}
          {difficulty === 'hard' && level.lines.length > 0 && (
            <View style={styles.levelTest}>
              <Button
                label="Test level (random branches)"
                primary
                onPress={() =>
                  router.push({
                    pathname: '/drill',
                    params: { opening: opening.id, level: String(level.level), mode: 'test' },
                  })
                }
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}

function LineRow({ opening, status, difficulty }: { opening: Opening; status: LineStatus; difficulty: Difficulty }) {
  const { line, cleanRuns, mastered } = status;
  const required = REQUIRED_CLEAN_RUNS[difficulty];
  // On Hard, mastery comes from the level test, so lines offer Watch and Practice only.
  const modes: TrainerMode[] = difficulty === 'hard' ? ['watch', 'practice'] : ['watch', 'practice', 'test'];

  return (
    <View style={styles.line}>
      <View style={styles.lineHeader}>
        <Text style={styles.lineName}>{line.name}</Text>
        <Text style={[styles.pips, mastered && styles.good]}>
          {'●'.repeat(Math.min(cleanRuns, required))}
          {'○'.repeat(Math.max(required - cleanRuns, 0))}
        </Text>
      </View>
      <Text style={styles.lineMeta}>
        {line.tier === 'main' ? 'Main line' : 'Sideline'} · {Math.ceil(line.moves.length / 2)} moves
        {mastered ? ' · Mastered' : ''}
      </Text>
      <View style={styles.buttons}>
        {modes.map((mode) => (
          <Button
            key={mode}
            label={mode === 'watch' ? 'Watch' : mode === 'practice' ? 'Practice' : 'Test'}
            primary={mode === 'test' || (difficulty === 'hard' && mode === 'practice')}
            onPress={() =>
              router.push({ pathname: '/drill', params: { opening: opening.id, line: line.id, mode } })
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: theme.background },
  container: { padding: 16, gap: 12, backgroundColor: theme.background, flexGrow: 1 },
  description: { fontSize: 16, fontFamily: theme.font, color: theme.muted },
  hint: { fontSize: 14, fontFamily: theme.font, color: theme.muted, fontStyle: 'italic' },
  segmented: { flexDirection: 'row', borderRadius: 6, borderWidth: 1, borderColor: theme.muted, overflow: 'hidden' },
  segment: { flex: 1, paddingVertical: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: theme.text },
  segmentText: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  segmentTextActive: { color: theme.background },
  card: { backgroundColor: theme.card, borderRadius: 8, padding: 14, gap: 12 },
  locked: { opacity: 0.55 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelTitle: { fontSize: 21, fontFamily: theme.font, color: theme.text },
  levelStatus: { fontSize: 14, fontFamily: theme.font, color: theme.muted, flexShrink: 1, textAlign: 'right' },
  good: { color: theme.good },
  levelTest: { alignItems: 'flex-start' },
  line: { gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.muted, paddingTop: 10 },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineName: { fontSize: 18, fontFamily: theme.font, color: theme.text, flexShrink: 1 },
  pips: { fontSize: 16, color: theme.muted, letterSpacing: 2 },
  lineMeta: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
