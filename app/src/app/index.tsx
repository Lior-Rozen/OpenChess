import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { contentIndex, loadLine, loadOpening } from '@/content/loader';
import { GREETING } from '@/mastermind/lines';
import { MastermindAvatar } from '@/mastermind/Avatar';
import { OpeningIcon } from '@/openings/OpeningIcon';
import { startRandomDrill } from '@/drill/random';
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
        <Text style={styles.greeting}>
          {GREETING}
          <BlinkingCursor />
        </Text>
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
            <View style={styles.mainRow}>
              {next && (
                <View style={styles.mainIcon}>
                  <OpeningIcon openingId={next.openingId} size={28} />
                </View>
              )}
              <Text style={styles.mainLabel}>{next ? 'Continue' : 'All mastered'}</Text>
            </View>
            <Text style={styles.mainDetail}>
              {nextLine && next
                ? `${nextLine.opening.name} · ${nextLine.line.name} · ${MODE_LABELS[next.mode]}`
                : 'Every line is yours. Pick an opening to revisit.'}
            </Text>
          </Pressable>
        )}
        {loaded && <MenuButton label="Random drill" onPress={() => startRandomDrill(progress)} />}
        <MenuButton label="Openings" onPress={() => router.push('/openings')} />
        <MenuButton label="Free board" onPress={() => router.push('/free-board')} />
      </View>
    </View>
  );
}

/** A retro terminal cursor after the greeting. */
function BlinkingCursor() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(timer);
  }, []);
  return <Text style={{ opacity: visible ? 1 : 0 }}>_</Text>;
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
  greeting: {
    fontSize: 18,
    fontFamily: theme.mono,
    color: theme.accent2,
    marginTop: 8,
    textShadowColor: theme.accent2,
    textShadowRadius: 8,
  },
  title: { fontSize: 34, fontFamily: theme.font, color: theme.text },
  actions: { gap: 12 },
  main: {
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 4,
    boxShadow: theme.glow,
  },
  mainPressed: { opacity: 0.8 },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mainIcon: { backgroundColor: theme.background, borderRadius: 6, padding: 3 },
  mainLabel: { fontSize: 24, fontFamily: theme.font, fontWeight: '600', color: theme.onAccent, textAlign: 'center' },
  mainDetail: { fontSize: 14, fontFamily: theme.font, color: theme.onAccent, opacity: 0.85, textAlign: 'center' },
  menu: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    paddingVertical: 14,
  },
  menuPressed: { backgroundColor: theme.pressed },
  menuLabel: { fontSize: 19, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
});
