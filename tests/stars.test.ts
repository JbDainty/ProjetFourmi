import { describe, expect, it } from 'vitest';
import { type Board, clone, key, pour, won } from '../src/engine/puzzle';
import { solveOptimal, remainingLowerBound, OptimalSearchLimit } from '../src/engine/optimal';
import { pageStars, starLimits } from '../src/state/stars';
import { initial, move, reward, restore } from '../src/state/model';
import levels from '../src/data/campaign';

// Independent breadth-first reference: no heuristic or move-pruning rules.
function breadthFirstMinimum(board: Board): number | null {
  const queue = [{ board, distance: 0 }],
    seen = new Set([key(board)]);
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const current = queue[cursor];
    if (won(current.board)) return current.distance;
    for (let from = 0; from < board.length; from++)
      for (let to = 0; to < board.length; to++) {
        const next = pour(current.board, from, to);
        if (!next || seen.has(key(next))) continue;
        seen.add(key(next));
        queue.push({ board: next, distance: current.distance + 1 });
      }
  }
  return null;
}

describe('minima exacts', () => {
  it('agrees with an independent breadth-first search on the first ten pages', () => {
    for (const level of levels.slice(0, 10)) {
      const exact = breadthFirstMinimum(level.board)!;
      expect(solveOptimal(level.board)?.minimum, `page ${level.id}`).toBe(exact);
      expect(level.par).toBe(exact);
      expect(remainingLowerBound(level.board)).toBeLessThanOrEqual(exact);
    }
  });
  it('certifies all 1000 stored minima and replays every physical tube index', () => {
    for (const level of levels) {
      const original = clone(level.board),
        exact = solveOptimal(level.board, { rules: level.rules })!;
      expect(exact.minimum, `page ${level.id}`).toBe(level.par);
      expect(level.solution).toHaveLength(level.par);
      let board = original;
      for (const m of exact.solution) board = pour(board, m.from, m.to, level.rules)!;
      expect(won(board, level.rules)).toBe(true);
      expect(level.board).toEqual(original);
    }
  });
  it('handles consolidation, colour/tube permutations and already completed pages', () => {
    const partial = [[0, 0], [1, 1, 1, 1], [0, 0], []];
    expect(solveOptimal(partial)?.minimum).toBe(1);
    const board = [...levels[0].board].reverse().map((tube) => tube.map((c) => (c === 0 ? 4 : 6)));
    expect(solveOptimal(board)?.minimum).toBe(breadthFirstMinimum(board));
    expect(solveOptimal([[0, 0, 0, 0], [], [1, 1, 1, 1]])?.minimum).toBe(0);
  });
  it('never returns a guessed minimum when a search budget or depth is exhausted', () => {
    expect(() => solveOptimal(levels[0].board, { maxNodes: 1 })).toThrow(OptimalSearchLimit);
    expect(() => solveOptimal(levels[0].board, { maxMoves: 3 })).toThrow(OptimalSearchLimit);
    expect(() => solveOptimal([[0], []])).toThrow('whole tubes');
  });
});

describe('barème basé sur le minimum', () => {
  it.each([
    [4, 5, 6],
    [10, 11, 15],
    [16, 18, 24],
    [19, 21, 28],
  ])('minimum %i gives exact boundaries %i / %i', (minimum, three, two) => {
    expect(starLimits(minimum)).toEqual({ three, two });
    expect(pageStars(minimum, minimum)).toBe(3);
    expect(pageStars(three, minimum)).toBe(3);
    expect(pageStars(three + 1, minimum)).toBe(2);
    expect(pageStars(two, minimum)).toBe(2);
    expect(pageStars(two + 1, minimum)).toBe(1);
  });
  it('preserves earned stars, completion dates, pigments and seeds on a poorer replay', () => {
    let save = initial();
    for (const m of levels[0].solution) save = move(save, m.from, m.to);
    const previous = restore(JSON.stringify(save));
    const slower = { ...previous, moves: 7 };
    expect(pageStars(slower.moves, levels[0].par)).toBe(1);
    const result = reward(slower);
    expect(result.completed).toEqual(previous.completed);
    expect(result.completed[1].stars).toBe(3);
    expect(result.pigments).toEqual(previous.pigments);
    expect(result.seeds).toBe(previous.seeds);
  });
});
