/** Phase-aligned scheduling avoids dropping a third frame at 59.94/120 Hz. */
export function createProloguePlayer(options: {
  request: (callback: (now: number) => void) => number;
  cancel: (id: number) => void;
  progress: () => number;
  draw: (progress: number) => void;
  failed: (error: unknown) => void;
  fps?: number;
}) {
  let disposed = false,
    active = false,
    frame: number | undefined,
    last = -Infinity,
    previous = -1;
  const tick = (now: number) => {
    frame = undefined;
    if (disposed || !active) return;
    try {
      const p = options.progress();
      const interval = 1000 / (options.fps ?? 30);
      if (now + 0.5 >= last && p !== previous) {
        options.draw(p);
        last = Number.isFinite(last)
          ? last + (Math.floor(Math.max(0, now - last) / interval) + 1) * interval
          : now + interval;
        previous = p;
      }
    } catch (error) {
      active = false;
      options.failed(error);
      return;
    }
    if (active && !disposed) frame = options.request(tick);
  };
  return {
    setActive(value: boolean) {
      if (disposed || active === value) return;
      active = value;
      if (!value && frame !== undefined) {
        options.cancel(frame);
        frame = undefined;
      }
      if (value) {
        last = -Infinity;
        previous = -1;
        frame = options.request(tick);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      if (frame !== undefined) options.cancel(frame);
      frame = undefined;
    },
  };
}
