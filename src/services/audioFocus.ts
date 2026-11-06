/** Shared foreground state and independently releasable music attenuation tokens. */
let foreground = true;
let epoch = 0;
export const audioEpoch = () => epoch;
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
  if (foreground === value) return;
  foreground = value;
  if (!value) {
    epoch++;
    ducks.clear();
  }
  notify();
}
export function duckMusic(level = 0.32): () => void {
  if (!foreground) return () => {};
  const token = Symbol();
  ducks.set(token, Math.max(0, Math.min(1, level)));
  notify();
  return () => {
    if (ducks.delete(token)) notify();
  };
}
