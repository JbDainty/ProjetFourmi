import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const backend = vi.hoisted(() => {
  const state = { players: [] as any[], options: [] as any[], neverPlay: false, neverLoad: false };
  const create = (source: any, options: any) => {
    const listeners = new Set<(status: any) => void>();
    const player: any = {
      source,
      volume: 1,
      currentTime: 0,
      duration: source === 42 ? 1 : 60,
      loop: false,
      playing: false,
      isLoaded: !state.neverLoad,
      released: false,
      registered: true,
      releases: 0,
      pauseThrows: false,
      removeThrows: false,
      emit(status: any) {
        if (status.playing !== undefined) player.playing = status.playing;
        if (status.currentTime !== undefined) player.currentTime = status.currentTime;
        for (const listener of [...listeners])
          listener({
            duration: player.duration,
            currentTime: player.currentTime,
            playing: player.playing,
            isBuffering: false,
            didJustFinish: false,
            ...status,
          });
      },
      addListener(_event: string, listener: (status: any) => void) {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      },
      play() {
        if (!state.neverPlay) player.emit({ playing: true });
      },
      pause() {
        if (player.pauseThrows) throw Error('pause failed');
        player.playing = false;
      },
      remove() {
        if (player.removeThrows) throw Error('remove failed');
        // Match SDK 54: unregistering is NOT equivalent to decoder/coroutine release.
        player.registered = false;
      },
      release() {
        player.releases++;
        player.released = true;
      },
      async seekTo(position: number) {
        player.currentTime = position;
      },
      get listenerCount() {
        return listeners.size;
      },
    };
    state.players.push(player);
    state.options.push(options);
    return player;
  };
  return { state, create };
});
vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-asset', () => ({
  Asset: { fromModule: (source: number) => ({ uri: String(source) }) },
}));
vi.mock('expo-audio', () => ({
  createAudioPlayer: backend.create,
  setAudioModeAsync: vi.fn(async () => {}),
  setIsAudioActiveAsync: vi.fn(async () => {}),
}));
import { nativeAudioLifecycle, releaseGameAudioPlayer } from '../src/services/nativeAudio';
import { createBotanicalCue, stopBotanicalCues } from '../src/services/botanicalAudio';
import {
  audioEpoch,
  audioIsForeground,
  duckMusic,
  musicAttenuation,
  setAudioForeground,
} from '../src/services/audioFocus';

let ambience: typeof import('../src/services/ambience');
let intro: typeof import('../src/services/introMusic');
let pours: typeof import('../src/services/pourSound');
let pages: typeof import('../src/services/pageSounds');
const nativeRequire = createRequire(import.meta.url);
const originalMP3 = nativeRequire.extensions['.mp3'];
const originalWAV = nativeRequire.extensions['.wav'];
beforeAll(async () => {
  // Asset resolution alone is mocked. The actual game services run against the native SDK boundary above.
  nativeRequire.extensions['.mp3'] = (module, filename) => {
    module.exports = filename;
  };
  nativeRequire.extensions['.wav'] = nativeRequire.extensions['.mp3'];
  ambience = await import('../src/services/ambience');
  intro = await import('../src/services/introMusic');
  pours = await import('../src/services/pourSound');
  pages = await import('../src/services/pageSounds');
});
afterAll(() => {
  if (originalMP3) nativeRequire.extensions['.mp3'] = originalMP3;
  else delete nativeRequire.extensions['.mp3'];
  if (originalWAV) nativeRequire.extensions['.wav'] = originalWAV;
  else delete nativeRequire.extensions['.wav'];
});
beforeEach(async () => {
  vi.useFakeTimers();
  backend.state.players = [];
  backend.state.options = [];
  backend.state.neverPlay = false;
  backend.state.neverLoad = false;
  await nativeAudioLifecycle.setActive(true);
});
afterEach(async () => {
  stopBotanicalCues();
  ambience.disposeAmbience();
  await nativeAudioLifecycle.setActive(false);
  vi.clearAllTimers();
  vi.useRealTimers();
});
const flush = () => vi.advanceTimersByTimeAsync(0);
const live = () => backend.state.players.filter((player) => !player.released);

it('releases native decoders promptly across hundreds of cues, with music still playing', async () => {
  ambience.unlockAmbience();
  ambience.configureAmbience(true, 0);
  await flush();
  expect(live()).toHaveLength(1);
  await vi.advanceTimersByTimeAsync(1400);
  const cue = createBotanicalCue(42, 0.26, 0.35);
  for (let i = 0; i < 300; i++) {
    cue.play(true);
    await flush();
    expect(live()).toHaveLength(2);
    expect(musicAttenuation()).toBe(0.35);
    backend.state.players.at(-1).emit({ playing: false, didJustFinish: true });
    expect(live()).toHaveLength(1);
    expect(musicAttenuation()).toBe(1);
  }
  for (const player of backend.state.players.slice(1)) {
    expect(player.releases).toBe(1);
    expect(player.listenerCount).toBe(0);
  }
  expect(backend.state.options.every((options) => options.keepAudioSessionActive)).toBe(true);
});

it('does not attenuate music for a cue that never becomes audible', async () => {
  backend.state.neverPlay = true;
  createBotanicalCue(42, 0.2).play(true);
  await flush();
  expect(musicAttenuation()).toBe(1);
  await vi.advanceTimersByTimeAsync(1250);
  expect(live()).toHaveLength(0);
  expect(musicAttenuation()).toBe(1);
});

it('drops an interrupted cue and its duck immediately, without waiting 12 seconds', async () => {
  createBotanicalCue(42, 0.2).play(true);
  await flush();
  expect(musicAttenuation()).toBe(0.32);
  backend.state.players.at(-1).emit({ playing: false });
  expect(musicAttenuation()).toBe(1);
  expect(live()).toHaveLength(0);
});

it('bounds a lost native completion callback by the decoded duration', async () => {
  createBotanicalCue(42, 0.2).play(true);
  await flush();
  const player = backend.state.players.at(-1);
  await vi.advanceTimersByTimeAsync(1400);
  expect(player.released).toBe(true);
  expect(musicAttenuation()).toBe(1);
});

it('recovers a stalled native music startup automatically with a fresh player', async () => {
  backend.state.neverPlay = true;
  ambience.unlockAmbience();
  ambience.configureAmbience(true, 0);
  await flush();
  const broken = live()[0];
  await vi.advanceTimersByTimeAsync(1250);
  expect(broken.released).toBe(true);
  backend.state.neverPlay = false;
  await vi.advanceTimersByTimeAsync(700);
  expect(live()).toHaveLength(1);
  expect(live()[0]).not.toBe(broken);
  expect(live()[0].playing).toBe(true);
});

it('keeps a healthy music player available for the OS to resume after an audio-focus interruption', async () => {
  ambience.unlockAmbience();
  ambience.configureAmbience(true, 0);
  await flush();
  const music = live()[0];
  music.emit({ playing: false });
  await vi.advanceTimersByTimeAsync(2500);
  expect(live()).toEqual([music]);
  expect(backend.state.players).toHaveLength(1);
  music.emit({ playing: true });
  expect(music.playing).toBe(true);
});

it('does not restart an identical volume fade on every game gesture', async () => {
  ambience.unlockAmbience();
  ambience.configureAmbience(true, 0);
  await flush();
  ambience.unlockAmbience();
  await flush();
  const music = live()[0];
  for (let i = 0; i < 10; i++) {
    await vi.advanceTimersByTimeAsync(200);
    ambience.unlockAmbience();
    await flush();
  }
  expect(music.volume).toBeCloseTo(0.08, 5);
});

it('cancels load listeners and never plays a late-loaded cue after backgrounding', async () => {
  backend.state.neverLoad = true;
  createBotanicalCue(42, 0.2).play(true);
  await flush();
  const player = backend.state.players.at(-1);
  await nativeAudioLifecycle.setActive(false);
  stopBotanicalCues();
  expect(player.released).toBe(true);
  expect(player.listenerCount).toBe(0);
  player.isLoaded = true;
  player.emit({ isLoaded: true });
  await flush();
  expect(player.playing).toBe(false);
  expect(musicAttenuation()).toBe(1);
});

it('reconstructs a single native music voice at its saved position on repeated returns', async () => {
  ambience.unlockAmbience();
  ambience.configureAmbience(true, 0);
  await flush();
  for (let i = 1; i <= 20; i++) {
    expect(live()).toHaveLength(1);
    const previous = live()[0];
    previous.currentTime = i;
    await nativeAudioLifecycle.setActive(false);
    stopBotanicalCues();
    expect(audioIsForeground()).toBe(false);
    expect(live()).toHaveLength(0);
    await nativeAudioLifecycle.setActive(true);
    await flush();
    expect(live()).toHaveLength(1);
    expect(live()[0]).not.toBe(previous);
    expect(live()[0].playing).toBe(true);
    expect(live()[0].currentTime).toBe(i);
    expect(musicAttenuation()).toBe(1);
  }
});

it('never replays a delayed pour or page sound after a fast exit and return', async () => {
  const stopPour = pours.playPourSound(
    { sound: true, music: true, haptics: false, motion: true, patterns: false },
    1,
  );
  const stopPage = pages.playPageSound('species', true, true);
  await nativeAudioLifecycle.setActive(false);
  stopBotanicalCues();
  await nativeAudioLifecycle.setActive(true);
  await vi.advanceTimersByTimeAsync(1000);
  expect(live()).toHaveLength(0);
  expect(backend.state.players).toHaveLength(0);
  expect(musicAttenuation()).toBe(1);
  stopPour();
  stopPage();
});

it('rebuilds a native intro voice at the film position after backgrounding', async () => {
  let position = 2;
  const score = intro.createIntroMusic(
    () => position,
    () => {},
  );
  score.sync(true);
  await flush();
  expect(live()).toHaveLength(1);
  const old = live()[0];
  await nativeAudioLifecycle.setActive(false);
  expect(old.released).toBe(true);
  position = 5;
  await nativeAudioLifecycle.setActive(true);
  await flush();
  expect(live()).toHaveLength(1);
  expect(live()[0]).not.toBe(old);
  expect(live()[0].currentTime).toBe(5);
  score.dispose();
  expect(live()).toHaveLength(0);
});

it('releases a decoder even if native pause and unregister both fail', () => {
  const player = backend.create(42, {});
  player.pauseThrows = true;
  player.removeThrows = true;
  releaseGameAudioPlayer(player);
  expect(player.released).toBe(true);
  expect(player.releases).toBe(1);
});

it('clears stale attenuation at a background boundary and cannot release a later effect', () => {
  const before = audioEpoch();
  const old = duckMusic(0.16);
  setAudioForeground(false);
  expect(audioEpoch()).toBe(before + 1);
  expect(musicAttenuation()).toBe(1);
  setAudioForeground(true);
  const next = duckMusic(0.55);
  old();
  expect(musicAttenuation()).toBe(0.55);
  next();
});
