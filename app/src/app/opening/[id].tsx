import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Badge, Icon, IconButton, InfoSheet, ProgressBar, type InfoStep } from '@/components/ui';
import { loadOpening } from '@/content/loader';
import type { Opening } from '@/content/types';
import { firstMoves } from '@/openings/filter';
import { isLevelOpen, isVariationOpen, toggleLevel, toggleVariation, variationKey, type Folds } from '@/openings/folds';
import { stageRows, stageSteps, type Stage } from '@/openings/stages';
import { useFolds } from '@/openings/useFolds';
import { levelStatuses, nextLineTarget, suggestedMode, type LevelStatus, type RunMode } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

const MODES: { mode: RunMode; label: string }[] = [
  { mode: 'watch', label: 'Watch' },
  { mode: 'practice', label: 'Practice' },
  { mode: 'test', label: 'Test' },
];

/** The "How it works" sheet behind the ⓘ: every explanation the screen used to print. */
const HOW_IT_WORKS: InfoStep[] = [
  { icon: 'grid-outline', title: 'Stages', text: 'Each tile is one line. Tap it to see what it teaches and to play it.' },
  { icon: 'eye-outline', title: 'Watch', text: 'See the line played, with a note on the key moves.' },
  { icon: 'create-outline', title: 'Practice', text: 'Play it yourself. Hints if you need them.' },
  { icon: 'checkmark', title: 'Test', text: 'No hints. One clean run masters the line.' },
  {
    icon: 'star',
    title: 'Unlock and exam',
    text: 'Master the main lines to open the next level. The exam mixes them for a ★. Dashed tiles are bonus lines: extra, never required.',
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
  const [card, setCard] = useState<Stage | null>(null);
  const levels = levelStatuses(opening, progress);
  const nextLineId = nextLineTarget(opening, progress, '')?.lineId ?? null;
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
            nextLineId={nextLineId}
            open={isLevelOpen(folds, level.level, levels)}
            onToggle={() => setFolds((f) => toggleLevel(f, level.level, levels))}
            onStage={setCard}
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
      <LineCard opening={opening} stage={card} onClose={() => setCard(null)} />
    </ScrollView>
  );
}

type LevelCardProps = FoldProps & {
  opening: Opening;
  level: LevelStatus;
  nextLineId: string | null;
  open: boolean;
  onToggle: () => void;
  onStage: (stage: Stage) => void;
};

function LevelCard({ opening, level, nextLineId, open, onToggle, onStage, folds, onFold }: LevelCardProps) {
  const mastered = level.mainLines.filter((l) => l.mastered).length;
  const total = level.mainLines.length;
  const rows = stageRows(level, nextLineId);

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

      {/* A locked level shows its tiles dimmed, as a preview; nothing in it can be opened. */}
      {(open || !level.unlocked) &&
        rows.map(({ variation, stages }) => {
          const key = variation === null ? null : variationKey(level.level, false, variation);
          const rowOpen = !level.unlocked || key === null || isVariationOpen(folds, key);
          const done = stages.filter((s) => s.status.mastered).length;
          return (
            <View key={variation ?? '-'}>
              {variation && (
                <Pressable
                  onPress={() => key && onFold((f) => toggleVariation(f, key))}
                  disabled={!level.unlocked}
                  style={styles.variationRow}
                  hitSlop={6}
                >
                  {level.unlocked && <Icon name={rowOpen ? 'chevron-down' : 'chevron-forward'} size={12} />}
                  <Text style={styles.variation} numberOfLines={1}>
                    {variation}
                  </Text>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>
                      {done}/{stages.length}
                    </Text>
                  </View>
                </Pressable>
              )}
              {rowOpen && (
                <View style={styles.tiles}>
                  {stages.map((stage) => (
                    <StageTile key={stage.status.line.id} stage={stage} onPress={() => onStage(stage)} />
                  ))}
                </View>
              )}
            </View>
          );
        })}

      {open && (
        <View style={styles.exam}>
          <Icon name="star" size={16} color={theme.gold} />
          <View style={styles.examText}>
            <Text style={styles.examTitle}>Level exam</Text>
            <Text style={styles.examSub}>
              {level.examPassed ? 'Passed' : `All ${plural(total, 'main line')}, random replies`}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/drill', params: { opening: opening.id, level: String(level.level) } })}
            style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
          >
            <Text style={styles.smallButtonText}>{level.examPassed ? 'Retake' : 'Start'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const TILE_LOOK = {
  mastered: { box: { backgroundColor: 'rgba(0, 230, 170, 0.13)', borderColor: theme.good }, text: theme.good },
  next: { box: { backgroundColor: theme.accent, borderColor: theme.accent, boxShadow: theme.glow }, text: theme.onAccent },
  started: { box: { backgroundColor: theme.background, borderColor: theme.accent }, text: theme.text },
  new: { box: { backgroundColor: theme.background, borderColor: theme.border }, text: theme.text },
  locked: { box: { backgroundColor: theme.background, borderColor: theme.pressed }, text: theme.border },
} as const;

/** One line as a numbered tile: its colour is its state, the dots are Watch / Practice / Test. */
function StageTile({ stage, onPress }: { stage: Stage; onPress: () => void }) {
  const look = TILE_LOOK[stage.state];
  const steps = stageSteps(stage.status);
  return (
    <Pressable
      onPress={onPress}
      disabled={stage.state === 'locked'}
      accessibilityLabel={`Stage ${stage.number}: ${stage.status.line.name}${stage.bonus ? ', bonus' : ''}`}
      style={({ pressed }) => [styles.tile, look.box, stage.bonus && styles.tileBonus, pressed && styles.pressed]}
    >
      <Text style={[styles.tileNumber, { color: look.text }]}>{stage.number}</Text>
      {stage.state === 'mastered' ? (
        <Icon name="checkmark" size={12} color={theme.good} />
      ) : stage.state === 'next' ? (
        <Text style={[styles.tileLabel, { color: look.text }]}>next</Text>
      ) : stage.state === 'locked' ? (
        <Icon name="lock-closed" size={11} color={theme.border} />
      ) : (
        <View style={styles.tileDots}>
          {steps.map((on, i) => (
            <View key={i} style={[styles.tileDot, on && { backgroundColor: theme.accent }]} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

/** The card a tile opens: what the line is, what it teaches, how far it's come, and its three modes. */
function LineCard({ opening, stage, onClose }: { opening: Opening; stage: Stage | null; onClose: () => void }) {
  if (!stage) return null;
  const { line, mastered, progress } = stage.status;
  const suggested = mastered ? null : suggestedMode(progress);
  const steps = stageSteps(stage.status);
  const kicker = [
    `${opening.name.split(':')[0]} ${stage.number}`,
    ...(line.variation ? [line.variation] : []),
    ...(stage.bonus ? ['Bonus'] : []),
  ]
    .join(' · ')
    .toUpperCase();

  function play(mode: RunMode) {
    onClose();
    router.push({ pathname: '/drill', params: { opening: opening.id, line: line.id, mode } });
  }

  return (
    <InfoSheet visible onClose={onClose} kicker={kicker} title={line.name}>
      <Text style={styles.cardMeta}>{plural(Math.ceil(line.moves.length / 2), 'move')}</Text>
      {line.summary && (
        <View style={styles.tip}>
          <Icon name="bulb-outline" size={16} color={theme.gold} />
          <Text style={styles.tipText}>{line.summary}</Text>
        </View>
      )}
      <View style={styles.steps}>
        {['Watched', 'Practised', 'Mastered'].map((label, i) => (
          <View key={label} style={styles.step}>
            <View style={[styles.stepBar, steps[i] && styles.stepBarOn]} />
            <Text style={styles.stepText}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.actions}>
        {MODES.map(({ mode, label }) => (
          <View key={mode} style={styles.action}>
            <Button label={label} primary={mode === suggested} onPress={() => play(mode)} />
          </View>
        ))}
      </View>
    </InfoSheet>
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
  variationRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 10 },
  variation: { flex: 1, fontSize: 14.5, fontFamily: theme.fontSemi, color: theme.accent2 },
  pill: { backgroundColor: theme.pressed, borderRadius: 9, paddingVertical: 2, paddingHorizontal: 8 },
  pillText: { fontSize: 12, fontFamily: theme.fontMedium, color: theme.muted },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tileBonus: { borderStyle: 'dashed' },
  tileNumber: { fontSize: 17, fontFamily: theme.fontBold },
  tileLabel: { fontSize: 10, fontFamily: theme.fontSemi },
  tileDots: { flexDirection: 'row', gap: 3 },
  tileDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.border },
  pressed: { opacity: 0.7 },
  exam: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
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
  cardMeta: { fontSize: 13, fontFamily: theme.font, color: theme.muted, marginTop: 2 },
  tip: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: theme.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontFamily: theme.font, color: theme.text },
  steps: { flexDirection: 'row', gap: 6, marginTop: 14 },
  step: { flex: 1, alignItems: 'center', gap: 4 },
  stepBar: { alignSelf: 'stretch', height: 4, borderRadius: 2, backgroundColor: theme.pressed },
  stepBarOn: { backgroundColor: theme.good },
  stepText: { fontSize: 11, fontFamily: theme.font, color: theme.muted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  action: { flex: 1 },
});
