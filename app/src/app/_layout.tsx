import { Stack } from 'expo-router';

import { ProgressProvider } from '@/progress/ProgressContext';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <ProgressProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontFamily: theme.font },
          contentStyle: { backgroundColor: theme.background },
        }}
      />
    </ProgressProvider>
  );
}
