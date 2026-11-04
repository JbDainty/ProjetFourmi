import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initial, restore, Save } from './model';
const KEY = 'color-world.save';
const Context = createContext<{
  save: Save;
  setSave: (fn: (s: Save) => Save) => void;
  ready: boolean;
  error: string;
  retry: () => void;
} | null>(null);
export function GameProvider({ children }: { children: React.ReactNode }) {
  const [save, update] = useState(initial),
    [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const queue = useRef(Promise.resolve());
  const current = useRef(save);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const s = restore(raw);
        current.current = s;
        update(s);
        setReady(true);
      })
      .catch(() =>
        setError(
          'La sauvegarde n’a pas pu être lue. Rechargez l’application pour réessayer. Elle n’a pas été remplacée.',
        ),
      );
  }, []);
  const persist = (s: Save) => {
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, JSON.stringify(s)))
      .then(() => setError(''))
      .catch(() => setError('Sauvegarde impossible. Gardez cette fenêtre ouverte et réessayez.'));
  };
  const setSave = (fn: (s: Save) => Save) => {
    if (!ready) return;
    const next = fn(current.current);
    current.current = next;
    update(next);
    persist(next);
  };
  return (
    <Context.Provider
      value={{ save, setSave, ready, error, retry: () => persist(current.current) }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGame() {
  const value = useContext(Context);
  if (!value) throw Error('GameProvider missing');
  return value;
}
