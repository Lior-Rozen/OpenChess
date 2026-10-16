import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { preloadSounds } from '@/feedback/feedback';
import { ProgressProvider } from '@/progress/ProgressContext';
import { SettingsProvider } from '@/settings/SettingsContext';
import { theme } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    preloadSounds();
  }, []);

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
