export type ScoreVoice = {
  play: (position: number, valid: () => boolean) => Promise<boolean>;
  pause: () => void;
  dispose: () => void;
};
export function scoreSession(
  voice: ScoreVoice,
  position: () => number,
  status: (value: 'idle' | 'playing' | 'blocked') => void,
) {
  let active = false,
    disposed = false,
    generation = 0;
  const begin = () => {
    const token = ++generation;
    const valid = () => !disposed && active && token === generation;
    void voice
      .play(position(), valid)
      .then((played) => {
        if (valid()) status(played ? 'playing' : 'blocked');
      })
      .catch(() => {
        if (valid()) status('blocked');
      });
  };
  return {
    setActive(next: boolean) {
      if (disposed || active === next) return;
      active = next;
      if (active) begin();
      else {
        generation++;
        voice.pause();
        status('idle');
      }
    },
    retry() {
      if (active && !disposed) begin();
    },
    dispose() {
      if (!disposed) {
        disposed = true;
        generation++;
        voice.dispose();
      }
    },
  };
}
