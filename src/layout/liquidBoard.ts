import { GLASS_HEIGHT } from '../animation/liquid';

/** Visual placement only: identities, save data and puzzle rules stay intact. */
export function vesselRows(
  count: number,
  columns: number,
  links: readonly (readonly number[])[] = [],
) {
  const groups: number[][] = [],
    seen = new Set<number>();
  for (let i = 0; i < count; i++) {
    if (seen.has(i)) continue;
    const group = [i];
    seen.add(i);
    for (let at = 0; at < group.length; at++)
      for (const pair of links) {
        if (!pair.includes(group[at])) continue;
        for (const tube of pair)
          if (tube >= 0 && tube < count && !seen.has(tube)) {
            seen.add(tube);
            group.push(tube);
          }
      }
    groups.push(group.sort((a, b) => a - b));
  }
  const pack = (ordered: number[][]) => {
    const rows = Array.from({ length: Math.ceil(count / columns) }, () => [] as number[]);
    for (const group of ordered) {
      const row = rows.findIndex(
        (r, i) => r.length + group.length <= Math.min(columns, count - i * columns),
      );
      if (row < 0) return null;
      rows[row].push(...group);
    }
    return rows;
  };
  return pack(groups) ?? pack(groups.slice().sort((a, b) => b.length - a.length || a[0] - b[0]));
}

/** Fit complete glass, rack, number labels and the pouring headroom, with 44-point hit cells. */
export function liquidBoardLayout(
  width: number,
  maxHeight: number,
  count: number,
  links: readonly (readonly number[])[] = [],
  overhang = 6,
) {
  const maxColumns = Math.min(count, Math.max(1, Math.floor(width / 44)));
  let best = { columns: 1, rows: count, scale: 0, score: -Infinity };
  for (let columns = 1; columns <= maxColumns; columns++) {
    if (!vesselRows(count, columns, links)) continue;
    const rows = Math.ceil(count / columns);
    const scale = Math.max(
      0.05,
      Math.min(
        (width / columns - 6) / 56,
        (maxHeight - rows * 26 - 4) / (90 + rows * 180),
        (maxHeight - rows * 20 - 4) / (90 + rows * (180 + overhang)),
      ),
    );
    const last = count - (rows - 1) * columns;
    const imbalance = (columns - last) / columns;
    const usedHeight =
      90 * scale + rows * Math.max(180 * scale + 26, (180 + overhang) * scale + 20) + 4;
    // Prefer readable glass, then reward a well occupied stage. A fixed scale ceiling
    // made six tubes stay in one tiny row on taller phones even with room for 3 + 3.
    const coverage = Math.min(1, usedHeight / maxHeight);
    const score = scale * (0.65 + 0.35 * coverage) - rows * 0.025 - imbalance * 0.015;
    if (score > best.score) best = { columns, rows, scale, score };
  }
  const { columns, rows, scale } = best;
  // Keep hit cells separated when the larger glass also makes them taller.
  const rowHeight = Math.max(180 * scale + 26, (180 + overhang) * scale + 20),
    top = 90 * scale,
    height = top + rows * rowHeight + 4;
  const spacing = width / columns;
  const arranged = vesselRows(count, columns, links) ?? vesselRows(count, columns)!;
  const positions = Array.from({ length: count }, () => ({ x: 0, y: 0, row: 0 }));
  arranged.forEach((tubes, row) =>
    tubes.forEach((tube, slot) => {
      positions[tube] = {
        x: (width - tubes.length * spacing) / 2 + (slot + 0.5) * spacing,
        y: top + row * rowHeight,
        row,
      };
    }),
  );
  for (const [a, b] of links) {
    if (!positions[a] || !positions[b] || positions[a].row !== positions[b].row) continue;
    const left = positions[a].x < positions[b].x ? a : b,
      right = left === a ? b : a;
    const distance = Math.min(spacing, Math.max(44, 56 * scale) + 6),
      middle = (positions[left].x + positions[right].x) / 2;
    positions[left].x = middle - distance / 2;
    positions[right].x = middle + distance / 2;
  }
  return {
    columns,
    rows,
    scale,
    rowHeight,
    top,
    height,
    positions,
    order: arranged.flat(),
    glassHeight: GLASS_HEIGHT * scale,
    touchTop: overhang * scale,
    touchHeight: (180 + overhang) * scale + 18,
  };
}
