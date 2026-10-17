import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { NO_FOLDS, parseFolds, type Folds } from './folds';

const KEY = 'ui:folds:v1';

/** The opening screen's open/closed levels and variations, remembered on the device per opening. */
export function useFolds(openingId: string): [Folds, (change: (current: Folds) => Folds) => void] {
  const [all, setAll] = useState<Record<string, Folds>>({});

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((json) => {
        if (!cancelled && json) setAll(parseFolds(JSON.parse(json)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function update(change: (current: Folds) => Folds) {
    setAll((current) => {
      const next = { ...current, [openingId]: change(current[openingId] ?? NO_FOLDS) };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

  return [all[openingId] ?? NO_FOLDS, update];
}
