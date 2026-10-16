import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Progress } from './mastery';

const KEY = 'progress:v1';

/** Loads saved progress; returns empty progress if there is none or it can't be read. */
export async function loadProgress(): Promise<Progress> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    const parsed: unknown = json ? JSON.parse(json) : null;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as Progress) : {};
  } catch {
    return {};
  }
}

export async function saveProgress(progress: Progress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}
