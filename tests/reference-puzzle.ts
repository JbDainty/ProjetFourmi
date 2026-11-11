import type { Rules } from '../src/engine/mechanics';
type Board = number[][];
const limit = (r: Rules | undefined, i: number) => r?.capacities?.[i] ?? 4;
const full = (b: Board, r: Rules | undefined, i: number) =>
  b[i].length === limit(r, i) && new Set(b[i]).size === 1;
const colourReady = (b: Board, r: Rules | undefined, c: number) =>
  b.some((t, i) => t[0] === c && full(b, r, i));

/** Separate implementation of the rules, without calling production pour/won. */
export function referencePour(b: Board, from: number, to: number, r?: Rules): Board | null {
  if (from === to || !b[from]?.length || !b[to] || b[to].length >= limit(r, to)) return null;
  if ((r?.gates ?? []).some((g) => (g.tube === from || g.tube === to) && !full(b, r, g.key)))
    return null;
  if (r?.collectors?.includes(from)) return null;
  if (
    full(b, r, from) &&
    ((r?.gates ?? []).some((g) => g.key === from) ||
      (r?.crystals ?? []).some((c) => c.color === b[from][0]))
  )
    return null;
  const source = b[from],
    target = b[to],
    shade = source[source.length - 1];
  if (target.length && target[target.length - 1] !== shade) return null;
  if ((r?.filters ?? []).some((f) => f.tube === to && f.color !== shade)) return null;
  for (const pair of r?.links ?? [])
    if (pair.includes(to)) {
      const other = pair[0] === to ? pair[1] : pair[0];
      if (b[other].length && b[other][b[other].length - 1] !== shade) return null;
    }
  let n = 0;
  for (let d = source.length - 1; d >= 0 && source[d] === shade; d--) {
    if (
      (r?.crystals ?? []).some(
        (c) => c.tube === from && d <= c.depth && !colourReady(b, r, c.color),
      )
    )
      break;
    n++;
  }
  n = Math.min(n, limit(r, to) - target.length, r?.pipettes?.includes(from) ? 1 : 4);
  if (!n) return null;
  const next = b.map((t) => t.slice());
  next[from].length -= n;
  for (let i = 0; i < n; i++) next[to].push(shade);
  return next;
}
export function referenceWon(b: Board, r?: Rules) {
  if (!b.some((t) => t.length) || b.some((t, i) => t.length > 0 && !full(b, r, i))) return false;
  if ((r?.gates ?? []).some((g) => !full(b, r, g.key))) return false;
  if ((r?.crystals ?? []).some((c) => !colourReady(b, r, c.color))) return false;
  if ((r?.filters ?? []).some((f) => b[f.tube].length && b[f.tube][0] !== f.color)) return false;
  if ((r?.links ?? []).some(([a, c]) => b[a].length && b[c].length && b[a][0] !== b[c][0]))
    return false;
  return true;
}
/** Exhaustive goal allocation for tiny fixtures, independently of the mask DP. */
export function referencePacking(board: Board, r?: Rules) {
  const counts = new Map<number, number>();
  board.flat().forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
  const forced = new Map<number, number>();
  for (let i = 0; i < board.length; i++) {
    if (r?.collectors?.includes(i) && board[i].length) {
      if (new Set(board[i]).size !== 1) return false;
      forced.set(i, board[i][0]);
    }
    if (
      full(board, r, i) &&
      ((r?.gates ?? []).some((g) => g.key === i) ||
        (r?.crystals ?? []).some((c) => c.color === board[i][0]))
    )
      forced.set(i, board[i][0]);
  }
  const goal: Board = [];
  const assign = (i: number): boolean => {
    if (i === board.length)
      return [...counts.values()].every((n) => n === 0) && referenceWon(goal, r);
    if (!forced.has(i)) {
      goal[i] = [];
      if (assign(i + 1)) return true;
    }
    for (const [c, n] of counts) {
      if (n < limit(r, i) || (forced.has(i) && forced.get(i) !== c)) continue;
      counts.set(c, n - limit(r, i));
      goal[i] = Array(limit(r, i)).fill(c);
      if (assign(i + 1)) return true;
      counts.set(c, n);
    }
    return false;
  };
  return assign(0);
}
