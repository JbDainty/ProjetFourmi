import { useEffect, useRef, useState } from 'react';
import { createIntroMusic } from '../services/introMusic';

export function useIntroMusic(prepare: boolean, playing: boolean, position: () => number) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'blocked'>('idle');
  const current = useRef<ReturnType<typeof createIntroMusic> | null>(null);
  const desired = useRef(playing);
  desired.current = playing;
  const read = useRef(position);
  read.current = position;
  useEffect(() => {
    if (prepare && !current.current) {
      try {
        current.current = createIntroMusic(() => read.current(), setStatus);
      } catch {
        setStatus('blocked');
      }
    }
    current.current?.sync(desired.current);
  }, [prepare, playing]);
  useEffect(
    () => () => {
      current.current?.dispose();
      current.current = null;
    },
    [],
  );
  return {
    blocked: status === 'blocked',
    unlock: () => {
      if (status !== 'playing') void current.current?.unlock();
    },
  };
}
