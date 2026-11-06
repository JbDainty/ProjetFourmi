import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
} from 'expo-audio';
import { createAudioLifecycle } from './audioLifecycle';
import { setAudioForeground } from './audioFocus';

export const nativeAudioLifecycle = createAudioLifecycle(
  async () => {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      shouldPlayInBackground: false,
      allowsRecording: false,
      allowsBackgroundRecording: false,
      shouldRouteThroughEarpiece: false,
    });
    await setIsAudioActiveAsync(true);
  },
  () => setIsAudioActiveAsync(false),
  setAudioForeground,
);

export function createGameAudioPlayer(source: Parameters<typeof createAudioPlayer>[0]) {
  return createAudioPlayer(source, { updateInterval: 100, keepAudioSessionActive: true });
}

/** remove() only unregisters an Expo SDK 54 player. release() frees its decoder,
 * native update coroutine and media resources immediately, without waiting for GC. */
export function releaseGameAudioPlayer(player: AudioPlayer | undefined) {
  if (!player) return;
  try {
    player.pause();
  } catch {}
  try {
    player.remove();
  } catch {}
  try {
    player.release();
  } catch {}
}

function waitForPlayer(
  player: AudioPlayer,
  signal: AbortSignal,
  ready: () => boolean,
  timeout: number,
) {
  return new Promise<void>((resolve, reject) => {
    let subscription: { remove: () => void } | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      try {
        subscription?.remove();
      } catch {}
      if (error) reject(error);
      else resolve();
    };
    const abort = () => finish(Error('Audio cancelled'));
    const check = () => {
      try {
        if (signal.aborted) abort();
        else if (ready()) finish();
      } catch {
        finish(Error('Audio player unavailable'));
      }
    };
    if (signal.aborted) {
      abort();
      return;
    }
    signal.addEventListener('abort', abort, { once: true });
    subscription = player.addListener('playbackStatusUpdate', check);
    if (finished) {
      subscription.remove();
      return;
    }
    timer = setTimeout(() => finish(Error('Audio playback timed out')), timeout);
    check();
  });
}

/** Playback is confirmed, rather than inferred from a call to play(). */
export async function startGameAudioPlayer(player: AudioPlayer, signal: AbortSignal, position = 0) {
  if (!(await nativeAudioLifecycle.ensureReady()) || signal.aborted)
    throw Error('Audio session inactive');
  await waitForPlayer(player, signal, () => player.isLoaded, 2000);
  if (signal.aborted) throw Error('Audio cancelled');
  if (position > 0) {
    const offset =
      player.duration > 0
        ? player.loop
          ? position % player.duration
          : Math.min(position, Math.max(0, player.duration - 0.01))
        : position;
    await player.seekTo(offset);
  }
  if (signal.aborted) throw Error('Audio cancelled');
  player.play();
  await waitForPlayer(player, signal, () => player.playing, 1200);
}
