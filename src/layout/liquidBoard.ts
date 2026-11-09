import { GLASS_HEIGHT } from '../animation/liquid';

/** Fit complete glass, rack, number labels and the pouring headroom, with 44-point hit cells. */
export function liquidBoardLayout(width: number, maxHeight: number, count: number) {
  const maxColumns = Math.min(count, Math.max(1, Math.floor(width / 44)));
  let best = { columns: 1, rows: count, scale: 0, score: -Infinity };
  for (let columns = 1; columns <= maxColumns; columns++) {
    const rows = Math.ceil(count / columns);
    const scale = Math.max(
      0.05,
      Math.min(1.05, (width / columns - 6) / 56, (maxHeight - rows * 26 - 4) / (90 + rows * 180)),
    );
    const last = count - (rows - 1) * columns;
    const imbalance = (columns - last) / columns;
    const score = scale - rows * 0.025 - imbalance * 0.015;
    if (score > best.score) best = { columns, rows, scale, score };
  }
  const { columns, rows, scale } = best;
  const rowHeight = 180 * scale + 26,
    top = 90 * scale,
    height = top + rows * rowHeight + 4;
  const spacing = width / columns;
  const positions = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / columns),
      n = Math.min(columns, count - row * columns);
    return {
      x: (width - n * spacing) / 2 + ((i % columns) + 0.5) * spacing,
      y: top + row * rowHeight,
    };
  });
  return {
    columns,
    rows,
    scale,
    rowHeight,
    top,
    height,
    positions,
    glassHeight: GLASS_HEIGHT * scale,
  };
}
