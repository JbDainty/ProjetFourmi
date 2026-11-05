/** Shared foreground state and independently releasable music attenuation tokens. */
let foreground = true;
const ducks = new Map<symbol, number>();
const listeners = new Set<() => void>();
export const audioIsForeground = () => foreground;
export const musicAttenuation = () => Math.min(1, ...ducks.values());
export function observeAudioFocus(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const notify = () => listeners.forEach((listener) => listener());
export function setAudioForeground(value: boolean) {
  foreground = value;
  notify();
}
export function duckMusic(level = 0.32): () => void {
  const token = Symbol();
  ducks.set(token, Math.max(0, Math.min(1, level)));
  notify();
  return () => {
    if (ducks.delete(token)) notify();
  };
}
