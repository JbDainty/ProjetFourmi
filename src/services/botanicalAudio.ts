import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { createAudioPlayer } from 'expo-audio';

let context: AudioContext | undefined;

export function createBotanicalCue(source: number, volume: number) {
  let buffer: Promise<AudioBuffer | undefined> | undefined;
  /** Prepare from a game gesture; all cues share the same unlocked context. */
  function prepare() {
    if (Platform.OS !== 'web') return;
    try {
      const AudioContextClass =
        globalThis.AudioContext ||
        (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      context ??= new AudioContextClass();
      if (context.state === 'suspended') void context.resume().catch(() => {});
      const activeContext = context;
      buffer ??= fetch(Asset.fromModule(source).uri)
        .then((response) => {
          if (!response.ok) throw Error('Audio unavailable');
          return response.arrayBuffer();
        })
        .then((bytes) => activeContext.decodeAudioData(bytes))
        .catch(() => {
          buffer = undefined;
          return undefined;
        });
      return buffer;
    } catch {
      return;
    }
  }

  /** One short, quiet cue. Cleanup also cancels a pending decode or playback. */
  function play(enabled: boolean): () => void {
    if (!enabled) return () => {};
    if (Platform.OS === 'web') {
      let cancelled = false;
      let voice: AudioBufferSourceNode | undefined;
      let gain: GainNode | undefined;
      void prepare()?.then((decoded) => {
        if (cancelled || !decoded || !context || context.state !== 'running') return;
        try {
          voice = context.createBufferSource();
          voice.buffer = decoded;
          gain = context.createGain();
          gain.gain.value = volume;
          voice.connect(gain);
          gain.connect(context.destination);
          voice.onended = () => {
            voice?.disconnect();
            gain?.disconnect();
          };
          voice.start();
        } catch {
          /* Sound is optional; the restoration remains playable. */
        }
      });
      return () => {
        cancelled = true;
        try {
          voice?.stop();
          voice?.disconnect();
          gain?.disconnect();
        } catch {}
      };
    }
    let player: ReturnType<typeof createAudioPlayer> | undefined;
    try {
      player = createAudioPlayer(source);
      player.volume = volume;
      player.loop = false;
      player.play();
    } catch {}
    return () => {
      try {
        player?.pause();
        player?.remove();
      } catch {}
    };
  }

  return { prepare, play };
}
