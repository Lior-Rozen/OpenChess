import { Stack } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { fetchServerMessage } from '@/api/hello';
import { useProgress } from '@/progress/ProgressContext';
import { useSettings } from '@/settings/SettingsContext';
import { theme } from '@/theme';

/** How long "Reset progress" must be held, in milliseconds. */
const RESET_HOLD_MS = 2000;

export default function Settings() {
  const { settings, update } = useSettings();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />

      <Section label="SOUND & FEEL">
        <Toggle label="Sounds" value={settings.sound} onChange={(sound) => update({ sound })} />
        <Toggle label="Vibration" value={settings.haptics} onChange={(haptics) => update({ haptics })} />
        <Text style={styles.hint}>Muted when the phone is on silent.</Text>
      </Section>

      <Section label="THE MASTERMIND">
        <Toggle label="He talks" value={settings.talk} onChange={(talk) => update({ talk })} />
        {!settings.talk && <Text style={styles.hint}>He still plays. Silently.</Text>}
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
      <View style={styles.card}>{children}</View>
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
        {done ? 'Progress reset.' : 'Erases all progress.'}
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
        ? 'Server: offline'
        : `Server says: ${serverMessage}`;
  return <Text style={styles.text}>{status}</Text>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  content: { padding: 16, gap: 28 },
  section: { gap: 8 },
  card: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 14, gap: 10 },
  label: { fontSize: 11, fontFamily: theme.fontSemi, color: theme.muted, letterSpacing: 1, marginLeft: 4 },
  text: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  hint: { fontSize: 13, fontFamily: theme.font, color: theme.muted },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  resetText: { fontSize: 15, fontFamily: theme.fontSemi, color: theme.bad },
});
