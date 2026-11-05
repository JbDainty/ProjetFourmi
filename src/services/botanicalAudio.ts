import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { createAudioPlayer } from 'expo-audio';
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
    let player: ReturnType<typeof createAudioPlayer> | undefined;
    let subscription: { remove: () => void } | undefined;
    let fallback: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      release();
      active.delete(stop);
      clearTimeout(fallback);
      try {
        voice?.disconnect();
        gain?.disconnect();
      } catch {}
      try {
        subscription?.remove();
        player?.pause();
        player?.remove();
      } catch {}
    };
    const stop = () => {
      if (cancelled || done) return;
      cancelled = true;
      const context = Platform.OS === 'web' ? sharedAudioContext() : undefined;
      if (voice && gain && context?.state === 'running') {
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
      void prepare()?.then((decoded) => {
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
        } catch {
          finish();
        }
      });
      // Audio support is optional; no pending cue may hold a duck indefinitely.
      fallback = setTimeout(finish, 12000);
    } else {
      try {
        player = createAudioPlayer(source);
        player.volume = volume;
        player.loop = false;
        subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) finish();
        });
        release = duckMusic(attenuation);
        player.play();
        fallback = setTimeout(finish, 12000);
      } catch {
        finish();
      }
    }
    return stop;
  }
  return { prepare, play };
}
