import { StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

import { MastermindAvatar } from './Avatar';

/** The Mastermind's avatar with what he's saying next to it. With talk switched off (null), just "…". */
export function MastermindSpeech({ text }: { text: string | null }) {
  return (
    <View style={styles.row}>
      <MastermindAvatar size={40} />
      <View style={styles.bubble}>
        <Text style={styles.name}>THE MASTERMIND</Text>
        <Text style={[styles.text, text === null && styles.silent]}>{text ?? '…'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', paddingHorizontal: 4 },
  bubble: {
    flex: 1,
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    borderLeftWidth: 3,
    borderLeftColor: theme.accent2,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  name: { fontSize: 12, fontFamily: theme.mono, color: theme.accent2, letterSpacing: 1 },
  text: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  silent: { color: theme.muted },
});
