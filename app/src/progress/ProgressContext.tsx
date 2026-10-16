import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { recordExam, recordRun, type Progress, type RunMode } from './mastery';
import { loadProgress, saveProgress } from './storage';

type Change = { before: Progress; after: Progress };

type ProgressContextValue = {
  progress: Progress;
  /** False until saved progress has been read from the device. */
  loaded: boolean;
  /** Records a run played to the end; returns the progress from before and after it. */
  recordRun: (openingId: string, lineId: string, run: { mode: RunMode; clean: boolean }) => Change;
  recordExam: (openingId: string, level: number) => Change;
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

  function update(change: (current: Progress) => Progress): Change {
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
    recordExam: (openingId, level) => update((current) => recordExam(current, openingId, level)),
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext);
  if (!value) throw new Error('useProgress must be used inside <ProgressProvider>');
  return value;
}
