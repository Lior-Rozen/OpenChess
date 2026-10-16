import { router, Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { contentIndex, loadOpening } from '@/content/loader';
import { OpeningIcon } from '@/openings/OpeningIcon';
import { masteredShare } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

export default function Openings() {
  const { progress } = useProgress();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'Openings' }} />
      <View style={styles.grid}>
        {contentIndex.openings.map((entry) => {
          const opening = loadOpening(entry.id);
          if (!opening) return null;
          const share = Math.round(masteredShare(opening, progress) * 100);
          return (
            <Pressable
              key={opening.id}
              onPress={() => router.push({ pathname: '/opening/[id]', params: { id: opening.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <OpeningIcon openingId={opening.id} size={40} />
              <Text style={styles.cardTitle}>{opening.name}</Text>
              <Text style={styles.cardMeta}>As {opening.side === 'white' ? 'White' : 'Black'}</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${share}%` }]} />
              </View>
              <Text style={styles.cardMeta}>{share}% mastered</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.background },
  content: { padding: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  cardPressed: { backgroundColor: theme.pressed },
  cardTitle: { fontSize: 20, fontFamily: theme.font, color: theme.text },
  cardMeta: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.pressed, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: theme.accent, boxShadow: theme.glow },
});
