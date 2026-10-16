import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { contentIndex, loadLine, loadOpening } from '@/content/loader';
import { GREETING } from '@/mastermind/lines';
import { MastermindAvatar } from '@/mastermind/Avatar';
import { continueTarget } from '@/progress/mastery';
import { useProgress } from '@/progress/ProgressContext';
import { theme } from '@/theme';

const MODE_LABELS = { watch: 'Watch', practice: 'Practice', test: 'Test' };

export default function Home() {
  const { progress, loaded } = useProgress();
  const next = loaded ? continueTarget(contentIndex, loadOpening, progress) : null;
  const nextLine = next ? loadLine(next.openingId, next.lineId) : null;

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={styles.settings}>
        <Text style={styles.settingsIcon}>⚙</Text>
      </Pressable>

      <View style={styles.hero}>
        <MastermindAvatar size={96} />
        <Text style={styles.greeting}>{GREETING}</Text>
        <Text style={styles.title}>Chess Openings</Text>
      </View>

      <View style={styles.actions}>
        {loaded && (
          <Pressable
            onPress={() =>
              next
                ? router.push({
                    pathname: '/drill',
                    params: { opening: next.openingId, line: next.lineId, mode: next.mode },
                  })
                : router.push('/openings')
            }
            style={({ pressed }) => [styles.main, pressed && styles.mainPressed]}
          >
            <Text style={styles.mainLabel}>{next ? 'Continue' : 'All mastered'}</Text>
            <Text style={styles.mainDetail}>
              {nextLine && next
                ? `${nextLine.opening.name} · ${nextLine.line.name} · ${MODE_LABELS[next.mode]}`
                : 'Every line is yours. Pick an opening to revisit.'}
            </Text>
          </Pressable>
        )}
        <MenuButton label="Openings" onPress={() => router.push('/openings')} />
        <MenuButton label="Free board" onPress={() => router.push('/free-board')} />
      </View>
    </View>
  );
}

function MenuButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menu, pressed && styles.menuPressed]}>
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background, padding: 24, justifyContent: 'center' },
  settings: { position: 'absolute', top: 52, right: 20 },
  settingsIcon: { fontSize: 28, color: theme.muted },
  hero: { alignItems: 'center', gap: 6, marginBottom: 40 },
  greeting: { fontSize: 18, fontFamily: 'monospace', color: theme.muted, marginTop: 8 },
  title: { fontSize: 34, fontFamily: theme.font, color: theme.text },
  actions: { gap: 12 },
  main: { backgroundColor: theme.text, borderRadius: 10, paddingVertical: 18, paddingHorizontal: 20, gap: 4 },
  mainPressed: { backgroundColor: theme.muted },
  mainLabel: { fontSize: 24, fontFamily: theme.font, color: theme.background, textAlign: 'center' },
  mainDetail: { fontSize: 14, fontFamily: theme.font, color: theme.pressed, textAlign: 'center' },
  menu: { borderWidth: 1, borderColor: theme.muted, borderRadius: 10, paddingVertical: 14 },
  menuPressed: { backgroundColor: theme.pressed },
  menuLabel: { fontSize: 19, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
});
