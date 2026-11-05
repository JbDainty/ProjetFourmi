/** Frame scheduling shared by native and browser adapters; rendering is capped at 30 fps. */
export function createProloguePlayer(options: {
  request: (callback: (now: number) => void) => number;
  cancel: (id: number) => void;
  progress: () => number;
  draw: (progress: number) => void;
  failed: (error: unknown) => void;
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
      if (now - last >= 1000 / 30 && p !== previous) {
        options.draw(p);
        last = now;
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
