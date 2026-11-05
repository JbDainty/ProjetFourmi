type Options = {
  duration: number;
  fps: number;
  now: () => number;
  request: (callback: (time: number) => void) => number;
  cancel: (id: number) => void;
  onFrame: (elapsed: number) => void;
  onFinish: () => void;
};

/** A finite clock: no idle work, capped paints, no time jump after backgrounding. */
export function framePlayback(options: Options) {
  let active = false,
    disposed = false,
    finished = false;
  let frame = 0,
    elapsed = 0,
    lastTime = 0,
    nextPaint = 0;
  const interval = 1000 / options.fps;
  const tick = (time: number) => {
    frame = 0;
    if (!active || disposed || finished) return;
    elapsed = Math.min(options.duration, elapsed + Math.max(0, time - lastTime));
    lastTime = time;
    if (elapsed >= nextPaint - 0.1 || elapsed === options.duration) {
      nextPaint += (Math.floor(Math.max(0, elapsed - nextPaint) / interval) + 1) * interval;
      options.onFrame(elapsed);
    }
    if (elapsed === options.duration) {
      finished = true;
      options.onFinish();
    } else if (active && !disposed) frame = options.request(tick);
  };
  return {
    setActive(next: boolean) {
      if (active === next || disposed || finished) return;
      if (!next) {
        elapsed = Math.min(options.duration, elapsed + Math.max(0, options.now() - lastTime));
        options.cancel(frame);
        frame = 0;
      }
      active = next;
      lastTime = options.now();
      if (active) frame = options.request(tick);
    },
    dispose() {
      disposed = true;
      active = false;
      options.cancel(frame);
      frame = 0;
    },
  };
}
