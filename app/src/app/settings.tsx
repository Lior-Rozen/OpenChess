import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchServerMessage } from '@/api/hello';
import { theme } from '@/theme';

/** Placeholder: sounds, haptics and the Mastermind's chatter switches arrive in phase 6. */
export default function Settings() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: true, title: 'Settings' }} />
      <Text style={styles.text}>More settings are coming: sounds, haptics, and how much the Mastermind talks.</Text>
      <View style={styles.section}>
        <Text style={styles.label}>ABOUT</Text>
        <ServerStatus />
      </View>
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
  screen: { flex: 1, backgroundColor: theme.background, padding: 16, gap: 20 },
  section: { gap: 6 },
  label: { fontSize: 12, fontFamily: 'monospace', color: theme.muted, letterSpacing: 1 },
  text: { fontSize: 16, fontFamily: theme.font, color: theme.text },
});
