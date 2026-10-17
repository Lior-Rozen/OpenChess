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
      <View style={[styles.mark, { borderColor: t.color, backgroundColor: t.tint }]}>
        <Icon name={t.icon} size={26} color={t.color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {outcome && <Text style={styles.outcome}>{outcome}</Text>}
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
    borderRadius: 16,
    padding: 16,
    paddingTop: 18,
    gap: 8,
    alignItems: 'center',
  },
  mark: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: theme.fontSemi, color: theme.text, textAlign: 'center' },
  outcome: { fontSize: 14, fontFamily: theme.font, color: theme.muted, textAlign: 'center' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tip: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    backgroundColor: theme.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, fontFamily: theme.font, color: theme.text },
  note: { fontSize: 13, fontFamily: theme.font, color: theme.muted, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
});
