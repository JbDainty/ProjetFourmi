import type { Save } from '../state/model';

export const ROW_HEIGHT = 132;
export const MAP_WIDTH = 360;
/** The explored route ends at the first unfinished page, even while replaying an old page. */
export function journeyFrontier(save: Save) {
  let id = 1;
  while (id < 100 && save.completed[id]) id++;
  return id;
}
export function journeyLayout(frontier: number, minimumHeight = 0) {
  const lastRow = Math.floor((frontier - 1) / 3);
  const height = Math.max(minimumHeight, 220 + lastRow * ROW_HEIGHT);
  const points = Array.from({ length: frontier }, (_, i) => {
    const row = Math.floor(i / 3);
    return {
      id: i + 1,
      x: row % 2 ? 292 - (i % 3) * 112 : 68 + (i % 3) * 112,
      y: height - 110 - row * ROW_HEIGHT,
    };
  });
  const path = points
    .map((p, i) => {
      if (!i) return `M${p.x} ${p.y}`;
      const previous = points[i - 1];
      return previous.y === p.y
        ? `L${p.x} ${p.y}`
        : `C${p.x + (p.x > 180 ? 65 : -65)} ${previous.y} ${p.x + (p.x > 180 ? 65 : -65)} ${p.y} ${p.x} ${p.y}`;
    })
    .join(' ');
  return { height, points, path };
}
