import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { createAudioPlayer } from 'expo-audio';
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
        if (!valid() || !decoded || !context || context.state !== 'running') return false;
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
    const player = createAudioPlayer(introScore);
    player.loop = false;
    player.volume = introScoreVolume * musicAttenuation();
    let fade: ReturnType<typeof setInterval> | undefined;
    const stopFade = () => {
      clearInterval(fade);
      fade = undefined;
    };
    const pause = () => {
      stopFade();
      if (!audioIsForeground()) {
        player.pause();
        return;
      }
      const from = player.volume;
      let step = 0;
      fade = setInterval(() => {
        step++;
        player.volume = from * Math.max(0, 1 - step / 4);
        if (step >= 4) {
          stopFade();
          player.pause();
        }
      }, 20);
    };
    setLevel = (value) => {
      if (!fade) player.volume = value;
    };
    result = {
      async play(position, valid) {
        stopFade();
        await player.seekTo(position);
        if (!valid() || !audioIsForeground()) return false;
        player.volume = introScoreVolume * musicAttenuation();
        player.play();
        return true;
      },
      pause,
      dispose() {
        stopFade();
        player.pause();
        player.remove();
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
      }
      session.retry();
    },
    dispose() {
      unobserve();
      session.dispose();
    },
  };
}
