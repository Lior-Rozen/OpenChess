import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fetchServerMessage } from '@/api/hello';
import { contentIndex } from '@/content/loader';

export default function Index() {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello friend</Text>
      <Text style={styles.status}>{status}</Text>
      {contentIndex.openings.map((opening) => (
        <Link
          key={opening.id}
          href={{ pathname: '/opening/[id]', params: { id: opening.id } }}
          style={[styles.link, styles.opening]}
        >
          {opening.name}
        </Link>
      ))}
      <Link href="/dev" style={styles.link}>
        Free play board (dev)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0e9d6',
    padding: 24,
  },
  title: {
    fontSize: 44,
    fontFamily: 'serif',
    color: '#2f3a2f',
    marginBottom: 16,
  },
  status: {
    fontSize: 18,
    fontFamily: 'serif',
    color: '#5b6b5b',
  },
  link: {
    marginTop: 40,
    fontSize: 18,
    fontFamily: 'serif',
    color: '#2f3a2f',
    textDecorationLine: 'underline',
  },
  opening: { fontSize: 24 },
});
