import { describe, expect, it } from 'vitest';
import { journeyFrontier, journeyLayout } from '../src/journey/layout';
import { initial } from '../src/state/model';

describe('exploration path', () => {
  it('ends at the first unfinished page while replaying an older page', () => {
    const s = initial();
    for (let id = 1; id <= 42; id++) s.completed[id] = { stars: 2, date: '2026-11-08T00:00:00Z' };
    s.current = 3;
    expect(journeyFrontier(s)).toBe(43);
    expect(journeyLayout(journeyFrontier(s)).points.at(-1)?.id).toBe(43);
    expect(journeyLayout(journeyFrontier(s)).points.some((p) => p.id === 44)).toBe(false);
  });
  it('keeps every clickable medal inside the picture and its row, through page 100', () => {
    for (let count = 1; count <= 100; count++) {
      const { points, height, path } = journeyLayout(count, 500);
      expect(points).toHaveLength(count);
      for (const p of points) {
        expect(p.x).toBeGreaterThanOrEqual(37);
        expect(p.x).toBeLessThanOrEqual(323);
        expect(p.y - 37).toBeGreaterThanOrEqual(0);
        expect(p.y + 59).toBeLessThan(height);
      }
      expect(path).not.toMatch(/NaN|undefined/);
      expect(new Set(points.map((p) => `${p.x}/${p.y}`)).size).toBe(count);
    }
  });
  it('does not invent a page beyond the finished collection', () => {
    const s = initial();
    for (let id = 1; id <= 1000; id++) s.completed[id] = { stars: 3, date: '2026-11-08T00:00:00Z' };
    expect(journeyFrontier(s)).toBe(1000);
  });
});
