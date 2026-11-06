/** Serialize native session changes; only the newest activation can enable playback. */
export function createAudioLifecycle(
  activate: () => Promise<void>,
  deactivate: () => Promise<void>,
  foreground: (active: boolean) => void,
) {
  let desired: boolean | undefined;
  let ready = false,
    revision = 0;
  let queue = Promise.resolve();
  let pending: Promise<boolean> | undefined;
  const request = (active: boolean): Promise<boolean> => {
    if (desired === active && (ready || pending)) return pending ?? Promise.resolve(ready);
    desired = active;
    ready = false;
    const token = ++revision;
    foreground(false);
    const task = queue.then(async () => {
      try {
        if (active) await activate();
        else await deactivate();
        if (token === revision && active && desired) {
          ready = true;
          foreground(true);
        }
      } catch {
        /* A later foreground gesture can retry a failed session. */
      }
      return token === revision && ready;
    });
    pending = task;
    queue = task.then(() => {
      if (pending === task) pending = undefined;
    });
    return task;
  };
  return {
    setActive: request,
    ensureReady: () => (desired === true ? request(true) : Promise.resolve(false)),
  };
}
