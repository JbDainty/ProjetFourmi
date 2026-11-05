/** Read by the 3D renderer directly: a movie does not need React state per frame. */
export function movieClock(duration: number, now: () => number) {
  let elapsed = 0,
    started = now(),
    active = false;
  const current = () => Math.min(duration, elapsed + (active ? Math.max(0, now() - started) : 0));
  return {
    progress: () => current() / duration,
    setActive(next: boolean) {
      elapsed = current();
      started = now();
      active = next;
    },
    seek(progress: number) {
      elapsed = Math.max(0, Math.min(1, progress)) * duration;
      started = now();
    },
  };
}
