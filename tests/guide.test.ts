import { expect, it } from 'vitest';
import { initial, resetProgress, restore } from '../src/state/model';

it('keeps the first guide pending after signing and until entering the greenhouse', () => {
  const save = { ...initial(), started: true, nickname: 'Camille' };
  const resumed = restore(JSON.stringify(save));
  expect(resumed.guideSeen).toBe(false);
  expect(resumed).toEqual(save);
  expect(restore(JSON.stringify({ ...save, guideSeen: true })).guideSeen).toBe(true);
});

it('migrates existing carnets without interrupting their progress or awarding resources', () => {
  const { guideSeen, ...old } = {
    ...initial(),
    started: true,
    nickname: 'Élise',
    seeds: 23,
    moves: 7,
  };
  const migrated = restore(JSON.stringify(old));
  expect(migrated).toEqual({ ...old, guideSeen: true });
  expect(restore(JSON.stringify({ ...old, started: false })).guideSeen).toBe(false);
});

it('restarts the guide with a new carnet after resetting progress', () => {
  const save = { ...initial(), started: true, guideSeen: true, nickname: 'Camille' };
  expect(resetProgress(save).guideSeen).toBe(false);
  expect(resetProgress(save).started).toBe(false);
  expect(save.guideSeen).toBe(true);
});

it('rejects malformed persisted guide state', () => {
  expect(() => restore(JSON.stringify({ ...initial(), guideSeen: 'yes' }))).toThrow(
    'État du guide invalide.',
  );
});
