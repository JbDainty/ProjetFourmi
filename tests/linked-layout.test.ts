import { expect, it } from 'vitest';
import levels, { campaign3Levels } from '../src/data/campaign';
import { newRemix, attemptPuzzle } from '../src/engine/remix';
import { liquidBoardLayout, vesselRows } from '../src/layout/liquidBoard';

it('keeps linked vessels adjacent for current, archived and remixed attempts without renumbering', () => {
  let seed = 980;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (const [pool, archived] of [
    [levels, false],
    [campaign3Levels, true],
  ] as const) {
    for (const level of pool.filter((l) => l.rules?.links?.length)) {
      const samples = [level];
      for (let i = 0; i < 3; i++)
        samples.push(
          attemptPuzzle(
            level.id,
            newRemix(
              level.id,
              archived
                ? {
                    level: level.id,
                    order: level.board.map((_, j) => j),
                    colors: [...new Set(level.board.flat())].sort(),
                    campaign: 3,
                  }
                : undefined,
              random,
            ),
          ),
        );
      for (const sample of samples) {
        const untouched = JSON.stringify(sample);
        for (const [width, height] of [
          [304, 220],
          [396, 560],
          [736, 700],
          [916, 180],
        ]) {
          const fit = liquidBoardLayout(
            width,
            height,
            sample.board.length,
            sample.rules?.links,
            sample.rules?.pipettes?.length || sample.rules?.gates?.length ? 20 : 6,
          );
          expect(new Set(fit.order).size).toBe(sample.board.length);
          for (const [a, b] of sample.rules!.links!) {
            const one = fit.positions[a],
              two = fit.positions[b];
            expect(one.y).toBe(two.y);
            expect(Math.abs(fit.order.indexOf(a) - fit.order.indexOf(b))).toBe(1);
            expect(Math.abs(one.x - two.x)).toBeGreaterThanOrEqual(
              Math.max(44, 56 * fit.scale) - 0.01,
            );
            expect(Math.abs(one.x - two.x)).toBeLessThanOrEqual(
              Math.max(44, 56 * fit.scale) + 6.01,
            );
          }
        }
        expect(JSON.stringify(sample)).toBe(untouched);
      }
    }
  }
});

it('packs several pairs without splitting a shared fitting across rack rows', () => {
  const links = [
    [0, 7],
    [1, 6],
    [2, 5],
  ];
  const rows = vesselRows(8, 4, links)!;
  expect(rows.map((r) => r.length)).toEqual([4, 4]);
  for (const [a, b] of links) expect(rows.some((r) => r.includes(a) && r.includes(b))).toBe(true);
});
