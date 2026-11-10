import { expect, it } from 'vitest';
import levels, { campaign3Levels } from '../src/data/campaign';
import { difficultyProfile, mechanicIntroductions } from '../src/data/difficulty';
import { mechanicIds } from '../src/engine/mechanics';
import { pour, won } from '../src/engine/puzzle';
import { initialKnowledge, moveKnowledge } from '../src/engine/knowledge';
import {
  activeRules,
  currentHint,
  initial,
  loadLevel,
  move,
  purchaseHint,
  remixPage,
  restore,
  type Save,
} from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';
import { attemptPuzzle } from '../src/engine/remix';

it('can restore every published campaign-three page after the rebalance', () => {
  const real = { ...initial(), started: true };
  for (const level of campaign3Levels) {
    const before: Save = {
      ...initial(),
      campaign: 3,
      current: level.id,
      started: true,
      testSession: { returnSave: real },
      board: level.board,
      known: initialKnowledge(level.board, level.rules),
    };
    const after = restore(JSON.stringify(before));
    expect(after.board).toEqual(level.board);
    expect(attemptPuzzle(after.current, after.remix).par).toBe(level.par);
    expect(JSON.parse(JSON.stringify(activeRules(after) ?? null))).toEqual(level.rules ?? null);
  }
});

it('keeps a progression floor on rest pages instead of reusing initiation difficulty', () => {
  for (const level of levels.slice(10)) {
    const floor = difficultyProfile(level.id);
    expect(new Set(level.board.flat()).size, `palette page ${level.id}`).toBeGreaterThanOrEqual(
      floor.colors,
    );
    expect(level.par, `minimum page ${level.id}`).toBeGreaterThanOrEqual(floor.minimum);
    expect(level.board.filter((t) => new Set(t).size > 1).length).toBeGreaterThanOrEqual(
      floor.mixed,
    );
    expect(level.rules?.mechanics.length ?? 0).toBeLessThanOrEqual(2);
    for (const type of level.rules?.mechanics ?? [])
      expect(level.id).toBeGreaterThanOrEqual(mechanicIntroductions[mechanicIds.indexOf(type)]);
  }
  for (const key of ['gates', 'crystals', 'filters', 'pipettes', 'collectors'] as const)
    expect(
      levels.some((l) => (l.rules?.[key]?.length ?? 0) > 1),
      key,
    ).toBe(true);
  expect(levels.some((l) => (l.rules?.mystery?.length ?? 0) >= 4)).toBe(true);
  expect(levels.every((l) => (l.rules?.mystery?.length ?? 0) <= 5)).toBe(true);
});

it('preserves campaign-three attempts, histories and bought hints while adopting new pages on restart', () => {
  for (const id of [32, 111, 650, 657, 999]) {
    const source = campaign3Levels[id - 1];
    const first = source.solution[0],
      next = pour(source.board, first.from, first.to, source.rules)!;
    const before: Save = {
      ...initial(),
      campaign: 3,
      started: true,
      current: id,
      seeds: 2,
      board: next,
      history: [source.board],
      moves: 1,
      known: moveKnowledge(
        source.board,
        next,
        initialKnowledge(source.board, source.rules),
        first.from,
        first.to,
      ),
      historyKnown: [initialKnowledge(source.board, source.rules)],
    };
    for (let page = 1; page < id; page++) {
      before.completed[page] = { stars: 2, date: '2026-11-10T12:00:00Z' };
      before.pigments.push(discoverPigment(page, '2026-11-10T12:00:00Z'));
    }
    before.paidHints[`${id}|${JSON.stringify(next)}`] = source.solution[1];
    let after = restore(JSON.stringify(before));
    expect(after.campaign).toBe(4);
    expect(after.remix?.campaign).toBe(3);
    expect(after.board).toEqual(before.board);
    expect(after.history).toEqual(before.history);
    expect(after.known).toEqual(before.known);
    expect(after.completed).toEqual(before.completed);
    expect(after.pigments).toEqual(before.pigments);
    expect(after.seeds).toBe(2);
    expect(currentHint(after)).toEqual(source.solution[1]);
    expect(purchaseHint(after, source.solution[1]).seeds).toBe(2);
    expect(restore(JSON.stringify(after))).toEqual(after);
    const mixed = remixPage(after, () => 0.37);
    expect(mixed.remix?.campaign).toBe(3);
    expect(restore(JSON.stringify(mixed))).toEqual(mixed);
    for (const step of source.solution.slice(1)) after = move(after, step.from, step.to);
    expect(won(after.board, activeRules(after))).toBe(true);
    expect(after.completed[id].stars).toBe(3);
    const restarted = loadLevel(after, id);
    expect(restarted.campaign).toBe(4);
    expect(restarted.remix).toBeUndefined();
    expect(restarted.board).toEqual(levels[id - 1].board);
  }
});
