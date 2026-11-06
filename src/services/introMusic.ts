import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import {
  createGameAudioPlayer,
  releaseGameAudioPlayer,
  startGameAudioPlayer,
  nativeAudioLifecycle,
} from './nativeAudio';
import { sharedAudioContext } from './audioContext';
import { audioIsForeground, musicAttenuation, observeAudioFocus } from './audioFocus';
import { scoreSession, type ScoreVoice } from './scoreSession';

export const introScore = require('../../assets/music/prologue.mp3');
export const introScoreVolume = 0.2;

function voice() {
  let setLevel = (value: number) => {};
  let result: ScoreVoice;
  if (Platform.OS === 'web') {
    const context = sharedAudioContext();
    const buffer = context
      ? fetch(Asset.fromModule(introScore).uri)
          .then((response) => {
            if (!response.ok) throw Error('Intro score unavailable');
            return response.arrayBuffer();
          })
          .then((bytes) => context.decodeAudioData(bytes))
      : Promise.resolve(undefined);
    // Preparation is allowed before the browser grants audio playback.
    void buffer.catch(() => {});
    let source: AudioBufferSourceNode | undefined, gain: GainNode | undefined;
    const pause = () => {
      const old = source,
        level = gain;
      source = undefined;
      gain = undefined;
      if (!old || !level || !context) return;
      old.onended = null;
      if (context.state === 'running' && audioIsForeground()) {
        const now = context.currentTime;
        level.gain.cancelScheduledValues(now);
        level.gain.setValueAtTime(level.gain.value, now);
        level.gain.linearRampToValueAtTime(0, now + 0.06);
        try {
          old.stop(now + 0.07);
        } catch {}
        setTimeout(() => {
          old.disconnect();
          level.disconnect();
        }, 100);
      } else {
        try {
          old.stop();
        } catch {}
        old.disconnect();
        level.disconnect();
      }
    };
    setLevel = (value) => {
      if (gain && context) gain.gain.setTargetAtTime(value, context.currentTime, 0.04);
    };
    result = {
      async play(position, valid) {
        const decoded = await buffer;
        if (!valid() || !decoded || !context) return false;
        if (context.state !== 'running') {
          let timer: ReturnType<typeof setTimeout> | undefined;
          try {
            // A browser can leave resume() pending until the first gesture.
            // Keep the explicit "wake music" control available in that case.
            await Promise.race([
              context.resume(),
              new Promise<void>((resolve) => {
                timer = setTimeout(resolve, 100);
              }),
            ]);
          } catch {
          } finally {
            clearTimeout(timer);
          }
        }
        if (!valid() || context.state !== 'running') return false;
        pause();
        source = context.createBufferSource();
        gain = context.createGain();
        source.buffer = decoded;
        source.loop = false;
        gain.gain.value = introScoreVolume * musicAttenuation();
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0, Math.min(position, Math.max(0, decoded.duration - 0.01)));
        return true;
      },
      pause,
      dispose: pause,
    };
  } else {
    let player: ReturnType<typeof createGameAudioPlayer> | undefined =
      createGameAudioPlayer(introScore);
    let abort: AbortController | undefined;
    const retiring = new Map<
      ReturnType<typeof createGameAudioPlayer>,
      ReturnType<typeof setInterval>
    >();
    const clearRetiring = () => {
      retiring.forEach((timer, old) => {
        clearInterval(timer);
        releaseGameAudioPlayer(old);
      });
      retiring.clear();
    };
    const pause = () => {
      abort?.abort();
      abort = undefined;
      const old = player;
      player = undefined;
      if (!old) return;
      if (!audioIsForeground()) {
        releaseGameAudioPlayer(old);
        return;
      }
      let from: number;
      try {
        from = old.volume;
      } catch {
        releaseGameAudioPlayer(old);
        return;
      }
      let step = 0;
      const timer = setInterval(() => {
        step++;
        try {
          old.volume = from * Math.max(0, 1 - step / 4);
        } catch {
          step = 4;
        }
        if (step >= 4) {
          clearInterval(timer);
          retiring.delete(old);
          releaseGameAudioPlayer(old);
        }
      }, 20);
      retiring.set(old, timer);
    };
    setLevel = (value) => {
      if (!audioIsForeground()) clearRetiring();
      try {
        if (player) player.volume = value;
      } catch {}
    };
    result = {
      async play(position, valid) {
        if (abort) pause();
        clearRetiring();
        if (!player) player = createGameAudioPlayer(introScore);
        const next = player;
        const controller = new AbortController();
        abort = controller;
        try {
          next.loop = false;
          next.volume = introScoreVolume * musicAttenuation();
          await startGameAudioPlayer(next, controller.signal, position);
        } catch (error) {
          if (player === next) {
            player = undefined;
            abort = undefined;
            controller.abort();
            releaseGameAudioPlayer(next);
          }
          throw error;
        }
        if (!valid() || !audioIsForeground()) {
          if (player === next) pause();
          return false;
        }
        return true;
      },
      pause,
      dispose() {
        abort?.abort();
        abort = undefined;
        releaseGameAudioPlayer(player);
        player = undefined;
        clearRetiring();
      },
    };
  }
  return { ...result, level: setLevel };
}

export function createIntroMusic(
  position: () => number,
  status: (value: 'idle' | 'playing' | 'blocked') => void,
) {
  let requested = false;
  const player = voice();
  const session = scoreSession(player, position, status);
  const apply = () => {
    player.level(introScoreVolume * musicAttenuation());
    session.setActive(requested && audioIsForeground());
  };
  const unobserve = observeAudioFocus(apply);
  return {
    sync(active: boolean) {
      requested = active;
      apply();
    },
    async unlock() {
      if (Platform.OS === 'web') {
        const context = sharedAudioContext();
        if (context?.state === 'suspended') await context.resume().catch(() => {});
      } else await nativeAudioLifecycle.ensureReady();
      session.retry();
    },
    dispose() {
      unobserve();
      session.dispose();
    },
  };
}
