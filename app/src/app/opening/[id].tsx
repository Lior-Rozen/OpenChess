import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { loadOpening } from '@/content/loader';
import type { Opening } from '@/content/types';
import { levelStatuses, suggestedMode, type LevelStatus, type LineStatus, type RunMode } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

const MODES: { mode: RunMode; label: string }[] = [
  { mode: 'watch', label: 'Watch' },
  { mode: 'practice', label: 'Practice' },
  { mode: 'test', label: 'Test' },
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
  const { progress, loaded } = useProgress();
  const levels = levelStatuses(opening, progress);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: opening.name }} />
      <Text style={styles.description}>
        {opening.description} You play {opening.side === 'white' ? 'White' : 'Black'}.
      </Text>
      <Text style={styles.hint}>
        Master every main line with one clean Test to unlock the next level. Bonus lines and the level exam are
        optional.
      </Text>
      {loaded && levels.map((level) => <LevelCard key={level.level} opening={opening} level={level} />)}
    </ScrollView>
  );
}

function LevelCard({ opening, level }: { opening: Opening; level: LevelStatus }) {
  const mastered = level.mainLines.filter((l) => l.mastered).length;
  const status = !level.unlocked
    ? `Locked: complete level ${level.level - 1}`
    : level.complete
      ? 'Complete ✓'
      : `${mastered} of ${level.mainLines.length} mastered`;

  return (
    <View style={[styles.card, !level.unlocked && styles.locked]}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelTitle}>
          Level {level.level}
          {level.examPassed ? ' ★' : ''}
        </Text>
        <Text style={[styles.levelStatus, level.complete && level.unlocked && styles.good]}>{status}</Text>
      </View>

      {level.unlocked && (
        <>
          {level.mainLines.map((line) => (
            <LineRow key={line.line.id} opening={opening} status={line} />
          ))}
          {level.bonusLines.length > 0 && <Text style={styles.sectionLabel}>Bonus lines</Text>}
          {level.bonusLines.map((line) => (
            <LineRow key={line.line.id} opening={opening} status={line} />
          ))}
          <View style={styles.exam}>
            <Text style={styles.examText}>
              {level.examPassed
                ? '★ Exam passed. Every branch, clean.'
                : 'Exam: every line of this level, branches picked at random, no help. Optional, earns a ★.'}
            </Text>
            <Button
              label={level.examPassed ? 'Retake exam' : 'Take the exam'}
              onPress={() =>
                router.push({ pathname: '/drill', params: { opening: opening.id, level: String(level.level) } })
              }
            />
          </View>
        </>
      )}
    </View>
  );
}

function LineRow({ opening, status }: { opening: Opening; status: LineStatus }) {
  const { line, mastered, progress } = status;
  const suggested = mastered ? null : suggestedMode(progress);

  return (
    <View style={styles.line}>
      <View style={styles.lineHeader}>
        <Text style={styles.lineName}>{line.name}</Text>
        <Text style={[styles.badge, mastered && styles.good]}>{mastered ? '● Mastered' : '○'}</Text>
      </View>
      <Text style={styles.lineMeta}>{Math.ceil(line.moves.length / 2)} moves</Text>
      <View style={styles.buttons}>
        {MODES.map(({ mode, label }) => (
          <Button
            key={mode}
            label={label}
            primary={mode === suggested}
            onPress={() => router.push({ pathname: '/drill', params: { opening: opening.id, line: line.id, mode } })}
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
  card: { backgroundColor: theme.card, borderRadius: 8, padding: 14, gap: 12 },
  locked: { opacity: 0.55 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelTitle: { fontSize: 21, fontFamily: theme.font, color: theme.text },
  levelStatus: { fontSize: 14, fontFamily: theme.font, color: theme.muted, flexShrink: 1, textAlign: 'right' },
  good: { color: theme.good },
  sectionLabel: { fontSize: 13, fontFamily: 'monospace', color: theme.muted, letterSpacing: 1, marginTop: 4 },
  line: { gap: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.muted, paddingTop: 10 },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineName: { fontSize: 18, fontFamily: theme.font, color: theme.text, flexShrink: 1 },
  badge: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  lineMeta: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6 },
  exam: {
    gap: 8,
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.muted,
    paddingTop: 10,
  },
  examText: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
});
