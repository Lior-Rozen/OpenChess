import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { recordRun, setDifficulty, type Difficulty, type Progress } from './mastery';
import { loadProgress, saveProgress } from './storage';

type ProgressContextValue = {
  progress: Progress;
  /** False until saved progress has been read from the device. */
  loaded: boolean;
  /** Records a finished run; returns the progress from before and after it. */
  recordRun: (
    openingId: string,
    lineId: string,
    run: { mode: 'practice' | 'test'; clean: boolean },
  ) => { before: Progress; after: Progress };
  setDifficulty: (openingId: string, difficulty: Difficulty) => void;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

/** Holds the user's progress for the whole app and saves every change to the device. */
export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>({});
  const [loaded, setLoaded] = useState(false);
  // The latest progress, so back-to-back updates build on each other rather than on a stale render.
  const latest = useRef<Progress>({});

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((saved) => {
      if (cancelled) return;
      latest.current = saved;
      setProgress(saved);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(change: (current: Progress) => Progress): { before: Progress; after: Progress } {
    const before = latest.current;
    const after = change(before);
    latest.current = after;
    setProgress(after);
    saveProgress(after).catch((error) => console.warn('Saving progress failed', error));
    return { before, after };
  }

  const value: ProgressContextValue = {
    progress,
    loaded,
    recordRun: (openingId, lineId, run) => update((current) => recordRun(current, openingId, lineId, run)),
    setDifficulty: (openingId, difficulty) => {
      update((current) => setDifficulty(current, openingId, difficulty));
    },
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside <ProgressProvider>');
  return value;
}
