import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initial, restore, resetProgress, Save } from './model';
const KEY = 'color-world.save';
const Context = createContext<{
  save: Save;
  setSave: (fn: (s: Save) => Save) => void;
  ready: boolean;
  error: string;
  retry: () => void;
  reset: () => Promise<boolean>;
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
  const reset = async () => {
    if (!ready) return false;
    const fresh = resetProgress(current.current);
    // Finish earlier writes first and only replace memory after durable success.
    const write = queue.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify(fresh)));
    queue.current = write.catch(() => {});
    try {
      await write;
      current.current = fresh;
      update(fresh);
      setError('');
      return true;
    } catch {
      setError('La remise à zéro n’a pas pu être enregistrée. Réessayez.');
      return false;
    }
  };
  return (
    <Context.Provider
      value={{ save, setSave, ready, error, retry: () => persist(current.current), reset }}
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
