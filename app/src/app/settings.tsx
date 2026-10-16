import { Stack } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { fetchServerMessage } from '@/api/hello';
import { Chip } from '@/components/Chip';
import { useProgress } from '@/progress/ProgressContext';
import { useSettings } from '@/settings/SettingsContext';
import type { Chatter } from '@/settings/settings';
import { theme } from '@/theme';

const CHATTER: { value: Chatter; label: string; detail: string }[] = [
  { value: 'normal', label: 'Normal', detail: 'He speaks at key moments: mistakes, hints, results.' },
  { value: 'minimal', label: 'Minimal', detail: 'Only when a run starts and ends.' },
  { value: 'silent', label: 'Silent', detail: 'Not a word. His speech bubble is hidden.' },
];

/** How long "Reset progress" must be held, in milliseconds. */
const RESET_HOLD_MS = 2000;

export default function Settings() {
  const { settings, update } = useSettings();
  const chatter = CHATTER.find((c) => c.value === settings.chatter) ?? CHATTER[0];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />

      <Section label="SOUND & FEEL">
        <Toggle label="Sounds" value={settings.sound} onChange={(sound) => update({ sound })} />
        <Toggle label="Vibration" value={settings.haptics} onChange={(haptics) => update({ haptics })} />
        <Text style={styles.hint}>On moves, mistakes and finished lines. Sounds stay quiet when the phone is on silent.</Text>
      </Section>

      <Section label="THE MASTERMIND">
        <View style={styles.chips}>
          {CHATTER.map((c) => (
            <Chip key={c.value} label={c.label} selected={settings.chatter === c.value} onPress={() => update({ chatter: c.value })} />
          ))}
        </View>
        <Text style={styles.hint}>{chatter.detail}</Text>
      </Section>

      <Section label="PROGRESS">
        <HoldToReset />
      </Section>

      <Section label="ABOUT">
        <ServerStatus />
      </Section>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.text}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.pressed, true: theme.accent }}
        thumbColor={value ? theme.text : theme.muted}
      />
    </View>
  );
}

/** Wipes all progress, but only after a 2-second press, so it can't happen by accident. */
function HoldToReset() {
  const { resetProgress } = useProgress();
  const [fill] = useState(() => new Animated.Value(0));
  const [done, setDone] = useState(false);

  function start() {
    setDone(false);
    Animated.timing(fill, { toValue: 1, duration: RESET_HOLD_MS, useNativeDriver: false }).start();
  }

  function cancel() {
    fill.stopAnimation();
    Animated.timing(fill, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  }

  function reset() {
    resetProgress();
    setDone(true);
    fill.setValue(0);
  }

  return (
    <View style={styles.resetBlock}>
      <Pressable
        onPressIn={start}
        onPressOut={cancel}
        onLongPress={reset}
        delayLongPress={RESET_HOLD_MS}
        accessibilityHint="Press and hold for two seconds to erase all progress"
        style={styles.reset}
      >
        <Animated.View
          style={[styles.resetFill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
        />
        <Text style={styles.resetText}>Hold to reset progress</Text>
      </Pressable>
      <Text style={styles.hint}>
        {done ? 'Progress reset. Every line starts fresh.' : 'Erases every mastered line and exam star. Hold for 2 seconds.'}
      </Text>
    </View>
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
        ? 'Server offline (not needed to train)'
        : `Server says: ${serverMessage}`;
  return <Text style={styles.text}>{status}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, gap: 28 },
  section: { gap: 10 },
  label: { fontSize: 12, fontFamily: theme.mono, color: theme.accent2, letterSpacing: 1 },
  text: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  hint: { fontSize: 14, fontFamily: theme.font, fontStyle: 'italic', color: theme.muted },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  resetBlock: { gap: 8 },
  reset: {
    borderWidth: 1,
    borderColor: theme.bad,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
  },
  resetFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: theme.bad, opacity: 0.45 },
  resetText: { fontSize: 16, fontFamily: theme.font, color: theme.bad },
});
