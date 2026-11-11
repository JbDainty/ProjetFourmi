import type { Board } from './puzzle';
import { capacity, completeTube } from './puzzle';
import type { Rules } from './mechanics';

export type Packing = { possible: boolean; lowerBound: number };
/** Enumerate capacity-compatible colour allocations, not arbitrary guesses that
 * every colour has four units. A linked 3/4 pair may require one member empty. */
export function goalPacking(initial: Board, rules?: Rules) {
  const count = initial.length,
    all = (1 << count) - 1;
  const inventory = new Map<number, number>();
  initial.flat().forEach((c) => inventory.set(c, (inventory.get(c) ?? 0) + 1));
  if (!inventory.size) return (): Packing => ({ possible: false, lowerBound: Infinity });
  const sums = new Uint8Array(1 << count);
  for (let mask = 1; mask <= all; mask++) {
    const bit = mask & -mask,
      tube = 31 - Math.clz32(bit);
    sums[mask] = sums[mask ^ bit] + capacity(rules, tube);
  }
  const colours = [...inventory].map(([colour, units]) => ({
    colour,
    units,
    masks: [] as number[],
  }));
  for (const item of colours)
    for (let mask = 1; mask <= all; mask++) {
      if (sums[mask] !== item.units) continue;
      if (rules?.filters?.some((f) => mask & (1 << f.tube) && f.color !== item.colour)) continue;
      item.masks.push(mask);
    }
  colours.sort((a, b) => a.masks.length - b.masks.length);
  const keyMask = (rules?.gates ?? []).reduce((mask, g) => mask | (1 << g.key), 0);
  const cache = new Map<string, number>();
  return (board: Board): Packing => {
    let blocks = 0;
    for (const t of board)
      for (let d = 0; d < t.length; d++) if (d === 0 || t[d] !== t[d - 1]) blocks++;
    const forced = new Map<number, number>();
    for (let i = 0; i < count; i++) {
      const t = board[i];
      if (t.length > capacity(rules, i)) return { possible: false, lowerBound: Infinity };
      if (rules?.collectors?.includes(i) && t.length) {
        if (t.some((c) => c !== t[0])) return { possible: false, lowerBound: Infinity };
        forced.set(i, t[0]);
      }
      if (
        completeTube(board, i, rules) &&
        (keyMask & (1 << i) || rules?.crystals?.some((c) => c.color === t[0]))
      )
        forced.set(i, t[0]);
    }
    const code = JSON.stringify([board.map((t) => t[0] ?? -1), [...forced]]);
    let kept = cache.get(code);
    if (kept === undefined) {
      const forcedMask = [...forced.keys()].reduce((mask, i) => mask | (1 << i), 0);
      const domains = colours.map((item) => ({
        ...item,
        masks: item.masks.filter((mask) => {
          for (const [i, c] of forced)
            if (((mask & (1 << i)) !== 0) !== (c === item.colour)) return false;
          return true;
        }),
      }));
      const memo = new Map<string, number>();
      const visit = (at: number, used: number, empty: number): number => {
        if (at === domains.length)
          return (used & (keyMask | forcedMask)) === (keyMask | forcedMask) ? 0 : -Infinity;
        const state = `${at}/${used}/${empty}`;
        const cached = memo.get(state);
        if (cached !== undefined) return cached;
        const item = domains[at];
        let best = -Infinity;
        for (const mask of item.masks) {
          if (mask & (used | empty)) continue;
          let cannotFill = empty;
          for (const [a, b] of rules?.links ?? []) {
            if (mask & (1 << a) && !(mask & (1 << b))) cannotFill |= 1 << b;
            if (mask & (1 << b) && !(mask & (1 << a))) cannotFill |= 1 << a;
          }
          if (cannotFill & (used | keyMask | forcedMask)) continue;
          let benefit = 0;
          for (let i = 0; i < count; i++)
            if (mask & (1 << i) && board[i][0] === item.colour) benefit++;
          best = Math.max(best, benefit + visit(at + 1, used | mask, cannotFill));
        }
        memo.set(state, best);
        return best;
      };
      kept = visit(0, 0, 0);
      if (cache.size > 2048) cache.clear();
      cache.set(code, kept);
    }
    // For any final allocation, every block above a retained matching bottom
    // block must leave its source. One gesture removes at most one such block.
    return Number.isFinite(kept)
      ? { possible: true, lowerBound: Math.max(0, blocks - kept) }
      : { possible: false, lowerBound: Infinity };
  };
}
