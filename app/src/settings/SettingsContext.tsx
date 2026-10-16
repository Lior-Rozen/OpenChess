import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, parseSettings, type Settings } from './settings';

const KEY = 'settings:v1';

type SettingsContextValue = { settings: Settings; update: (change: Partial<Settings>) => void };

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Holds the user's settings for the whole app and saves every change to the device. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((json) => {
        if (!cancelled && json) setSettings(parseSettings(JSON.parse(json)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function update(change: Partial<Settings>) {
    setSettings((current) => {
      const next = { ...current, ...change };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch((error) => console.warn('Saving settings failed', error));
      return next;
    });
  }

  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside <SettingsProvider>');
  return value;
}
