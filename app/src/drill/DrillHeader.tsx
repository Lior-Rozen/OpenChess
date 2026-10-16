import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OpeningIcon } from '@/openings/OpeningIcon';
import { theme } from '@/theme';

import type { DrillTarget } from './shared';

/** The drill screen's header: the opening's icon and name above the line (or exam) being drilled. */
export function DrillHeader({ target }: { target: DrillTarget }) {
  return <Stack.Screen options={{ headerShown: true, headerTitle: () => <Title target={target} /> }} />;
}

function Title({ target }: { target: DrillTarget }) {
  return (
    <View style={styles.row}>
      <OpeningIcon openingId={target.opening.id} size={28} />
      <View style={styles.text}>
        <Text style={styles.opening} numberOfLines={1}>
          {target.opening.name}
        </Text>
        <Text style={styles.line} numberOfLines={1}>
          {target.title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  text: { flexShrink: 1 },
  opening: { fontSize: 13, fontFamily: theme.mono, color: theme.muted },
  line: { fontSize: 18, fontFamily: theme.font, color: theme.text },
});
