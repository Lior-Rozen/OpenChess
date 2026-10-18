import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/theme';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** An Ionicons icon (MIT), in the theme's colours. */
export function Icon({ name, size = 16, color = theme.muted }: { name: IconName; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

type BadgeTone = 'plain' | 'light' | 'good' | 'accent' | 'cyan' | 'gold';

/** A small label: a side, a tag, a mode, an outcome. */
export function Badge({ label, tone = 'plain' }: { label: string; tone?: BadgeTone }) {
  return (
    <View style={[styles.badge, badgeTones[tone].box]}>
      <Text style={[styles.badgeText, badgeTones[tone].text]}>{label}</Text>
    </View>
  );
}

const badgeTones: Record<BadgeTone, { box: object; text: object }> = {
  plain: { box: { backgroundColor: theme.pressed }, text: { color: theme.muted } },
  light: { box: { backgroundColor: theme.text }, text: { color: theme.background } },
  good: { box: { backgroundColor: 'rgba(0, 230, 170, 0.14)' }, text: { color: theme.good } },
  accent: { box: { backgroundColor: 'rgba(255, 64, 200, 0.14)' }, text: { color: theme.accent } },
  cyan: { box: { backgroundColor: theme.accent2 }, text: { color: '#00222a' } },
  gold: { box: { backgroundColor: 'rgba(255, 210, 63, 0.14)' }, text: { color: theme.gold } },
};

/** A thin progress bar, 0…1. */
export function ProgressBar({ share, width = 70 }: { share: number; width?: number }) {
  return (
    <View style={[styles.bar, { width }]}>
      <View style={[styles.barFill, { width: `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%` }]} />
    </View>
  );
}

/** A round icon button, e.g. the ⓘ in a header. */
export function IconButton({ name, onPress, label }: { name: IconName; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={8} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Icon name={name} size={18} />
    </Pressable>
  );
}

export type InfoStep = { icon: IconName; title: string; text: string; color?: string };

type InfoSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** A small line above the title, e.g. "VIENNA 1.2 · VIENNA GAMBIT". */
  kicker?: string;
  intro?: string;
  steps?: InfoStep[];
  children?: ReactNode;
};

/** A sheet that slides up from the bottom with an explanation; tap outside it to close. */
export function InfoSheet({ visible, onClose, title, kicker, intro, steps = [], children }: InfoSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.shade} onPress={onClose} accessibilityLabel="Close" />
      <View style={styles.sheet}>
        <View style={styles.grab} />
        {kicker && (
          <Text style={styles.sheetKicker} numberOfLines={1}>
            {kicker}
          </Text>
        )}
        <Text style={styles.sheetTitle}>{title}</Text>
        {intro && <Text style={styles.sheetIntro}>{intro}</Text>}
        {steps.map((step) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepIcon}>
              <Icon name={step.icon} size={16} color={step.color ?? theme.accent2} />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.text}</Text>
            </View>
          </View>
        ))}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontFamily: theme.fontSemi, letterSpacing: 0.6 },
  bar: { height: 6, borderRadius: 3, backgroundColor: theme.pressed, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: theme.accent, boxShadow: theme.glow },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: theme.pressed },
  shade: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  sheet: {
    backgroundColor: theme.card,
    borderTopWidth: 1,
    borderColor: theme.border,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14 },
  sheetKicker: { fontSize: 12, fontFamily: theme.fontSemi, color: theme.accent2, letterSpacing: 0.5, marginBottom: 2 },
  sheetTitle: { fontSize: 18, fontFamily: theme.fontSemi, color: theme.text },
  sheetIntro: { fontSize: 14, lineHeight: 20, fontFamily: theme.font, color: theme.muted, marginTop: 4, marginBottom: 6 },
  step: { flexDirection: 'row', gap: 12, marginTop: 14 },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.pressed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 15, fontFamily: theme.fontSemi, color: theme.text },
  stepBody: { fontSize: 13, lineHeight: 18, fontFamily: theme.font, color: theme.muted, marginTop: 2 },
});
