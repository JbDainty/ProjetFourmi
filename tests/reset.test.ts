import { expect, it } from 'vitest';
import { initial, loadLevel, move, resetProgress, restore } from '../src/state/model';
import { acquireTheme } from '../src/state/economy';
import levels from '../src/data/levels.json';

it('resets the journey and cosmetics to a fresh save while preserving accessibility preferences', () => {
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, 6)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = { ...save, seeds: 200, nickname: 'Camille' };
  save = acquireTheme(save, 'sauge');
  save = loadLevel(save, 7);
  const next = levels[6].solution[0];
  save = move(save, next.from, next.to);
  save.settings = { sound: false, music: false, haptics: false, motion: false, patterns: true };
  const before = structuredClone(save);
  const fresh = resetProgress(save);
  expect(fresh).toEqual({ ...initial(), settings: save.settings });
  expect(restore(JSON.stringify(fresh))).toEqual(fresh);
  expect(save).toEqual(before);
  expect(fresh.settings).not.toBe(save.settings);
  fresh.board[0].pop();
  expect(save).toEqual(before);
  expect(initial().board).toEqual(levels[0].board);
});
