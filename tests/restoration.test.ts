import { expect, it } from 'vitest';
import {
  restorationCaption,
  restorationState,
  restorationWash,
} from '../src/animation/restoration';
import { initial, loadLevel, move, restoration, restore } from '../src/state/model';
import levels from '../src/data/levels.json';

function paint(rgb: number[], stage: number) {
  const { matrix } = restorationWash(stage);
  return [0, 1, 2].map((row) =>
    rgb.reduce((sum, value, col) => sum + value * matrix[row * 5 + col], matrix[row * 5 + 4]),
  );
}
it('returns original watercolor by page four and reserves the fifth page for the seal', () => {
  for (const rgb of [
    [0.8, 0.16, 0.12],
    [0.1, 0.55, 0.22],
    [0.15, 0.3, 0.8],
    [0.9, 0.88, 0.8],
  ]) {
    let error = Infinity;
    for (let page = 0; page <= 4; page++) {
      const distance = paint(rgb, page).reduce((sum, value, i) => sum + (value - rgb[i]) ** 2, 0);
      expect(distance).toBeLessThanOrEqual(error);
      error = distance;
    }
    expect(paint(rgb, 4)).toEqual(rgb);
    expect(paint(rgb, 5)).toEqual(rgb);
  }
  expect(restorationWash(4).opacity).toBe(1);
  expect(restorationState(4)).toEqual({ page: 4, colors: 4, sealed: false });
  expect(restorationState(5)).toEqual({ page: 5, colors: 4, sealed: true });
  expect(restorationCaption(4)).toContain('À estampiller');
  expect(restorationCaption(5)).toContain('Estampillée');
});
it('retains a legacy five-page collection and its rewards without requiring a new save', () => {
  let save = initial();
  for (const level of levels.slice(0, 5)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  const legacy = {
    ...save,
    pigments: save.pigments.map((p) =>
      p.id === 5 ? { ...p, name: 'Détails floraux', shade: '#b5475f' } : p,
    ),
  };
  const resumed = restore(JSON.stringify(legacy));
  expect(resumed).toEqual(legacy);
  expect(restoration(resumed, 0)).toBe(5);
  expect(restorationState(restoration(resumed, 0)).sealed).toBe(true);
  const pageSix = loadLevel(resumed, 6);
  expect(pageSix.completed).toEqual(legacy.completed);
  expect(pageSix.seeds).toBe(legacy.seeds);
  expect(pageSix.pigments).toEqual(legacy.pigments);
  expect(save.pigments[4].name).toBe('Sceau du botaniste');
});
