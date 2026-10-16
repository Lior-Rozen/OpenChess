import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { theme } from '@/theme';

import { drillStyles } from './shared';

type Props = {
  title: string;
  outcome: string;
  tone: 'good' | 'bad' | null;
  /** Good news worth calling out, e.g. "Line mastered!". */
  highlights?: string[];
  notes?: string[];
  buttons: { label: string; onPress: () => void; primary?: boolean }[];
};

/** The card shown when a run ends. */
export function ResultCard({ title, outcome, tone, highlights = [], notes = [], buttons }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.result, tone && drillStyles[tone]]}>{outcome}</Text>
      {highlights.map((text) => (
        <Text key={text} style={[styles.result, drillStyles.good]}>
          {text}
        </Text>
      ))}
      {notes.map((text) => (
        <Text key={text} style={drillStyles.note}>
          {text}
        </Text>
      ))}
      <View style={styles.buttons}>
        {buttons.map((b) => (
          <Button key={b.label} label={b.label} primary={b.primary} onPress={b.onPress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  title: { fontSize: 22, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
  result: { fontSize: 17, fontFamily: theme.font, color: theme.text, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
});
