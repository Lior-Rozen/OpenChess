import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { loadOpening } from '@/content/loader';
import { theme } from '@/theme';
import type { TrainerMode } from '@/trainer/trainer';

const MODES: { mode: TrainerMode; label: string }[] = [
  { mode: 'watch', label: 'Watch' },
  { mode: 'practice', label: 'Practice' },
  { mode: 'test', label: 'Test' },
];

/** Lists an opening's lines. (Phase 4 adds levels, the difficulty picker and progress.) */
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

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: opening.name }} />
      <Text style={styles.description}>
        {opening.description} You play {opening.side === 'white' ? 'White' : 'Black'}.
      </Text>
      {opening.lines.map((line) => (
        <View key={line.id} style={styles.card}>
          <Text style={styles.lineName}>{line.name}</Text>
          <Text style={styles.lineMeta}>
            {line.tier === 'main' ? 'Main line' : 'Sideline'} · {Math.ceil(line.moves.length / 2)} moves
          </Text>
          <View style={styles.buttons}>
            {MODES.map(({ mode, label }) => (
              <Button
                key={mode}
                label={label}
                primary={mode === 'practice'}
                onPress={() =>
                  router.push({ pathname: '/drill', params: { opening: opening.id, line: line.id, mode } })
                }
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: theme.background },
  container: { padding: 16, gap: 12, backgroundColor: theme.background, flexGrow: 1 },
  description: { fontSize: 16, fontFamily: theme.font, color: theme.muted, marginBottom: 4 },
  card: { backgroundColor: theme.card, borderRadius: 8, padding: 14, gap: 4 },
  lineName: { fontSize: 19, fontFamily: theme.font, color: theme.text },
  lineMeta: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
