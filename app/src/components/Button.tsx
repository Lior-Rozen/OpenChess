import { Pressable, StyleSheet, Text } from 'react-native';

import { theme } from '@/theme';

type Props = { label: string; onPress: () => void; primary?: boolean; disabled?: boolean };

export function Button({ label, onPress, primary = false, disabled = false }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary && styles.primary,
        pressed && (primary ? styles.primaryPressed : styles.pressed),
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, primary && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.muted,
  },
  pressed: { backgroundColor: theme.pressed },
  primary: { backgroundColor: theme.text, borderColor: theme.text },
  primaryPressed: { backgroundColor: theme.muted },
  disabled: { opacity: 0.4 },
  text: { fontSize: 16, fontFamily: theme.font, color: theme.text },
  primaryText: { color: theme.background },
});
