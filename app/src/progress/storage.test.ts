import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadProgress, saveProgress } from './storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('progress storage', () => {
  beforeEach(() => AsyncStorage.clear());

  it('returns empty progress when nothing is saved', async () => {
    await expect(loadProgress()).resolves.toEqual({});
  });

  it('saves and loads progress', async () => {
    const progress = { french: { difficulty: 'normal' as const, lines: { a: { cleanRuns: 2 } } } };
    await saveProgress(progress);

    await expect(loadProgress()).resolves.toEqual(progress);
  });

  it('ignores corrupt data', async () => {
    await AsyncStorage.setItem('progress:v1', '{not json');
    await expect(loadProgress()).resolves.toEqual({});

    await AsyncStorage.setItem('progress:v1', '[1,2]');
    await expect(loadProgress()).resolves.toEqual({});
  });
});
