import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Badge, Icon, type IconName } from '@/components/ui';
import { theme } from '@/theme';

export type ResultBadge = { label: string; tone: 'good' | 'accent' | 'gold' };

type Props = {
  tone: 'good' | 'bad' | 'neutral';
  title: string;
  /** A short line under the title, e.g. "2 mistakes". */
  outcome?: string;
  /** Good news: CLEAN, MASTERED, LEVEL 2 UNLOCKED… */
  badges?: ResultBadge[];
  /** The line's takeaway. */
  tip?: string;
  /** A small aside, e.g. "Only clean runs count." */
  note?: string;
  buttons: { label: string; onPress: () => void; primary?: boolean }[];
};

const TONES: Record<Props['tone'], { icon: IconName; color: string; tint: string }> = {
  good: { icon: 'checkmark', color: theme.good, tint: 'rgba(0, 230, 170, 0.12)' },
  bad: { icon: 'close', color: theme.bad, tint: 'rgba(255, 71, 102, 0.12)' },
  neutral: { icon: 'eye-outline', color: theme.accent2, tint: 'rgba(0, 229, 255, 0.12)' },
};

/** The card shown when a run ends. */
export function ResultCard({ tone, title, outcome, badges = [], tip, note, buttons }: Props) {
  const t = TONES[tone];
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={[styles.mark, { borderColor: t.color, backgroundColor: t.tint }]}>
          <Icon name={t.icon} size={20} color={t.color} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {outcome && <Text style={styles.outcome}>{outcome}</Text>}
        </View>
      </View>
      {badges.length > 0 && (
        <View style={styles.badges}>
          {badges.map((b) => (
            <Badge key={b.label} label={b.label} tone={b.tone} />
          ))}
        </View>
      )}
      {tip && (
        <View style={styles.tip}>
          <Icon name="bulb-outline" size={16} color={theme.gold} />
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      )}
      {note && <Text style={styles.note}>{note}</Text>}
      <View style={styles.buttons}>
        {buttons.map((b) => (
          <View key={b.label} style={styles.button}>
            <Button label={b.label} primary={b.primary} onPress={b.onPress} />
          </View>
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
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headText: { flex: 1 },
  mark: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontFamily: theme.fontSemi, color: theme.text },
  outcome: { fontSize: 13, fontFamily: theme.font, color: theme.muted, marginTop: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tip: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    backgroundColor: theme.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontFamily: theme.font, color: theme.text },
  note: { fontSize: 13, lineHeight: 18, fontFamily: theme.font, color: theme.muted },
  buttons: { flexDirection: 'row', gap: 8 },
  button: { flex: 1 },
});
