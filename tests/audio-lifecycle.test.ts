import { expect, it, vi } from 'vitest';
import { createAudioLifecycle } from '../src/services/audioLifecycle';

it('serializes rapid background/foreground changes and never enables a stale activation', async () => {
  const work: { active: boolean; finish: () => void }[] = [];
  const driver = (active: boolean) => new Promise<void>((finish) => work.push({ active, finish }));
  const states: boolean[] = [];
  const life = createAudioLifecycle(
    () => driver(true),
    () => driver(false),
    (value) => states.push(value),
  );
  const opening = life.setActive(true);
  await Promise.resolve();
  expect(work.map((item) => item.active)).toEqual([true]);
  const closing = life.setActive(false);
  const returning = life.setActive(true);
  work[0].finish();
  expect(await opening).toBe(false);
  await Promise.resolve();
  expect(states).not.toContain(true);
  expect(work.map((item) => item.active)).toEqual([true, false]);
  work[1].finish();
  expect(await closing).toBe(false);
  await Promise.resolve();
  work[2].finish();
  expect(await returning).toBe(true);
  expect(states.filter(Boolean)).toHaveLength(1);
  expect(await life.ensureReady()).toBe(true);
  expect(work).toHaveLength(3);
});

it('allows a failed native activation to retry without restarting the game', async () => {
  const activate = vi
    .fn()
    .mockRejectedValueOnce(Error('Session interrupted'))
    .mockResolvedValue(undefined);
  const publish = vi.fn();
  const life = createAudioLifecycle(activate, async () => {}, publish);
  expect(await life.setActive(true)).toBe(false);
  expect(publish).not.toHaveBeenCalledWith(true);
  expect(await life.ensureReady()).toBe(true);
  expect(activate).toHaveBeenCalledTimes(2);
  await life.setActive(false);
  expect(await life.ensureReady()).toBe(false);
  expect(activate).toHaveBeenCalledTimes(2);
});
