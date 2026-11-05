import { describe, it, expect } from 'vitest';
import { clone, pour, won, solve, key } from '../src/engine/puzzle';
import levels from '../src/data/levels.json';
import {
  initial,
  loadLevel,
  move,
  undo,
  restoration,
  reward,
  restore,
  unlocked,
} from '../src/state/model';
import { acquireTheme } from '../src/state/economy';
import { species } from '../src/data/botany';
describe('tri de liquides', () => {
  it('transfère tout le groupe supérieur dans la capacité disponible', () => {
    const b = [[0, 1, 1], [1, 1, 1], []];
    expect(pour(b, 0, 1)).toEqual([[0, 1], [1, 1, 1, 1], []]);
    expect(b).toEqual([[0, 1, 1], [1, 1, 1], []]);
    expect(pour(b, 0, 2)).toEqual([[0], [1, 1, 1], [1, 1]]);
  });
  it('refuse les mouvements invalides', () => {
    const b = [[0, 1], [0, 0, 0, 0], []];
    expect(pour(b, 0, 1)).toBeNull();
    expect(pour(b, 0, 0)).toBeNull();
    expect(pour(b, 2, 0)).toBeNull();
    expect(pour([[0], [1]], 0, 1)).toBeNull();
    expect(pour(b, 0, 9)).toBeNull();
  });
  it('exige des flacons vides ou pleins et monochromes pour gagner', () => {
    expect(won([[0, 0], [1], []])).toBe(false);
    expect(won([[0, 0], [1, 1, 1, 1], [0, 0], []])).toBe(false);
    expect(won([[0, 0, 0, 0], [1, 1, 1, 1], [], []])).toBe(true);
    expect(won([[0, 1], []])).toBe(false);
    expect(won([[], []])).toBe(false);
  });
  it('annule exactement et recommence sans perdre la collection', () => {
    const original = initial(),
      m = levels[0].solution[0],
      next = move(original, m.from, m.to);
    expect(next.moves).toBe(1);
    expect(undo(next).board).toEqual(original.board);
    expect(undo(next).moves).toBe(0);
    expect(loadLevel(next, 1).board).toEqual(original.board);
    expect(original.board).toEqual(levels[0].board);
  });
  it('fournit une aide qui mène effectivement à la solution', () => {
    let b = clone(levels[24].board);
    const result = solve(b);
    expect(result?.length).toBeGreaterThan(0);
    for (const m of result!) b = pour(b, m.from, m.to)!;
    expect(won(b)).toBe(true);
  });
});
describe('cent énigmes et progression complète', () => {
  it('contient exactement 100 plateaux distincts et des certificats vérifiés', () => {
    expect(levels).toHaveLength(100);
    expect(new Set(levels.map((l) => key(l.board))).size).toBe(100);
    for (const l of levels) {
      expect(won(l.board)).toBe(false);
      let b = clone(l.board);
      for (const m of l.solution) {
        const next = pour(b, m.from, m.to);
        expect(next, `niveau ${l.id}`).not.toBeNull();
        b = next!;
      }
      expect(won(b), `niveau ${l.id}`).toBe(true);
    }
  });
  it('restaure les 20 espèces, débloque les 5 chapitres et termine le niveau 100', () => {
    let s = initial();
    expect(loadLevel(s, 21)).toBe(s);
    for (const l of levels) {
      expect(unlocked(s, l.id)).toBe(true);
      s = loadLevel(s, l.id);
      for (const m of l.solution) s = move(s, m.from, m.to);
      expect(won(s.board)).toBe(true);
      expect(s.pigments).toHaveLength(l.id);
      expect(s.completed[l.id].stars).toBe(3);
      if (l.id % 5 === 0) expect(restoration(s, l.id / 5 - 1)).toBe(5);
      if (l.id % 20 === 0 && l.id < 100) expect(unlocked(s, l.id + 1)).toBe(true);
    }
    expect(Object.keys(s.completed)).toHaveLength(100);
    expect(s.current).toBe(100);
    expect(species.map((_, i) => restoration(s, i))).toEqual(Array(20).fill(5));
    expect(loadLevel(s, 101)).toBe(s);
    const previous = s.seeds;
    expect(reward(s).seeds).toBe(previous);
    expect(reward(s).pigments).toHaveLength(100);
  });
  it('ne donne pas de récompense pour un niveau non résolu', () =>
    expect(reward(initial())).toEqual(initial()));
});
describe('sauvegardes', () => {
  it('reprend le puzzle et l’historique après fermeture', () => {
    let s = initial();
    s = { ...s, started: true };
    const m = levels[0].solution[0];
    s = move(s, m.from, m.to);
    const loaded = restore(JSON.stringify(s));
    expect(loaded).toEqual(s);
    expect(undo(loaded).board).toEqual(initial().board);
  });
  it('conserve une victoire et ses pigments, sans réattribuer les graines', () => {
    let s = initial();
    for (const m of levels[0].solution) s = move(s, m.from, m.to);
    const loaded = restore(JSON.stringify(s));
    expect(loaded).toEqual(s);
    expect(reward(loaded)).toEqual(loaded);
  });
  it('migre le format précédent sans effacer la progression', () => {
    const s = initial();
    expect(restore(JSON.stringify({ ...s, version: 1 }))).toEqual(s);
  });
  it('rejette les versions inconnues et les données incohérentes', () => {
    expect(() => restore('{')).toThrow();
    expect(() => restore(JSON.stringify({ ...initial(), version: 99 }))).toThrow();
    expect(() => restore(JSON.stringify({ ...initial(), board: [[1], []] }))).toThrow();
    expect(() =>
      restore(
        JSON.stringify({
          ...initial(),
          completed: { 100: { stars: 3, date: new Date().toISOString() } },
        }),
      ),
    ).toThrow();
  });
});

describe('économie et reprise finale', () => {
  it('refuse un thème trop cher puis ne le facture qu’une fois', () => {
    const s = initial();
    expect(acquireTheme(s, 'rose')).toBe(s);
    const bought = acquireTheme({ ...s, seeds: 200 }, 'rose');
    expect(bought.seeds).toBe(50);
    expect(acquireTheme(bought, 'rose').seeds).toBe(50);
  });
  it('résout indépendamment chacun des cent niveaux', () => {
    for (const l of levels) {
      let board = clone(l.board);
      const solution = solve(board);
      expect(solution, `solveur niveau ${l.id}`).not.toBeNull();
      for (const m of solution!) board = pour(board, m.from, m.to)!;
      expect(won(board)).toBe(true);
    }
  });
  it('recharge la collection intégrale après le niveau 100', () => {
    let s = initial();
    for (const l of levels) {
      s = loadLevel(s, l.id);
      for (const m of l.solution) s = move(s, m.from, m.to);
    }
    const loaded = restore(JSON.stringify(s));
    expect(loaded.pigments).toHaveLength(100);
    expect(restoration(loaded, 19)).toBe(5);
    expect(loaded).toEqual(s);
  });
  it('refuse une collection de pigments falsifiée', () =>
    expect(() => restore(JSON.stringify({ ...initial(), pigments: [{}] }))).toThrow());
});

describe('couleurs intégralement regroupées', () => {
  const partial = [[0, 0], [1, 1, 1, 1], [0, 0], []];
  it('continue le puzzle sans récompense avec une couleur répartie en demi-flacons', () => {
    const s = { ...initial(), board: clone(partial) };
    expect(won(s.board)).toBe(false);
    expect(reward(s)).toBe(s);
    expect(s.pigments).toHaveLength(0);
    const completed = move(s, 0, 2);
    expect(won(completed.board)).toBe(true);
    expect(completed.pigments).toHaveLength(1);
    expect(completed.seeds).toBe(s.seeds + 1);
    expect(completed.completed[1]).toBeDefined();
  });
  it('propose un indice de consolidation quand toutes les couleurs sont déjà séparées', () => {
    const path = solve(partial);
    expect(path).not.toBeNull();
    expect(path).toHaveLength(1);
    expect(won(pour(partial, path![0].from, path![0].to)!)).toBe(true);
  });
  it('reprend une ancienne victoire partielle sans effacer ni dupliquer les récompenses', () => {
    let earned = initial();
    for (const m of levels[0].solution) earned = move(earned, m.from, m.to);
    const legacy = { ...earned, board: clone(partial), history: [], moves: 5 };
    const restored = restore(JSON.stringify(legacy));
    expect(restored.completed).toEqual(earned.completed);
    expect(restored.pigments).toEqual(earned.pigments);
    expect(won(restored.board)).toBe(false);
    const completed = move(restored, 0, 2);
    expect(won(completed.board)).toBe(true);
    expect(completed.seeds).toBe(earned.seeds);
    expect(completed.pigments).toEqual(earned.pigments);
  });
});
