import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { parsePositions, type SavedPosition } from './savedPositions';

const KEY = 'editor:positions:v1';

/** The board editor's saved positions, kept on the device. */
export function useSavedPositions(): [SavedPosition[], (change: (current: SavedPosition[]) => SavedPosition[]) => void] {
  const [list, setList] = useState<SavedPosition[]>([]);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(KEY)
      .then((json) => {
        if (!cancelled && json) setList(parsePositions(JSON.parse(json)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  function update(change: (current: SavedPosition[]) => SavedPosition[]) {
    setList((current) => {
      const next = change(current);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch((error) => console.warn('Saving positions failed', error));
      return next;
    });
  }

  return [list, update];
}
