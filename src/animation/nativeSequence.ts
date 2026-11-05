type Stage = {
  duration: number;
  play: (
    duration: number,
    complete: () => void,
  ) => { stop: (read: (progress: number) => void) => void };
  complete?: () => void;
};

/** Native animations deliver only phase completions to JS, never frame events. */
export function nativeSequence(stages: Stage[], complete: () => void) {
  let index = 0,
    progress = 0,
    generation = 0;
  let active = false,
    disposed = false,
    reading = false,
    finished = false;
  let run: ReturnType<Stage['play']> | undefined;
  const start = () => {
    if (!active || disposed || finished || reading) return;
    const token = ++generation;
    const done = () => {
      if (disposed || finished || token !== generation || !active) return;
      run = undefined;
      stages[index].complete?.();
      index++;
      progress = 0;
      if (index === stages.length) {
        finished = true;
        complete();
      } else start();
    };
    if (progress >= 1) done();
    else run = stages[index].play(stages[index].duration * (1 - progress), done);
  };
  return {
    setActive(next: boolean) {
      if (disposed || finished || active === next) return;
      active = next;
      if (next) start();
      else if (run) {
        generation++;
        const stopping = run;
        run = undefined;
        reading = true;
        stopping.stop((value) => {
          if (disposed) return;
          progress = Math.max(0, Math.min(1, value));
          reading = false;
          start();
        });
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      generation++;
      run?.stop(() => {});
      run = undefined;
    },
  };
}
