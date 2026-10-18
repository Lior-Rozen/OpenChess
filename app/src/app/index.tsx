import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui';
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
  // Before the first line is played there's nothing to continue: the main button picks an opening.
  const started = Object.values(progress).some((o) => Object.values(o.lines).some((l) => l.lastPlayed));
  const next = loaded && started ? continueTarget(contentIndex, loadOpening, progress) : null;
  const nextLine = next ? loadLine(next.openingId, next.lineId) : null;

  return (
    <View style={styles.screen}>
      <Pressable onPress={() => router.push('/settings')} hitSlop={12} style={styles.settings} accessibilityLabel="Settings">
        <Icon name="settings-outline" size={24} />
      </Pressable>

      <View style={styles.hero}>
        <MastermindAvatar size={96} />
        <Text style={styles.greeting}>
          {GREETING}
          <BlinkingCursor />
        </Text>
        <Text style={styles.title}>OpenChess</Text>
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
                  <OpeningIcon openingId={next.openingId} size={24} />
                </View>
              )}
              <Text style={styles.mainLabel}>{next ? 'Continue' : started ? 'All mastered' : 'Pick an opening'}</Text>
            </View>
            <Text style={styles.mainDetail}>
              {nextLine && next
                ? `${nextLine.opening.name} · ${nextLine.line.name} · ${MODE_LABELS[next.mode]}`
                : started
                  ? 'Every line is yours.'
                  : 'Start with your first line.'}
            </Text>
          </Pressable>
        )}
        {started && <MenuButton icon="library-outline" label="Openings" onPress={() => router.push('/openings')} />}
        {loaded && <MenuButton icon="shuffle" label="Random drill" onPress={() => startRandomDrill(progress)} />}
        <MenuButton icon="grid-outline" label="Free board" onPress={() => router.push('/free-board')} />
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

function MenuButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menu, pressed && styles.menuPressed]}>
      <Icon name={icon} size={20} color={theme.accent2} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-forward" size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background, padding: 24, justifyContent: 'center' },
  settings: { position: 'absolute', top: 52, right: 20 },
  hero: { alignItems: 'center', gap: 6, marginBottom: 40 },
  greeting: {
    fontSize: 18,
    fontFamily: theme.mono,
    color: theme.accent2,
    marginTop: 8,
    textShadowColor: theme.accent2,
    textShadowRadius: 8,
  },
  title: { fontSize: 32, fontFamily: theme.fontBold, color: theme.text, letterSpacing: -0.5 },
  actions: { gap: 12 },
  main: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 3,
    boxShadow: theme.glow,
  },
  mainPressed: { opacity: 0.8 },
  mainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  mainIcon: { backgroundColor: theme.background, borderRadius: 6, padding: 3 },
  mainLabel: { fontSize: 19, fontFamily: theme.fontSemi, color: theme.onAccent, textAlign: 'center' },
  mainDetail: { fontSize: 13, fontFamily: theme.font, color: theme.onAccent, opacity: 0.85, textAlign: 'center' },
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuPressed: { backgroundColor: theme.pressed },
  menuLabel: { flex: 1, fontSize: 17, fontFamily: theme.fontMedium, color: theme.text },
});
