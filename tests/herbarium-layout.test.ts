import { expect, it } from 'vitest';
import { herbariumLayout } from '../src/layout/herbarium';

const viewports = [
  [320, 400],
  [320, 568],
  [360, 640],
  [393, 852],
  [412, 915],
  [430, 932],
  [600, 960],
  [768, 1024],
  [820, 1180],
  [1024, 1366],
  [1024, 768],
  [1280, 900],
  [480, 280],
  [568, 320],
  [932, 430],
];
it('fits readable paginated books and pigments within phone/tablet safe-area viewports', () => {
  for (const [w, h] of viewports)
    for (const fontScale of [1, 1.3, 1.8]) {
      const l = herbariumLayout(w, h, fontScale);
      expect(l.gridWidth).toBeLessThanOrEqual(l.contentWidth + 0.01);
      expect(l.gridHeight + l.gap + l.pagerHeight).toBeLessThanOrEqual(l.bodyHeight + 0.01);
      expect(l.bookWidth).toBeGreaterThanOrEqual(100);
      expect(l.bookHeight).toBeGreaterThanOrEqual(75);
      expect(l.tabHeight).toBeGreaterThanOrEqual(44);
      expect(l.pagerHeight).toBeGreaterThanOrEqual(44);
      expect(
        l.pigmentColumns * l.pigmentWidth + (l.pigmentColumns - 1) * l.gap,
      ).toBeLessThanOrEqual(l.contentWidth + 0.01);
      expect(
        l.pigmentRows * l.pigmentHeight + l.pigmentRows * l.gap + l.pagerHeight,
      ).toBeLessThanOrEqual(l.bodyHeight + 0.01);
      expect(l.pigmentHeight).toBeGreaterThanOrEqual(75);
      expect(
        l.padding * 2 + l.hudHeight + l.tabHeight + l.summaryHeight + 12 + l.bodyHeight,
      ).toBeLessThanOrEqual(h + 0.01);
    }
});
it('uses fewer books on short displays and keeps a complete shelf on ordinary phones', () => {
  expect(herbariumLayout(320, 400).booksPerPage).toBe(2);
  expect(herbariumLayout(480, 280).booksPerPage).toBe(2);
  expect(herbariumLayout(320, 568).booksPerPage).toBe(4);
  expect(herbariumLayout(412, 915).booksPerPage).toBe(4);
  expect(herbariumLayout(412, 915, 1.8).booksPerPage).toBe(2);
  expect(herbariumLayout(932, 430).columns).toBe(4);
  expect(herbariumLayout(412, 915).pigmentsPerPage).toBe(8);
});
