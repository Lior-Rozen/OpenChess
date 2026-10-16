import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ProgressProvider } from '@/progress/ProgressContext';
import { SettingsProvider } from '@/settings/SettingsContext';
import { theme } from '@/theme';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <StatusBar style="light" />
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
    </SettingsProvider>
  );
}
