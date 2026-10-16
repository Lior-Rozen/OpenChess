import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fetchServerMessage } from '@/api/hello';
import { contentIndex, loadOpening } from '@/content/loader';
import { masteredShare, openingProgress } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };

export default function Home() {
  const { progress } = useProgress();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Chess Openings</Text>
      <Text style={styles.subtitle}>Learn them by the book.</Text>

      <View style={styles.grid}>
        {contentIndex.openings.map((entry) => {
          const opening = loadOpening(entry.id);
          if (!opening) return null;
          const share = Math.round(masteredShare(opening, progress) * 100);
          const { difficulty } = openingProgress(progress, opening.id);
          return (
            <Pressable
              key={opening.id}
              onPress={() => router.push({ pathname: '/opening/[id]', params: { id: opening.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            >
              <Text style={styles.cardTitle}>{opening.name}</Text>
              <Text style={styles.cardMeta}>As {opening.side === 'white' ? 'White' : 'Black'}</Text>
              <View style={styles.bar}>
                <View style={[styles.barFill, { width: `${share}%` }]} />
              </View>
              <Text style={styles.cardMeta}>
                {share}% mastered · {DIFFICULTY_LABELS[difficulty]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <ServerStatus />
        <Link href="/dev" style={styles.footerLink}>
          Free play board (dev)
        </Link>
      </View>
    </ScrollView>
  );
}

/** Shows whether the optional backend is reachable. The app never needs it. */
function ServerStatus() {
  // undefined = still loading, null = offline, string = the server's answer
  const [serverMessage, setServerMessage] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetchServerMessage(process.env.EXPO_PUBLIC_API_URL).then((message) => {
      if (!cancelled) setServerMessage(message);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const status =
    serverMessage === undefined
      ? 'Server says: …'
      : serverMessage === null
        ? 'Server offline'
        : `Server says: ${serverMessage}`;
  return <Text style={styles.footerText}>{status}</Text>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.background },
  content: { padding: 16, paddingTop: 64, flexGrow: 1 },
  title: { fontSize: 36, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
  subtitle: { fontSize: 17, fontFamily: theme.font, color: theme.muted, textAlign: 'center', marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  cardPressed: { backgroundColor: theme.pressed },
  cardTitle: { fontSize: 20, fontFamily: theme.font, color: theme.text },
  cardMeta: { fontSize: 14, fontFamily: theme.font, color: theme.muted },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.pressed, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: theme.good },
  footer: { marginTop: 'auto', paddingTop: 40, alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, fontFamily: theme.font, color: theme.muted },
  footerLink: { fontSize: 13, fontFamily: theme.font, color: theme.muted, textDecorationLine: 'underline' },
});
