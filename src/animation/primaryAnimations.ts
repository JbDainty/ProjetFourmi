/** Only animation workload: never changes input, progression, rewards or sound. */
export function createPrimaryAnimations() {
  const owners = new Set<symbol>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  return {
    active: () => owners.size > 0,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    acquire() {
      const token = Symbol();
      const wasActive = owners.size > 0;
      owners.add(token);
      if (!wasActive) notify();
      return () => {
        if (owners.delete(token) && owners.size === 0) notify();
      };
    },
  };
}
export const primaryAnimations = createPrimaryAnimations();
