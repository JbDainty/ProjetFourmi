let context: AudioContext | undefined;
export function sharedAudioContext(): AudioContext | undefined {
  try {
    const Constructor =
      globalThis.AudioContext ||
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return;
    if (!context || context.state === 'closed') context = new Constructor();
    if (audioIsForeground() && context.state !== 'running') void context.resume().catch(() => {});
    return context;
  } catch {
    return;
  }
}
import { audioIsForeground } from './audioFocus';
