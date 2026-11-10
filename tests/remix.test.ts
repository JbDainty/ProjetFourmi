import { describe, it, expect } from 'vitest';
import levels from '../src/data/levels.json';
import { attemptPuzzle, validRemix } from '../src/engine/remix';
import {
  initial,
  loadLevel,
  move,
  remixPage,
  restore,
  undo,
  currentHint,
  purchaseHint,
} from '../src/state/model';
import { pour, won } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';

let seed = 91;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
let unlocked = initial();
for (const level of levels) {
  unlocked = loadLevel(unlocked, level.id);
  for (const m of level.solution) unlocked = move(unlocked, m.from, m.to);
}
describe('certified mixtures', () => {
  it('requires one seed and charges only a committed mixture, including the last seed', () => {
    const start = initial();
    const mixed = remixPage(start, random);
    expect(mixed.seeds).toBe(0);
    expect(mixed.remix).toBeDefined();
    expect(
      remixPage(mixed, () => {
        throw Error('No randomization without a seed');
      }),
    ).toBe(mixed);
    expect(restore(JSON.stringify(mixed)).seeds).toBe(0);
    expect(start.seeds).toBe(1);
    expect(start.remix).toBeUndefined();
  });
  it('keeps every page’s colors and tube count with a real solution and exact inherited minimum', () => {
    for (const level of levels)
      for (let i = 0; i < 3; i++) {
        const start = loadLevel(unlocked, level.id);
        const mixed = remixPage(start, random);
        expect(mixed.board).not.toEqual(start.board);
        expect(mixed.board.length).toBe(start.board.length);
        expect(mixed.board.flat().sort()).toEqual(start.board.flat().sort());
        expect(validRemix(level.id, mixed.remix!)).toBe(true);
        expect(mixed.seeds).toBe(start.seeds - 1);
        expect(mixed.completed).toEqual(start.completed);
        const attempt = attemptPuzzle(level.id, mixed.remix);
        expect(attempt.par).toBe(attempt.solution.length);
        let b = mixed.board;
        for (const m of attempt.solution) {
          const next = pour(b, m.from, m.to);
          expect(next).not.toBeNull();
          b = next!;
        }
        expect(won(b)).toBe(true);
        expect(restore(JSON.stringify(mixed))).toEqual(mixed);
      }
  });
  it('uses the mixture’s minimum for stars, spends hints once, supports undo, then restarts the original page', () => {
    let s = remixPage(loadLevel(unlocked, 32), random);
    const original = s;
    const puzzle = attemptPuzzle(s.current, s.remix);
    const paid = purchaseHint(s, puzzle.solution[0]);
    expect(currentHint(paid)).toEqual(puzzle.solution[0]);
    expect(purchaseHint(paid, puzzle.solution[0]).seeds).toBe(paid.seeds);
    const first = move(paid, puzzle.solution[0].from, puzzle.solution[0].to);
    expect(undo(first).board).toEqual(paid.board);
    for (const m of puzzle.solution) s = move(s, m.from, m.to);
    expect(s.completed[32].stars).toBe(3);
    expect(s.seeds).toBe(original.seeds + 1);
    expect(remixPage(s)).toBe(s);
    const again = loadLevel(s, 32);
    expect(again.remix).toBeUndefined();
    expect(again.board).toEqual(levels[31].board);
    expect(again.moves).toBe(0);
  });
  it('certifies a small remapped puzzle independently and rejects corrupt persisted permutations', () => {
    const s = remixPage(initial(), random);
    const puzzle = attemptPuzzle(1, s.remix);
    expect(solveOptimal(puzzle.board, { maxMoves: puzzle.par })?.solution.length).toBe(puzzle.par);
    expect(() =>
      restore(JSON.stringify({ ...s, remix: { ...s.remix, order: [0, 0, 2, 3] } })),
    ).toThrow('Mélange');
    const legacy = initial();
    delete legacy.settings.confirmHints;
    expect(restore(JSON.stringify(legacy)).settings.confirmHints).toBe(true);
    legacy.settings.confirmHints = false;
    expect(restore(JSON.stringify(legacy)).settings.confirmHints).toBe(false);
  });
});
