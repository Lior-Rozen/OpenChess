import { router, Stack } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { contentIndex, loadOpening } from '@/content/loader';
import type { Opening, Side } from '@/content/types';
import {
  filterChoices,
  filterOpenings,
  firstMoves,
  isFiltering,
  NO_FILTER,
  toggle,
  type OpeningFilter,
} from '@/openings/filter';
import { OpeningIcon } from '@/openings/OpeningIcon';
import { masteredShare } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

// The content is bundled and never changes while the app runs.
const OPENINGS = contentIndex.openings.map((e) => loadOpening(e.id)).filter((o): o is Opening => o !== null);
const CHOICES = filterChoices(OPENINGS);
const SIDES: { side: Side; label: string; heading: string }[] = [
  { side: 'white', label: 'As White', heading: 'AS WHITE' },
  { side: 'black', label: 'As Black', heading: 'AS BLACK' },
];

export default function Openings() {
  const [filter, setFilter] = useState<OpeningFilter>(NO_FILTER);
  const shown = filterOpenings(OPENINGS, filter);
  const filtering = isFiltering(filter);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'Openings' }} />

      <View style={styles.filters}>
        <ChipGroup label="SIDE">
          {SIDES.map(({ side, label }) => (
            <Chip
              key={side}
              label={label}
              selected={filter.sides.includes(side)}
              onPress={() => setFilter((f) => ({ ...f, sides: toggle(f.sides, side) }))}
            />
          ))}
          {filtering && <Chip label="Clear" dashed onPress={() => setFilter(NO_FILTER)} />}
        </ChipGroup>
        <ChipGroup label="FIRST MOVE">
          {CHOICES.firstMoves.map((move) => (
            <Chip
              key={move}
              label={`1.${move}`}
              selected={filter.firstMoves.includes(move)}
              onPress={() => setFilter((f) => ({ ...f, firstMoves: toggle(f.firstMoves, move) }))}
            />
          ))}
        </ChipGroup>
        {CHOICES.tags.length > 0 && (
          <ChipGroup label="STYLE">
            {CHOICES.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                selected={filter.tags.includes(tag)}
                onPress={() => setFilter((f) => ({ ...f, tags: toggle(f.tags, tag) }))}
              />
            ))}
          </ChipGroup>
        )}
      </View>

      {shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nothing matches all of these.</Text>
          <Chip label="Clear filters" dashed onPress={() => setFilter(NO_FILTER)} />
        </View>
      ) : (
        SIDES.map(({ side, heading }) => {
          const list = shown.filter((o) => o.side === side);
          if (list.length === 0) return null;
          return (
            <View key={side} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{heading}</Text>
                <Text style={styles.sectionLabel}>{list.length}</Text>
              </View>
              <View style={styles.grid}>
                {list.map((opening) => (
                  <OpeningCard key={opening.id} opening={opening} />
                ))}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function OpeningCard({ opening }: { opening: Opening }) {
  const { progress } = useProgress();
  const share = Math.round(masteredShare(opening, progress) * 100);
  const details = [firstMoves(opening).map((m) => `1.${m}`).join('/'), ...(opening.tags ?? [])].join(' · ');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/opening/[id]', params: { id: opening.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <OpeningIcon openingId={opening.id} size={40} />
      <Text style={styles.cardTitle}>{opening.name}</Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${share}%` }]} />
      </View>
      <Text style={styles.cardMeta}>{share}% mastered</Text>
      <Text style={styles.cardDetails}>{details}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.background },
  content: { padding: 16, paddingBottom: 32, gap: 8 },
  filters: { gap: 10, marginBottom: 4 },
  group: { gap: 6 },
  groupLabel: { fontSize: 11, fontFamily: theme.mono, color: theme.accent2, letterSpacing: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  section: { gap: 8, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sectionLabel: { fontSize: 12, fontFamily: theme.mono, color: theme.muted, letterSpacing: 1 },
  // Two cards per row; an odd last card stays half width.
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  card: {
    width: '48%',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  cardPressed: { backgroundColor: theme.pressed },
  cardTitle: { fontSize: 18, fontFamily: theme.font, color: theme.text },
  cardMeta: { fontSize: 13, fontFamily: theme.font, color: theme.muted },
  cardDetails: { fontSize: 10, fontFamily: theme.mono, color: theme.muted, marginTop: 2 },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.pressed, overflow: 'hidden', marginTop: 2 },
  barFill: { height: 6, backgroundColor: theme.accent, boxShadow: theme.glow },
  empty: { alignItems: 'center', gap: 14, paddingVertical: 40 },
  emptyText: { fontSize: 16, fontFamily: theme.font, fontStyle: 'italic', color: theme.muted },
});
