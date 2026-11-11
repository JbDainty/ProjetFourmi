import { expect, it } from 'vitest';
import levels from '../src/data/campaign';
import { goalPacking } from '../src/engine/goalPacking';
import { findHintPath, hintSearch } from '../src/engine/hintSearch';
import { pour, won } from '../src/engine/puzzle';
import {
  currentHint,
  hintPurchased,
  initial,
  loadLevel,
  purchaseHint,
  restore,
} from '../src/state/model';
import { referencePacking, referencePour, referenceWon } from './reference-puzzle';
import type { Rules } from '../src/engine/mechanics';

export const photographed863 = [
  [0, 0, 0, 0],
  [3, 3, 3, 3],
  [],
  [],
  [1, 1, 1, 1],
  [2, 2, 2, 2],
  [4, 4, 4, 4],
  [0, 0],
];

it('finishes the photographed page 863 in four hints with strictly decreasing distances', async () => {
  const rules = levels[862].rules;
  let board = photographed863;
  const seen = new Set<string>();
  for (let distance = 4; distance > 0; distance--) {
    const code = JSON.stringify(board);
    expect(seen.has(code)).toBe(false);
    seen.add(code);
    const result = await findHintPath(board, rules);
    expect(result.status).toBe('found');
    if (result.status !== 'found') throw Error(result.status);
    expect(result.path.length).toBe(distance);
    board = referencePour(board, result.path[0].from, result.path[0].to, rules)!;
  }
  expect(referenceWon(board, rules)).toBe(true);
  expect(board[2]).toEqual([0, 0, 0]);
  expect(board[3]).toEqual([0, 0, 0]);
});

it('preserves ownership but replaces a legacy looping hint without spending another seed', async () => {
  const real = { ...initial(), started: true };
  let save = loadLevel({ ...real, testSession: { returnSave: real }, seeds: 0 }, 863);
  save = { ...save, board: photographed863, known: photographed863.map((t) => t.map(() => true)) };
  save.paidHints[`863|${JSON.stringify(save.board)}`] = {
    from: 0,
    to: 7,
    context: `4:${JSON.stringify(levels[862].rules)}`,
  };
  save = restore(JSON.stringify(save));
  expect(hintPurchased(save)).toBe(true);
  expect(currentHint(save)).toBeUndefined();
  const path = await findHintPath(save.board, levels[862].rules);
  if (path.status !== 'found') throw Error(path.status);
  const repaired = purchaseHint(save, path.path[0]);
  expect(repaired.seeds).toBe(0);
  expect(currentHint(repaired)).toEqual(path.path[0]);
  expect(purchaseHint(repaired, path.path[0])).toBe(repaired);
  expect(currentHint(restore(JSON.stringify(repaired)))).toEqual(path.path[0]);
});

it('independently replays every starting certificate and checks feasible small-tube goals at every step', () => {
  for (const level of levels) {
    const packing = goalPacking(level.board, level.rules);
    let board = level.board;
    for (let i = 0; i <= level.solution.length; i++) {
      const goal = packing(board);
      expect(goal.possible, `packing page ${level.id}, step ${i}`).toBe(true);
      expect(goal.lowerBound, `bound page ${level.id}, step ${i}`).toBeLessThanOrEqual(
        level.solution.length - i,
      );
      if (i === level.solution.length) break;
      const m = level.solution[i],
        next = referencePour(board, m.from, m.to, level.rules);
      expect(next, `independent transfer page ${level.id}, step ${i}`).not.toBeNull();
      expect(pour(board, m.from, m.to, level.rules)).toEqual(next);
      board = next!;
    }
    expect(referenceWon(board, level.rules), `goal page ${level.id}`).toBe(true);
  }
});

it('recognizes capacity conflicts created by irreversible collectors, keys and crystals', async () => {
  const capacities = [3, 3, 4, 4];
  const collector: Rules = { mechanics: ['capacity', 'conservation'], capacities, collectors: [3] };
  const board = [[0, 0, 1], [0, 0, 0], [1, 1, 1, 0], []];
  expect(goalPacking(board, collector)(board).possible).toBe(true);
  const trapped = referencePour(board, 2, 3, collector)!;
  expect(goalPacking(trapped, collector)(trapped).possible).toBe(false);
  expect((await findHintPath(trapped, collector)).status).toBe('blocked');
  const key: Rules = { mechanics: ['capacity', 'locks'], capacities, gates: [{ key: 0, tube: 3 }] };
  const badKey = [[1, 1, 1], [0, 0, 0], [1], [0, 0, 0]];
  expect((await findHintPath(badKey, key)).status).toBe('blocked');
  const crystal: Rules = {
    mechanics: ['capacity', 'crystal'],
    capacities,
    crystals: [{ tube: 1, depth: 0, color: 1 }],
  };
  expect((await findHintPath(badKey, crystal)).status).toBe('blocked');
});

it('agrees with exhaustive goal allocations on small rule combinations', () => {
  let seed = 863;
  const rnd = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let sample = 0; sample < 250; sample++) {
    const capacities = [2 + rnd(3), 2 + rnd(3), 4, 4];
    const board = capacities.map((cap) => Array.from({ length: rnd(cap + 1) }, () => rnd(2)));
    const rules: Rules = { mechanics: ['capacity'], capacities };
    if (sample % 3 === 0) rules.links = [[0, 2]];
    if (sample % 3 === 1) rules.collectors = [3];
    if (sample % 5 === 0) rules.gates = [{ key: 0, tube: 3 }];
    if (sample % 7 === 0) rules.crystals = [{ tube: 1, depth: 0, color: 1 }];
    if (sample % 11 === 0) rules.filters = [{ tube: 2, color: 1 }];
    expect(goalPacking(board, rules)(board).possible, JSON.stringify([board, rules])).toBe(
      referencePacking(board, rules),
    );
  }
});

it('distinguishes an interrupted or bounded search from a proof of impossibility', async () => {
  const controller = new AbortController();
  controller.abort();
  expect(
    (await findHintPath(photographed863, levels[862].rules, { signal: controller.signal })).status,
  ).toBe('cancelled');
  const run = hintSearch(photographed863, levels[862].rules, { maxNodes: 1 });
  let step = run.next();
  while (!step.done) step = run.next();
  expect(step.value.status).toBe('limit');
  expect(won(photographed863, levels[862].rules)).toBe(false);
});

it('matches independent breadth-first shortest solutions with mixed capacities and gates', async () => {
  const board = [[0, 0, 1], [0, 0, 0], [1, 1, 1, 0], []];
  const rulesets: Rules[] = [
    { mechanics: ['capacity'], capacities: [3, 3, 4, 4] },
    { mechanics: ['capacity', 'links'], capacities: [3, 3, 4, 4], links: [[0, 1]] },
    { mechanics: ['capacity', 'locks'], capacities: [3, 3, 4, 4], gates: [{ key: 0, tube: 3 }] },
    { mechanics: ['capacity', 'conservation'], capacities: [3, 3, 4, 4], collectors: [3] },
    {
      mechanics: ['capacity', 'filter'],
      capacities: [3, 3, 4, 4],
      filters: [{ tube: 3, color: 1 }],
    },
    { mechanics: ['capacity', 'pipette'], capacities: [3, 3, 4, 4], pipettes: [0, 1] },
    {
      mechanics: ['capacity', 'crystal'],
      capacities: [3, 3, 4, 4],
      crystals: [{ tube: 2, depth: 0, color: 0 }],
    },
  ];
  for (const rules of rulesets) {
    const queue = [{ board, distance: 0 }],
      seen = new Set([JSON.stringify(board)]);
    let shortest: number | undefined;
    for (let at = 0; at < queue.length; at++) {
      const item = queue[at];
      if (referenceWon(item.board, rules)) {
        shortest = item.distance;
        break;
      }
      for (let from = 0; from < board.length; from++)
        for (let to = 0; to < board.length; to++) {
          const next = referencePour(item.board, from, to, rules);
          if (!next || seen.has(JSON.stringify(next))) continue;
          seen.add(JSON.stringify(next));
          queue.push({ board: next, distance: item.distance + 1 });
        }
    }
    const result = await findHintPath(board, rules);
    expect(result.status, JSON.stringify(rules)).toBe(shortest === undefined ? 'blocked' : 'found');
    if (result.status === 'found') expect(result.path.length).toBe(shortest);
  }
  expect(goalPacking([[], []])([[], []]).possible).toBe(false);
});

it('lets the event loop cancel a long pipette search while it is running', async () => {
  const controller = new AbortController();
  const interrupt = setTimeout(() => controller.abort(), 0);
  try {
    const result = await findHintPath(
      [
        [1, 3, 5, 0],
        [4, 5, 0, 1],
        [2, 3, 6, 5],
        [2, 2, 4, 3],
        [0, 6, 5, 2],
        [3, 4, 6, 4],
        [1, 1, 6, 0],
        [],
        [],
      ],
      { mechanics: ['pipette'], pipettes: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
      { signal: controller.signal },
    );
    expect(result.status).toBe('cancelled');
  } finally {
    clearTimeout(interrupt);
  }
});
