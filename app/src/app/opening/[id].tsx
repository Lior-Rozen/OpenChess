import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge, Icon, IconButton, InfoSheet, ProgressBar, type InfoStep } from '@/components/ui';
import { loadOpening } from '@/content/loader';
import type { Opening } from '@/content/types';
import { firstMoves } from '@/openings/filter';
import { isLevelOpen, isVariationOpen, toggleLevel, toggleVariation, variationKey, type Folds } from '@/openings/folds';
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

/** The "How it works" sheet behind the ⓘ: every explanation the screen used to print. */
const HOW_IT_WORKS: InfoStep[] = [
  { icon: 'eye-outline', title: 'Watch', text: 'See the line played, with a note on the key moves.' },
  { icon: 'create-outline', title: 'Practice', text: 'Play it yourself. Hints if you need them.' },
  { icon: 'checkmark', title: 'Test', text: 'No hints. One clean run masters the line.' },
  {
    icon: 'star',
    title: 'Unlock and exam',
    text: 'Master the main lines to open the next level. The exam mixes them for a ★. Bonus lines are extra.',
    color: theme.gold,
  },
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
  const [info, setInfo] = useState(false);
  const levels = levelStatuses(opening, progress);
  const side = opening.side === 'white' ? 'White' : 'Black';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: opening.name,
          headerRight: () => <IconButton name="information-outline" label="How it works" onPress={() => setInfo(true)} />,
        }}
      />
      <View style={styles.badges}>
        <Badge label={side.toUpperCase()} tone="light" />
        {firstMoves(opening).map((m) => (
          <Badge key={m} label={`1.${m}`} />
        ))}
        {(opening.tags ?? []).map((t) => (
          <Badge key={t} label={t} />
        ))}
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {opening.description}
      </Text>

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

      <InfoSheet
        visible={info}
        onClose={() => setInfo(false)}
        title="How it works"
        intro={`${opening.name}: ${opening.description} You play ${side}.`}
        steps={HOW_IT_WORKS}
      />
    </ScrollView>
  );
}

type LevelCardProps = FoldProps & { opening: Opening; level: LevelStatus; open: boolean; onToggle: () => void };

function LevelCard({ opening, level, open, onToggle, folds, onFold }: LevelCardProps) {
  const mastered = level.mainLines.filter((l) => l.mastered).length;
  const total = level.mainLines.length;

  return (
    <View style={[styles.card, !level.unlocked && styles.locked]}>
      <Pressable onPress={onToggle} disabled={!level.unlocked} style={styles.levelHeader} hitSlop={8}>
        <Icon name={open ? 'chevron-down' : 'chevron-forward'} size={14} />
        <Text style={styles.levelTitle}>Level {level.level}</Text>
        {level.examPassed && <Icon name="star" size={14} color={theme.gold} />}
        <View style={styles.spacer} />
        {level.unlocked ? (
          <>
            <ProgressBar share={total ? mastered / total : 0} />
            <Text style={[styles.count, level.complete && styles.good]}>
              {mastered}/{total}
            </Text>
          </>
        ) : (
          <View style={styles.lockRow}>
            <Icon name="lock-closed" size={12} />
            <Text style={styles.lockText}>Finish level {level.level - 1}</Text>
          </View>
        )}
      </Pressable>

      {open && (
        <>
          <LineGroups opening={opening} level={level.level} bonus={false} lines={level.mainLines} folds={folds} onFold={onFold} />
          {level.bonusLines.length > 0 && (
            <View style={styles.divider}>
              <Text style={styles.dividerText}>BONUS</Text>
              <View style={styles.dividerLine} />
            </View>
          )}
          <LineGroups opening={opening} level={level.level} bonus lines={level.bonusLines} folds={folds} onFold={onFold} />
          <View style={styles.exam}>
            <Icon name="star" size={16} color={theme.gold} />
            <View style={styles.examText}>
              <Text style={styles.examTitle}>Level exam</Text>
              <Text style={styles.examSub}>
                {level.examPassed ? 'Passed' : `All ${plural(total, 'main line')}, random replies`}
              </Text>
            </View>
            <SmallButton
              label={level.examPassed ? 'Retake' : 'Start'}
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
type LineGroupsProps = FoldProps & { opening: Opening; level: number; bonus: boolean; lines: LineStatus[] };

function LineGroups({ opening, level, bonus, lines, folds, onFold }: LineGroupsProps) {
  const groups = groupByVariation(lines);
  return groups.map(({ variation, lines: grouped }) => {
    const key = variation === null ? null : variationKey(level, bonus, variation);
    const open = key === null || isVariationOpen(folds, key);
    const mastered = grouped.filter((l) => l.mastered).length;
    return (
      <View key={variation ?? '-'}>
        {variation && key && (
          <Pressable onPress={() => onFold((f) => toggleVariation(f, key))} style={styles.variationRow} hitSlop={6}>
            <Icon name={open ? 'chevron-down' : 'chevron-forward'} size={12} />
            <Text style={styles.variation} numberOfLines={1}>
              {variation}
            </Text>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                {mastered}/{grouped.length}
              </Text>
            </View>
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
        <View style={[styles.dot, mastered && styles.dotOn]} />
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
              pressed && styles.pressed,
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
    <Pressable onPress={onPress} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: theme.background },
  container: { padding: 16, gap: 12, backgroundColor: theme.background, flexGrow: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  description: { fontSize: 14, lineHeight: 20, fontFamily: theme.font, color: theme.muted, marginBottom: 2 },
  card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14 },
  locked: { opacity: 0.6 },
  levelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelTitle: { fontSize: 17, fontFamily: theme.fontSemi, color: theme.text },
  spacer: { flex: 1 },
  count: { fontSize: 13, fontFamily: theme.fontMedium, color: theme.muted, minWidth: 30, textAlign: 'right' },
  good: { color: theme.good },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockText: { fontSize: 13, fontFamily: theme.font, color: theme.muted },
  variationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 2 },
  variation: { flex: 1, fontSize: 14.5, fontFamily: theme.fontSemi, color: theme.accent2 },
  pill: { backgroundColor: theme.pressed, borderRadius: 9, paddingVertical: 2, paddingHorizontal: 8 },
  pillText: { fontSize: 12, fontFamily: theme.fontMedium, color: theme.muted },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  dividerText: { fontSize: 11, fontFamily: theme.fontSemi, letterSpacing: 1, color: theme.muted },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.border },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingVertical: 9, marginTop: 4 },
  lineTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: theme.muted },
  dotOn: { backgroundColor: theme.good, borderColor: theme.good },
  lineName: { flex: 1, fontSize: 15, fontFamily: theme.fontMedium, color: theme.text },
  lineMeta: { fontSize: 12, fontFamily: theme.font, color: theme.muted },
  strip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 17,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 9,
    overflow: 'hidden',
  },
  segment: { paddingVertical: 6, paddingHorizontal: 13, backgroundColor: theme.background },
  segmentDivider: { borderLeftWidth: 1, borderLeftColor: theme.border },
  segmentSuggested: { backgroundColor: theme.accent },
  pressed: { opacity: 0.7 },
  segmentText: { fontSize: 13, fontFamily: theme.fontMedium, color: theme.text },
  segmentTextSuggested: { color: theme.onAccent, fontFamily: theme.fontSemi },
  exam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: theme.background,
  },
  examText: { flex: 1 },
  examTitle: { fontSize: 14, fontFamily: theme.fontSemi, color: theme.text },
  examSub: { fontSize: 12, fontFamily: theme.font, color: theme.muted, marginTop: 1 },
  smallButton: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 9,
    backgroundColor: theme.card,
  },
  smallButtonText: { fontSize: 14, fontFamily: theme.fontSemi, color: theme.text },
});
