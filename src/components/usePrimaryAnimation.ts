import { useEffect, useSyncExternalStore } from 'react';
import { primaryAnimations } from '../animation/primaryAnimations';

export function usePrimaryAnimation(active: boolean) {
  useEffect(() => (active ? primaryAnimations.acquire() : undefined), [active]);
}
export function useAmbientMotion(enabled: boolean) {
  const occupied = useSyncExternalStore(
    primaryAnimations.subscribe,
    primaryAnimations.active,
    () => false,
  );
  return enabled && !occupied;
}
