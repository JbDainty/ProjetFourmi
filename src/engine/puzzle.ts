export const CAPACITY = 4;
export type Board = number[][]; // bottom → top
export type Move = { from: number; to: number };
export const clone = (b: Board): Board => b.map((t) => [...t]);
export function pour(board: Board, from: number, to: number): Board | null {
  if (from === to || !board[from]?.length || !board[to] || board[to].length >= CAPACITY)
    return null;
  const a = board[from],
    b = board[to],
    color = a[a.length - 1];
  if (b.length && b[b.length - 1] !== color) return null;
  let run = 1;
  while (run < a.length && a[a.length - 1 - run] === color) run++;
  const count = Math.min(run, CAPACITY - b.length),
    next = clone(board);
  next[from].splice(-count);
  next[to].push(...Array<number>(count).fill(color));
  return next;
}
export const won = (b: Board): boolean =>
  b.length > 0 &&
  b.some((t) => t.length) &&
  b.every((t) => t.length === 0 || t.every((c) => c === t[0]));
export function moves(b: Board): Move[] {
  const result: Move[] = [];
  let emptyUsed = -1;
  for (let j = 0; j < b.length; j++) {
    if (!b[j].length) {
      if (emptyUsed >= 0) continue;
      emptyUsed = j;
    }
    for (let i = 0; i < b.length; i++) {
      if (!b[j].length && b[i].every((c) => c === b[i][0])) continue;
      if (pour(b, i, j)) result.push({ from: i, to: j });
    }
  }
  return result.sort((a, c) => (b[c.to].length ? 1 : 0) - (b[a.to].length ? 1 : 0));
}
export const key = (b: Board) =>
  b
    .map((t) => t.join(','))
    .sort()
    .join('|');
export function solve(board: Board, budget = 250000): Move[] | null {
  const seen = new Set<string>();
  let visited = 0;
  function dfs(b: Board, depth: number): Move[] | null {
    if (won(b)) return [];
    if (depth > 140 || ++visited > budget) return null;
    const k = key(b);
    if (seen.has(k)) return null;
    seen.add(k);
    for (const m of moves(b)) {
      const path = dfs(pour(b, m.from, m.to)!, depth + 1);
      if (path) return [m, ...path];
    }
    return null;
  }
  return dfs(board, 0);
}
