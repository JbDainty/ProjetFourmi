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

export const ambienceTracks = [
  { title: 'Clairière d’ivoire', source: require('../../assets/music/prairies.mp3') },
  { title: 'Murmures du sous-bois', source: require('../../assets/music/sous-bois.mp3') },
  { title: 'Reflets des roseaux', source: require('../../assets/music/zones-humides.mp3') },
  { title: 'Lumière des cimes', source: require('../../assets/music/montagnes.mp3') },
  { title: 'Brise de garrigue', source: require('../../assets/music/mediterranee.mp3') },
  { title: 'Le chant des haies', source: require('../../assets/music/ecosystem-05.mp3') },
  { title: 'Les branches en fleurs', source: require('../../assets/music/ecosystem-06.mp3') },
  { title: 'La terre au matin', source: require('../../assets/music/ecosystem-07.mp3') },
  { title: 'Les parfums tranquilles', source: require('../../assets/music/ecosystem-08.mp3') },
  { title: 'Le sommeil des dunes', source: require('../../assets/music/ecosystem-09.mp3') },
  { title: 'Les bruyères d’ivoire', source: require('../../assets/music/ecosystem-10.mp3') },
  { title: 'L’eau entre les saules', source: require('../../assets/music/ecosystem-11.mp3') },
  { title: 'La lumière des houppiers', source: require('../../assets/music/ecosystem-12.mp3') },
  { title: 'L’ombre des aiguilles', source: require('../../assets/music/ecosystem-13.mp3') },
  { title: 'Les fleurs près de la porte', source: require('../../assets/music/ecosystem-14.mp3') },
  { title: 'La mémoire des pierres', source: require('../../assets/music/ecosystem-15.mp3') },
  { title: 'L’or des moissons', source: require('../../assets/music/ecosystem-16.mp3') },
  { title: 'Les herbes du soleil', source: require('../../assets/music/ecosystem-17.mp3') },
  { title: 'Les chemins retrouvés', source: require('../../assets/music/ecosystem-18.mp3') },
  { title: 'La clairière secrète', source: require('../../assets/music/ecosystem-19.mp3') },
] as const;
export const ambienceVolume = 0.08;
type Voice = { chapter: number; level: (gain: number, ms: number) => void; stop: () => void };
let enabled = false,
  chapter = 0,
  unlocked = false,
  generation = 0;
let current: Voice | undefined;
let recovery: ReturnType<typeof setTimeout> | undefined;
let recoveryAttempts = 0;
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
    let target: string | undefined;
    return {
      chapter: index,
      level(value, ms) {
        if (stopped || target === `${value}:${ms}`) return;
        target = `${value}:${ms}`;
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
  let creating: ReturnType<typeof createGameAudioPlayer> | undefined;
  try {
    const player = createGameAudioPlayer(ambienceTracks[index].source);
    creating = player;
    const abort = new AbortController();
    player.loop = true;
    player.volume = 0;
    let stopped = false,
      fade: ReturnType<typeof setInterval> | undefined;
    let target: string | undefined;
    const offset = positions.get(index) ?? 0;
    let heard = false;
    const fail = () => {
      if (stopped) return;
      voice.stop();
      if (current !== voice) return;
      current = undefined;
      if (desired() && recoveryAttempts < 2) {
        recoveryAttempts++;
        clearTimeout(recovery);
        recovery = setTimeout(() => void reconcile(), recoveryAttempts * 600);
      }
    };
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.playing) heard = true;
      // A system audio-focus interruption can pause a healthy player. Keep it
      // registered so Expo can resume it on focus gain, rather than fighting a call.
    });
    const voice: Voice = {
      chapter: index,
      level(value, ms) {
        if (stopped || target === `${value}:${ms}`) return;
        target = `${value}:${ms}`;
        clearInterval(fade);
        let from: number;
        try {
          from = player.volume;
        } catch {
          fail();
          return;
        }
        const start = Date.now();
        fade = setInterval(() => {
          if (stopped) {
            clearInterval(fade);
            return;
          }
          const p = Math.min(1, (Date.now() - start) / Math.max(1, ms));
          try {
            player.volume = from + (value - from) * p;
          } catch {
            fail();
            return;
          }
          if (p === 1) clearInterval(fade);
        }, 40);
      },
      stop() {
        if (stopped) return;
        stopped = true;
        abort.abort();
        clearInterval(fade);
        try {
          if (heard || player.currentTime > 0) positions.set(index, player.currentTime);
        } catch {}
        try {
          subscription.remove();
        } catch {}
        releaseGameAudioPlayer(player);
      },
    };
    void startGameAudioPlayer(player, abort.signal, offset).catch(fail);
    return voice;
  } catch {
    releaseGameAudioPlayer(creating);
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
function bufferFor(index: number, context: AudioContext) {
  if (!buffers.has(index))
    buffers.set(
      index,
      fetch(Asset.fromModule(ambienceTracks[index].source).uri)
        .then((response) => {
          if (!response.ok) throw Error('Music unavailable');
          return response.arrayBuffer();
        })
        .then((bytes) => context.decodeAudioData(bytes)),
    );
  while (buffers.size > 2) {
    const oldest =
      [...buffers.keys()].find((k) => k !== index && k !== current?.chapter) ??
      [...buffers.keys()].find((k) => k !== index);
    if (oldest === undefined) break;
    buffers.delete(oldest);
  }
  return buffers.get(index)!;
}
/** Decode the opening track while the book is being signed; never play yet. */
export function prepareAmbience(ecosystem: number) {
  if (Platform.OS !== 'web') return;
  const context = sharedAudioContext();
  if (!context) return;
  const index = Math.max(0, Math.min(ambienceTracks.length - 1, ecosystem));
  void bufferFor(index, context).catch(() => buffers.delete(index));
}
let pendingChapter: number | undefined;
async function reconcile() {
  if (!desired()) {
    clearTimeout(recovery);
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
      if (context.state !== 'running') await context.resume();
      buffer = await bufferFor(next, context);
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
let wasForeground = audioIsForeground();
observeAudioFocus(() => {
  if (wasForeground !== audioIsForeground()) {
    wasForeground = audioIsForeground();
    recoveryAttempts = 0;
  }
  void reconcile();
});

export function unlockAmbience() {
  unlocked = true;
  if (Platform.OS === 'web') sharedAudioContext();
  if (Platform.OS === 'web') void reconcile();
  else
    void nativeAudioLifecycle.ensureReady().then((ready) => {
      if (ready) void reconcile();
    });
}
export function configureAmbience(active: boolean, ecosystem: number) {
  const next = Math.max(0, Math.min(ambienceTracks.length - 1, ecosystem));
  if (enabled !== active || chapter !== next) {
    recoveryAttempts = 0;
    generation++;
    pendingChapter = undefined;
  }
  enabled = active;
  chapter = next;
  void reconcile();
}
export function disposeAmbience() {
  clearTimeout(recovery);
  enabled = false;
  generation++;
  pendingChapter = undefined;
  current?.stop();
  current = undefined;
  retiring.forEach((voice) => voice.stop());
  retiring.clear();
}
