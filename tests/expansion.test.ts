import { it, expect } from 'vitest';
import levels, { legacyLevels } from '../src/data/campaign';
import { pour, won, blocked, crystalOpen } from '../src/engine/puzzle';
import {
  initial,
  loadLevel,
  move,
  restore,
  activeRules,
  undo,
  resetProgress,
} from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';
import { mechanicIds } from '../src/engine/mechanics';
import { initialKnowledge } from '../src/engine/knowledge';
import { chapters, species } from '../src/data/botany';
import { plantsForEcosystem, ecosystemForPage } from '../src/data/ecology';
it('has 1000 certified pages, 200 distinct ordinary specimens, 20 ten-plant albums and progressive lessons', () => {
  expect(levels.length).toBe(1000);
  expect(species.length).toBe(200);
  expect(chapters.length).toBe(20);
  expect(new Set(species.map((s) => s.latin)).size).toBe(200);
  for (let e = 0; e < 20; e++) expect(plantsForEcosystem(e)).toHaveLength(10);
  expect(ecosystemForPage(32)).toBe(1);
  expect(ecosystemForPage(1000)).toBe(19);
  expect(new Set(levels.flatMap((l) => l.rules?.mechanics ?? []))).toEqual(new Set(mechanicIds));
  for (const l of levels) {
    expect(l.rules?.mechanics.length ?? 0).toBeLessThanOrEqual(2);
    let b = l.board;
    for (const m of l.solution) {
      const next = pour(b, m.from, m.to, l.rules);
      expect(next, `page ${l.id}`).not.toBeNull();
      b = next!;
    }
    expect(won(b, l.rules), `page ${l.id}`).toBe(true);
  }
  for (const id of mechanicIds) {
    const first = levels.find((l) => l.rules?.mechanics.includes(id))!;
    expect(first.rules!.mechanics).toEqual([id]);
    expect(first.par).toBeLessThanOrEqual(16);
  }
});
it('enforces capacity, key, crystal, link, pipette, filter and receiving-only constraints', () => {
  expect(won([[0, 0], [0, 0], []], { mechanics: ['capacity'], capacities: [2, 2, 4] })).toBe(true);
  const gate = { mechanics: ['locks'] as const, gates: [{ tube: 3, key: 1 }] };
  const r = { ...gate, mechanics: ['locks'] as any };
  const b = [[0, 1], [1, 1, 1], [1], []];
  expect(blocked(b, 3, r)).toBe(true);
  expect(pour(b, 0, 3, r)).toBeNull();
  const opened = pour(b, 2, 1, r)!;
  expect(blocked(opened, 3, r)).toBe(false);
  expect(pour(opened, 1, 3, r)).toBeNull();
  const frost = { mechanics: ['crystal'] as any, crystals: [{ tube: 0, depth: 0, color: 1 }] };
  expect(pour([[0, 0], [1, 1, 1], [1], []], 0, 3, frost)?.[0]).toEqual([0]);
  expect(pour([[0], [1, 1, 1], [1], [0]], 0, 3, frost)).toBeNull();
  expect(crystalOpen([[0], [1, 1, 1, 1], [], [0]], 1, frost)).toBe(true);
  expect(pour([[0], [1], []], 1, 2, { mechanics: ['links'], links: [[0, 2]] })).toBeNull();
  expect(pour([[0, 0, 0], [], []], 0, 1, { mechanics: ['pipette'], pipettes: [0] })?.[1]).toEqual([
    0,
  ]);
  expect(
    pour([[0], [], []], 0, 1, { mechanics: ['filter'], filters: [{ tube: 1, color: 1 }] }),
  ).toBeNull();
  expect(pour([[0], [], []], 0, 1, { mechanics: ['conservation'], collectors: [0] })).toBeNull();
});
it('migrates an actual old page and its inventory without changing its active rules or rewards', () => {
  const s = initial();
  delete s.campaign;
  delete s.known;
  delete s.historyKnown;
  s.started = true;
  s.current = 32;
  s.seeds = 17;
  s.moves = 0;
  s.board = legacyLevels[31].board;
  for (let id = 1; id < 32; id++) {
    s.completed[id] = { stars: 2, date: '2026-11-01T00:00:00Z' };
    s.pigments.push(discoverPigment(id, '2026-11-01T00:00:00Z'));
  }
  const migrated = restore(JSON.stringify(s));
  expect(migrated.board).toEqual(s.board);
  expect(activeRules(migrated)).toBeUndefined();
  expect(migrated.seeds).toBe(17);
  expect(migrated.pigments).toEqual(s.pigments);
  expect(loadLevel(migrated, 32).board).toEqual(levels[31].board);
  expect(loadLevel(migrated, 32).remix).toBeUndefined();
});
it('test sessions can open page 1000 and never award real progress', () => {
  const real = initial();
  let trial = loadLevel({ ...real, testSession: { returnSave: real }, seeds: 50 }, 1000);
  expect(trial.current).toBe(1000);
  trial = restore(JSON.stringify(trial));
  for (const m of levels[999].solution) trial = move(trial, m.from, m.to);
  expect(won(trial.board, activeRules(trial))).toBe(true);
  expect(trial.completed).toEqual(real.completed);
  expect(trial.pigments).toEqual(real.pigments);
  expect(trial.seeds).toBe(50);
  expect(trial.testSession?.returnSave).toEqual(real);
  expect(resetProgress(trial).testSession?.returnSave).toEqual(real);
});
it('mystery discovery follows real pours and undo retains revealed information', () => {
  const s = {
    ...initial(),
    board: [[0, 1], [1, 1, 1], [], []],
    known: initialKnowledge([[0, 1], [1, 1, 1], [], []], { mechanics: ['mystery'], mystery: [0] }),
  };
  expect(s.known[0]).toEqual([false, true]);
  const next = move(s, 0, 1);
  expect(next.known![0]).toEqual([true]);
  expect(undo(next).known![0][0]).toBe(true);
});
