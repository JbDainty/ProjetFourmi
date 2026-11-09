import { describe, it, expect } from 'vitest';
import { workshopLayout } from '../src/layout/workshop';
import { liquidBoardLayout } from '../src/layout/liquidBoard';
import levels from '../src/data/levels.json';
const viewports = [
  [320, 400],
  [320, 480],
  [360, 640],
  [393, 760],
  [393, 852],
  [412, 915],
  [430, 932],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [1024, 768],
  [1280, 900],
  [480, 280],
  [568, 320],
  [932, 430],
];
describe('fixed workshop composition', () => {
  it('fits every level at phone and tablet sizes with separated 44-point touch targets', () => {
    for (const [width, height] of viewports)
      for (const fontScale of [1, 1.3])
        for (const level of levels) {
          const layout = workshopLayout(width, width, {
            height,
            tubes: level.board.length,
            fontScale,
            hintHeight: fontScale === 1 ? 56 : 63,
          });
          const board = liquidBoardLayout(
            layout.boardWidth,
            layout.boardHeight,
            level.board.length,
          );
          expect(board.height, `${width}×${height} page ${level.id}`).toBeLessThanOrEqual(
            layout.boardHeight + 0.001,
          );
          const targets = board.positions.map((p) => ({
            x: p.x - Math.max(44, 56 * board.scale) / 2,
            y: p.y - 6 * board.scale,
            w: Math.max(44, 56 * board.scale),
            h: 186 * board.scale + 18,
          }));
          for (const t of targets) {
            expect(t.x).toBeGreaterThanOrEqual(-0.01);
            expect(t.x + t.w).toBeLessThanOrEqual(layout.boardWidth + 0.01);
            expect(t.y).toBeGreaterThanOrEqual(0);
            expect(t.y + t.h).toBeLessThanOrEqual(board.height);
            expect(t.w).toBeGreaterThanOrEqual(44);
            expect(t.h).toBeGreaterThanOrEqual(44);
          }
          for (let a = 0; a < targets.length; a++)
            for (let b = a + 1; b < targets.length; b++) {
              const one = targets[a],
                two = targets[b];
              const overlapX = Math.min(one.x + one.w, two.x + two.w) - Math.max(one.x, two.x);
              const overlapY = Math.min(one.y + one.h, two.y + two.h) - Math.max(one.y, two.y);
              expect(overlapX > 0 && overlapY > 0).toBe(false);
            }
        }
  });
  it('avoids a five-plus-one rack when six tubes fit one row or balanced rows', () => {
    for (const maxHeight of [240, 350, 500]) {
      const b = liquidBoardLayout(377, maxHeight, 6);
      expect([3, 6]).toContain(b.columns);
    }
  });
  it('uses the height of tall phones for six tubes instead of capping their size', () => {
    for (const [width, height] of [
      [393, 852],
      [412, 915],
      [430, 932],
      [480, 1000],
    ]) {
      const space = workshopLayout(width, width, {
        height,
        tubes: 6,
        fontScale: 1,
      });
      const board = liquidBoardLayout(space.boardWidth, space.boardHeight, 6);
      expect(board.columns).toBe(3);
      expect(board.rows).toBe(2);
      expect(board.height / space.boardHeight).toBeGreaterThan(0.95);
      expect(board.scale).toBeGreaterThan(1.05);
    }
  });
  it('adapts tube size and row count to both the level and available space', () => {
    const early = liquidBoardLayout(396, 600, 4);
    const full = liquidBoardLayout(396, 600, 9);
    expect(early.rows).toBe(1);
    expect(full.rows).toBe(2);
    expect(early.glassHeight).toBeGreaterThan(full.glassHeight);
    expect(liquidBoardLayout(396, 650, 6).glassHeight).toBeGreaterThan(
      liquidBoardLayout(396, 500, 6).glassHeight,
    );
    // A short landscape still uses a single row when there is no height for two.
    expect(liquidBoardLayout(800, 200, 6).rows).toBe(1);
  });
});
