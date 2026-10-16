import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import complete from '@/assets/sounds/complete.wav';
import mistake from '@/assets/sounds/mistake.wav';
import move from '@/assets/sounds/move.wav';
import { useSettings } from '@/settings/SettingsContext';
import type { Settings } from '@/settings/settings';

/** The moments that get a sound and a vibration. */
export type Cue = 'move' | 'mistake' | 'complete';

// Original synthesised sounds (see DESIGN.md), small mono WAVs.
const SOURCES: Record<Cue, number> = { move, mistake, complete };

const players: Partial<Record<Cue, AudioPlayer>> = {};
let audioModeSet = false;

function player(cue: Cue): AudioPlayer {
  if (!audioModeSet) {
    audioModeSet = true;
    // Mix with the user's music instead of pausing it, and stay quiet when the phone is on silent.
    setAudioModeAsync({ interruptionMode: 'mixWithOthers', playsInSilentMode: false }).catch(() => {});
  }
  if (!players[cue]) {
    const p = createAudioPlayer(SOURCES[cue]);
    // Rewind as soon as a sound ends, so the next play() can start at once. Pause first: on
    // Android a finished player still counts as playing, and rewinding it would replay it forever.
    p.addListener('playbackStatusUpdate', (status) => {
      if (!status.didJustFinish) return;
      p.pause();
      p.seekTo(0).catch(() => {});
    });
    players[cue] = p;
  }
  return players[cue];
}

/** Loads the sounds ahead of time, so the first one isn't late. */
export function preloadSounds() {
  for (const cue of Object.keys(SOURCES) as Cue[]) player(cue);
}

/** Plays a cue's sound and vibration, as far as the settings allow. Never throws. */
export function playCue(cue: Cue, settings: Settings) {
  try {
    if (settings.sound) {
      const p = player(cue);
      // Still playing (moves in quick succession): start it over.
      if (p.playing) p.seekTo(0).catch(() => {});
      p.play();
    }
    if (settings.haptics) {
      const haptic =
        cue === 'move'
          ? Haptics.selectionAsync()
          : Haptics.notificationAsync(
              cue === 'mistake' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success,
            );
      haptic.catch(() => {});
    }
  } catch (error) {
    console.warn('Feedback failed', error);
  }
}

/** Returns a function that plays a cue with the current settings. Call it from event handlers and effects. */
export function useFeedback(): (cue: Cue) => void {
  const { settings } = useSettings();
  return (cue) => playCue(cue, settings);
}
