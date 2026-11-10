import { expect, it } from 'vitest';
import { foliageSurfaces } from '../src/layout/foliage';

it('keeps long native page borders in small bitmap surfaces while covering every edge', () => {
  for (const [width, height] of [
    [320, 6000],
    [700, 5000],
    [1400, 1000],
    [350, 920],
  ]) {
    const surfaces = foliageSurfaces(width, height, true);
    let area = 0;
    for (const s of surfaces) {
      expect(s.width).toBeLessThanOrEqual(384);
      expect(s.height).toBeLessThanOrEqual(384);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.x + s.width).toBeLessThanOrEqual(width);
      expect(s.y + s.height).toBeLessThanOrEqual(height);
      area += s.width * s.height;
    }
    // This also bounds actual density-3 bitmap allocation, rather than only JS node count.
    expect(area).toBeLessThan(width * height * 0.3);
    for (let y = 0; y < height; y += 13)
      for (const x of [12, width - 12])
        expect(
          surfaces.some((s) => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height),
        ).toBe(true);
    for (let x = 0; x < width; x += 13)
      for (const y of [12, height - 12])
        expect(
          surfaces.some((s) => x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height),
        ).toBe(true);
  }
});

it('keeps one surface for browser pages and small native ornaments', () => {
  expect(foliageSurfaces(350, 6000, false)).toEqual([{ x: 0, y: 0, width: 350, height: 6000 }]);
  expect(foliageSurfaces(350, 100, true)).toEqual([{ x: 0, y: 0, width: 350, height: 100 }]);
  expect(foliageSurfaces(0, 100, true)).toEqual([]);
});
