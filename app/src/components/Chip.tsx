import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme';

type Props = { label: string; selected?: boolean; dashed?: boolean; onPress: () => void };

/** A small rounded toggle, e.g. a filter. Selected chips glow magenta. */
export function Chip({ label, selected = false, dashed = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        dashed && styles.dashed,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Text style={[styles.text, dashed && styles.dashedText, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  pressed: { backgroundColor: theme.pressed },
  selected: { backgroundColor: theme.accent, borderColor: theme.accent, boxShadow: theme.glow },
  dashed: { borderStyle: 'dashed', backgroundColor: 'transparent' },
  text: { fontSize: 14, fontFamily: theme.font, color: theme.text },
  selectedText: { color: theme.onAccent },
  dashedText: { color: theme.muted },
});
