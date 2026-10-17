import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { loadOpening } from '@/content/loader';
import type { Opening } from '@/content/types';
import { isLevelOpen, isVariationOpen, toggleLevel, toggleVariation, type Folds } from '@/openings/folds';
import { useFolds } from '@/openings/useFolds';
import {
  groupByVariation,
  levelStatuses,
  suggestedMode,
  type LevelStatus,
  type LineStatus,
  type RunMode,
} from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

const MODES: { mode: RunMode; label: string }[] = [
  { mode: 'watch', label: 'Watch' },
  { mode: 'practice', label: 'Practice' },
  { mode: 'test', label: 'Test' },
];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

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

type FoldProps = { folds: Folds; onFold: (change: (current: Folds) => Folds) => void };

function OpeningDetails({ opening }: { opening: Opening }) {
  const { progress, loaded } = useProgress();
  const [folds, setFolds] = useFolds(opening.id);
  const levels = levelStatuses(opening, progress);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: opening.name }} />
      <Text style={styles.description}>
        {opening.description} You play {opening.side === 'white' ? 'White' : 'Black'}.
      </Text>
      <Text style={styles.hint}>One clean Test masters a line. Master the main lines to unlock the next level.</Text>
      {loaded &&
        levels.map((level) => (
          <LevelCard
            key={level.level}
            opening={opening}
            level={level}
            open={isLevelOpen(folds, level.level, levels)}
            onToggle={() => setFolds((f) => toggleLevel(f, level.level, levels))}
            folds={folds}
            onFold={setFolds}
          />
        ))}
    </ScrollView>
  );
}

type LevelCardProps = FoldProps & { opening: Opening; level: LevelStatus; open: boolean; onToggle: () => void };

function LevelCard({ opening, level, open, onToggle, folds, onFold }: LevelCardProps) {
  const mastered = level.mainLines.filter((l) => l.mastered).length;
  const lineCount = level.mainLines.length + level.bonusLines.length;
  const status = !level.unlocked
    ? `Locked: complete level ${level.level - 1}`
    : level.complete
      ? 'Complete ✓'
      : `${mastered} of ${level.mainLines.length} mastered`;

  return (
    <View style={[styles.card, !level.unlocked && styles.locked]}>
      <Pressable onPress={onToggle} disabled={!level.unlocked} style={styles.levelHeader} hitSlop={8}>
        <Text style={styles.levelTitle}>
          <Text style={styles.chevron}>{open ? '▾ ' : '▸ '}</Text>
          Level {level.level}
          {level.examPassed ? ' ★' : ''}
        </Text>
        <Text style={[styles.levelStatus, level.complete && level.unlocked && styles.good]}>{status}</Text>
      </Pressable>

      {open && (
        <>
          <LineGroups opening={opening} lines={level.mainLines} folds={folds} onFold={onFold} />
          {level.bonusLines.length > 0 && <Text style={styles.sectionLabel}>BONUS LINES</Text>}
          <LineGroups opening={opening} lines={level.bonusLines} folds={folds} onFold={onFold} />
          <View style={styles.exam}>
            <Text style={styles.examText}>
              <Text style={styles.examTitle}>Level {level.level} exam: </Text>
              {level.examPassed
                ? '★ passed.'
                : `all ${plural(lineCount, 'line')}, he picks his replies at random. Earns a ★.`}
            </Text>
            <SmallButton
              label={level.examPassed ? 'Retake' : 'Take exam'}
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

/** Lines grouped by variation, in the order the variations first appear. A variation folds by tapping its name. */
function LineGroups({ opening, lines, folds, onFold }: FoldProps & { opening: Opening; lines: LineStatus[] }) {
  const groups = groupByVariation(lines);
  return groups.map(({ variation, lines: grouped }) => {
    const open = variation === null || isVariationOpen(folds, variation);
    const mastered = grouped.filter((l) => l.mastered).length;
    return (
      <View key={variation ?? '-'}>
        {variation && (
          <Pressable onPress={() => onFold((f) => toggleVariation(f, variation))} style={styles.variationRow} hitSlop={6}>
            <Text style={styles.variation}>
              {open ? '▾ ' : '▸ '}
              {variation}
            </Text>
            {!open && (
              <Text style={styles.variationSummary}>
                {plural(grouped.length, 'line')} · {mastered} mastered
              </Text>
            )}
          </Pressable>
        )}
        {open && grouped.map((line) => <LineRow key={line.line.id} opening={opening} status={line} />)}
      </View>
    );
  });
}

function LineRow({ opening, status }: { opening: Opening; status: LineStatus }) {
  const { line, mastered, progress } = status;
  const suggested = mastered ? null : suggestedMode(progress);

  return (
    <View style={styles.line}>
      <View style={styles.lineTop}>
        <Text style={[styles.dot, mastered && styles.good]}>{mastered ? '●' : '○'}</Text>
        <Text style={styles.lineName} numberOfLines={1}>
          {line.name}
        </Text>
        <Text style={styles.lineMeta}>{plural(Math.ceil(line.moves.length / 2), 'move')}</Text>
      </View>
      <View style={styles.strip}>
        {MODES.map(({ mode, label }, i) => (
          <Pressable
            key={mode}
            onPress={() => router.push({ pathname: '/drill', params: { opening: opening.id, line: line.id, mode } })}
            style={({ pressed }) => [
              styles.segment,
              i > 0 && styles.segmentDivider,
              mode === suggested && styles.segmentSuggested,
              pressed && styles.segmentPressed,
            ]}
          >
            <Text style={[styles.segmentText, mode === suggested && styles.segmentTextSuggested]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallButton, pressed && styles.segmentPressed]}>
      <Text style={styles.segmentText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: theme.background },
  container: { padding: 16, gap: 12, backgroundColor: theme.background, flexGrow: 1 },
  description: { fontSize: 16, fontFamily: theme.font, color: theme.muted },
  hint: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 14, gap: 8 },
  locked: { opacity: 0.55 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  levelTitle: { fontSize: 21, fontFamily: theme.font, color: theme.text },
  chevron: { fontSize: 15, color: theme.muted },
  levelStatus: { fontSize: 14, fontFamily: theme.font, color: theme.muted, flexShrink: 1, textAlign: 'right' },
  good: { color: theme.good },
  sectionLabel: { fontSize: 12, fontFamily: theme.mono, color: theme.accent2, letterSpacing: 1, marginTop: 10 },
  variationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 },
  variation: { fontSize: 15, fontFamily: theme.font, color: theme.accent2 },
  variationSummary: { fontSize: 13, fontFamily: theme.font, color: theme.muted },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingVertical: 8, marginTop: 6 },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { fontSize: 13, color: theme.muted, width: 14, textAlign: 'center' },
  lineName: { flex: 1, fontSize: 17, fontFamily: theme.font, color: theme.text },
  lineMeta: { fontSize: 13, fontFamily: theme.font, color: theme.muted },
  strip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 7,
    marginLeft: 22,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  segment: { paddingVertical: 7, paddingHorizontal: 14, backgroundColor: theme.background },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: theme.border },
  segmentSuggested: { backgroundColor: theme.accent },
  segmentPressed: { opacity: 0.7 },
  segmentText: { fontSize: 14, fontFamily: theme.font, color: theme.text },
  segmentTextSuggested: { color: theme.onAccent, fontFamily: theme.fontSemi },
  exam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    paddingTop: 10,
    marginTop: 8,
  },
  examText: { flex: 1, fontSize: 13, fontFamily: theme.font, color: theme.muted },
  examTitle: { color: theme.text },
  smallButton: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 6,
    backgroundColor: theme.background,
  },
});
