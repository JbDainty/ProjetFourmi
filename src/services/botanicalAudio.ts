import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { createGameAudioPlayer, releaseGameAudioPlayer, startGameAudioPlayer } from './nativeAudio';
import { sharedAudioContext } from './audioContext';
import { audioIsForeground, duckMusic } from './audioFocus';

const active = new Set<() => void>();
export function stopBotanicalCues() {
  [...active].forEach((stop) => stop());
}

export function createBotanicalCue(source: number, volume: number, attenuation = 0.32) {
  let buffer: Promise<AudioBuffer | undefined> | undefined;
  function prepare() {
    if (Platform.OS !== 'web' || !audioIsForeground()) return;
    const context = sharedAudioContext();
    if (!context) return;
    buffer ??= fetch(Asset.fromModule(source).uri)
      .then((response) => {
        if (!response.ok) throw Error('Audio unavailable');
        return response.arrayBuffer();
      })
      .then((bytes) => context.decodeAudioData(bytes))
      .catch(() => {
        buffer = undefined;
        return undefined;
      });
    return buffer;
  }
  function play(enabled: boolean): () => void {
    if (!enabled || !audioIsForeground()) return () => {};
    let cancelled = false,
      done = false,
      release = () => {};
    let voice: AudioBufferSourceNode | undefined, gain: GainNode | undefined;
    let player: ReturnType<typeof createGameAudioPlayer> | undefined;
    const abort = new AbortController();
    let subscription: { remove: () => void } | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      abort.abort();
      release();
      active.delete(stop);
      clearTimeout(fallback);
      try {
        if (voice) {
          voice.onended = null;
          voice.stop();
        }
        voice?.disconnect();
        gain?.disconnect();
      } catch {}
      try {
        subscription?.remove();
      } catch {}
      releaseGameAudioPlayer(player);
      player = undefined;
      voice = undefined;
      gain = undefined;
    };
    const stop = () => {
      if (cancelled || done) return;
      cancelled = true;
      const context = Platform.OS === 'web' ? sharedAudioContext() : undefined;
      if (voice && gain && context?.state === 'running' && audioIsForeground()) {
        try {
          const now = context.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.02);
          voice.stop(now + 0.025);
          clearTimeout(fallback);
          fallback = setTimeout(finish, 60);
          return;
        } catch {}
      }
      try {
        voice?.stop();
      } catch {}
      finish();
    };
    active.add(stop);
    if (Platform.OS === 'web') {
      const prepared = prepare();
      if (!prepared) {
        finish();
        return stop;
      }
      void prepared.then((decoded) => {
        const context = sharedAudioContext();
        if (
          cancelled ||
          !decoded ||
          !context ||
          context.state !== 'running' ||
          !audioIsForeground()
        ) {
          finish();
          return;
        }
        try {
          voice = context.createBufferSource();
          voice.buffer = decoded;
          gain = context.createGain();
          gain.gain.value = volume;
          voice.connect(gain);
          gain.connect(context.destination);
          release = duckMusic(attenuation);
          voice.onended = finish;
          voice.start();
          clearTimeout(fallback);
          fallback = setTimeout(finish, decoded.duration * 1000 + 300);
        } catch {
          finish();
        }
      });
      // Audio support is optional; no pending cue may hold a duck indefinitely.
      fallback = setTimeout(finish, 12000);
    } else {
      try {
        player = createGameAudioPlayer(source);
        player.volume = volume;
        player.loop = false;
        let heard = false;
        subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (done || cancelled) return;
          if (!audioIsForeground() || status.didJustFinish) {
            finish();
            return;
          }
          if (status.playing && !heard) {
            heard = true;
            release = duckMusic(attenuation);
            clearTimeout(fallback);
            const remaining = Math.max(0, status.duration - status.currentTime);
            fallback = setTimeout(finish, Math.min(12000, remaining * 1000 + 400));
          } else if (heard && !status.playing) {
            // An interrupted one-shot is cancelled, never kept as a silent music duck.
            finish();
          }
        });
        fallback = setTimeout(finish, 4000);
        void startGameAudioPlayer(player, abort.signal).catch(finish);
      } catch {
        finish();
      }
    }
    return stop;
  }
  return { prepare, play };
}
