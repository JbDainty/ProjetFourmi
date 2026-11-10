import type { Rules } from './mechanics';
export const CAPACITY = 4;
export type Board = number[][]; // bottom → top
export type Move = { from: number; to: number };
export const clone = (b: Board): Board => b.map((t) => [...t]);
export const capacity = (rules: Rules | undefined, tube: number) =>
  rules?.capacities?.[tube] ?? CAPACITY;
export const completeTube = (board: Board, i: number, rules?: Rules) =>
  board[i]?.length === capacity(rules, i) && board[i].every((c) => c === board[i][0]);
export const gateOpen = (board: Board, key: number, rules?: Rules) =>
  completeTube(board, key, rules);
export const crystalOpen = (board: Board, color: number, rules?: Rules) =>
  board.some((t, i) => t[0] === color && completeTube(board, i, rules));
export const blocked = (board: Board, i: number, rules?: Rules) =>
  !!rules?.gates?.some((g) => g.tube === i && !gateOpen(board, g.key, rules));
export function pour(board: Board, from: number, to: number, rules?: Rules): Board | null {
  if (from === to || !board[from]?.length || !board[to] || board[to].length >= capacity(rules, to))
    return null;
  if (blocked(board, from, rules) || blocked(board, to, rules) || rules?.collectors?.includes(from))
    return null;
  if (
    completeTube(board, from, rules) &&
    (rules?.gates?.some((g) => g.key === from) ||
      rules?.crystals?.some((c) => c.color === board[from][0]))
  )
    return null;
  const a = board[from],
    b = board[to],
    color = a[a.length - 1];
  if (b.length && b[b.length - 1] !== color) return null;
  if (rules?.filters?.some((f) => f.tube === to && f.color !== color)) return null;
  if (
    rules?.links?.some(
      ([x, y]) =>
        (x === to && board[y].length > 0 && board[y].at(-1) !== color) ||
        (y === to && board[x].length > 0 && board[x].at(-1) !== color),
    )
  )
    return null;
  const frozen =
    rules?.crystals?.filter((c) => c.tube === from && !crystalOpen(board, c.color, rules)) ?? [];
  const movable = frozen.reduce((n, c) => Math.min(n, a.length - 1 - c.depth), a.length);
  if (movable <= 0) return null;
  let run = 1;
  while (run < a.length && a[a.length - 1 - run] === color) run++;
  const count = Math.min(
      run,
      capacity(rules, to) - b.length,
      movable,
      rules?.pipettes?.includes(from) ? 1 : CAPACITY,
    ),
    next = clone(board);
  next[from].splice(-count);
  next[to].push(...Array<number>(count).fill(color));
  return next;
}
export const won = (b: Board, rules?: Rules): boolean =>
  b.length > 0 &&
  b.some((t) => t.length) &&
  b.every((t, i) => t.length === 0 || completeTube(b, i, rules)) &&
  !rules?.filters?.some((f) => b[f.tube].length > 0 && b[f.tube][0] !== f.color) &&
  !rules?.links?.some(([a, c]) => b[a].length > 0 && b[c].length > 0 && b[a][0] !== b[c][0]) &&
  !rules?.gates?.some((g) => !gateOpen(b, g.key, rules)) &&
  !rules?.crystals?.some((c) => !crystalOpen(b, c.color, rules));
export function moves(b: Board, rules?: Rules): Move[] {
  const result: Move[] = [];
  let emptyUsed = -1;
  for (let j = 0; j < b.length; j++) {
    if (!b[j].length) {
      if (!rules && emptyUsed >= 0) continue;
      emptyUsed = j;
    }
    for (let i = 0; i < b.length; i++) {
      if (!rules && !b[j].length && b[i].every((c) => c === b[i][0])) continue;
      if (pour(b, i, j, rules)) result.push({ from: i, to: j });
    }
  }
  return result.sort((a, c) => (b[c.to].length ? 1 : 0) - (b[a.to].length ? 1 : 0));
}
export const key = (b: Board) =>
  b
    .map((t) => t.join(','))
    .sort()
    .join('|');
export function solve(board: Board, budget = 250000, rules?: Rules): Move[] | null {
  const seen = new Set<string>();
  let visited = 0;
  function dfs(b: Board, depth: number): Move[] | null {
    if (won(b, rules)) return [];
    if (depth > 140 || ++visited > budget) return null;
    const k = rules ? JSON.stringify(b) : key(b);
    if (seen.has(k)) return null;
    seen.add(k);
    for (const m of moves(b, rules)) {
      const path = dfs(pour(b, m.from, m.to, rules)!, depth + 1);
      if (path) return [m, ...path];
    }
    return null;
  }
  return dfs(board, 0);
}
