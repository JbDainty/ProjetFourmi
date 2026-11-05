import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { createAudioPlayer } from 'expo-audio';
import { sharedAudioContext } from './audioContext';
import { audioIsForeground, musicAttenuation, observeAudioFocus } from './audioFocus';

export const ambienceTracks = [
  { title: 'Clairière d’ivoire', source: require('../../assets/music/prairies.mp3') },
  { title: 'Murmures du sous-bois', source: require('../../assets/music/sous-bois.mp3') },
  { title: 'Reflets des roseaux', source: require('../../assets/music/zones-humides.mp3') },
  { title: 'Lumière des cimes', source: require('../../assets/music/montagnes.mp3') },
  { title: 'Brise de garrigue', source: require('../../assets/music/mediterranee.mp3') },
] as const;
export const ambienceVolume = 0.08;
type Voice = { chapter: number; level: (gain: number, ms: number) => void; stop: () => void };
let enabled = false,
  chapter = 0,
  unlocked = false,
  generation = 0;
let current: Voice | undefined;
const retiring = new Set<Voice>();
const buffers = new Map<number, Promise<AudioBuffer>>();
const positions = new Map<number, number>();
const desired = () => enabled && unlocked && audioIsForeground();

function makeVoice(index: number, buffer?: AudioBuffer): Voice | undefined {
  if (Platform.OS === 'web') {
    const context = sharedAudioContext();
    if (!context || context.state !== 'running' || !buffer) return;
    const source = context.createBufferSource(),
      gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(context.destination);
    const offset = (positions.get(index) ?? 0) % buffer.duration,
      started = context.currentTime;
    source.start(0, offset);
    let stopped = false;
    return {
      chapter: index,
      level(value, ms) {
        if (stopped) return;
        const now = context.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(value, now + ms / 1000);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        positions.set(index, (offset + context.currentTime - started) % buffer.duration);
        try {
          source.stop();
          source.disconnect();
          gain.disconnect();
        } catch {}
      },
    };
  }
  try {
    const player = createAudioPlayer(ambienceTracks[index].source);
    player.loop = true;
    player.volume = 0;
    let stopped = false,
      fade: ReturnType<typeof setInterval> | undefined;
    const offset = positions.get(index) ?? 0;
    void (async () => {
      try {
        if (offset) await player.seekTo(offset);
        if (!stopped) player.play();
      } catch {}
    })();
    return {
      chapter: index,
      level(value, ms) {
        clearInterval(fade);
        if (stopped) return;
        const from = player.volume,
          start = Date.now();
        fade = setInterval(() => {
          if (stopped) {
            clearInterval(fade);
            return;
          }
          const p = Math.min(1, (Date.now() - start) / Math.max(1, ms));
          try {
            player.volume = from + (value - from) * p;
          } catch {}
          if (p === 1) clearInterval(fade);
        }, 40);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        clearInterval(fade);
        try {
          positions.set(index, player.currentTime);
          player.pause();
          player.remove();
        } catch {}
      },
    };
  } catch {
    return;
  }
}

function retire(voice: Voice, ms: number) {
  retiring.add(voice);
  voice.level(0, ms);
  setTimeout(() => {
    voice.stop();
    retiring.delete(voice);
  }, ms + 40);
}
function applyLevels() {
  current?.level(ambienceVolume * musicAttenuation(), musicAttenuation() < 1 ? 90 : 1400);
  if (musicAttenuation() < 1) retiring.forEach((voice) => voice.level(0, 90));
}
let pendingChapter: number | undefined;
async function reconcile() {
  if (!desired()) {
    generation++;
    pendingChapter = undefined;
    if (!audioIsForeground()) {
      current?.stop();
      current = undefined;
      retiring.forEach((voice) => voice.stop());
      retiring.clear();
      return;
    }
    if (current) {
      retire(current, 160);
      current = undefined;
    }
    retiring.forEach((voice) => voice.level(0, 160));
    return;
  }
  if (current?.chapter === chapter) {
    applyLevels();
    return;
  }
  if (pendingChapter === chapter) return;
  const token = ++generation,
    next = chapter;
  pendingChapter = next;
  let buffer: AudioBuffer | undefined;
  try {
    if (Platform.OS === 'web') {
      const context = sharedAudioContext();
      if (!context) {
        pendingChapter = undefined;
        return;
      }
      if (context.state === 'suspended') await context.resume();
      if (!buffers.has(next))
        buffers.set(
          next,
          fetch(Asset.fromModule(ambienceTracks[next].source).uri)
            .then((response) => {
              if (!response.ok) throw Error('Music unavailable');
              return response.arrayBuffer();
            })
            .then((bytes) => context.decodeAudioData(bytes)),
        );
      buffer = await buffers.get(next);
    }
    if (token !== generation || !desired() || next !== chapter) return;
    retiring.forEach((old) => old.stop());
    retiring.clear();
    const voice = makeVoice(next, buffer);
    pendingChapter = undefined;
    if (!voice) return;
    // Never accumulate a chain of previous tracks after rapid navigation.
    if (current) retire(current, 1200);
    current = voice;
    voice.level(ambienceVolume * musicAttenuation(), 1200);
    for (const key of buffers.keys()) {
      if (buffers.size <= 2) break;
      if (key !== next) buffers.delete(key);
    }
  } catch {
    buffers.delete(next);
    if (token === generation) pendingChapter = undefined;
  }
}
observeAudioFocus(() => {
  if (desired()) applyLevels();
  void reconcile();
});

export function unlockAmbience() {
  unlocked = true;
  if (Platform.OS === 'web') sharedAudioContext();
  void reconcile();
}
export function configureAmbience(active: boolean, ecosystem: number) {
  const next = Math.max(0, Math.min(4, ecosystem));
  if (enabled !== active || chapter !== next) {
    generation++;
    pendingChapter = undefined;
  }
  enabled = active;
  chapter = next;
  void reconcile();
}
export function disposeAmbience() {
  enabled = false;
  generation++;
  pendingChapter = undefined;
  current?.stop();
  current = undefined;
  retiring.forEach((voice) => voice.stop());
  retiring.clear();
}
