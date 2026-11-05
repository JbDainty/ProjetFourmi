import { type Board, type Move, CAPACITY, clone, key, pour, won } from './puzzle';

export type OptimalResult = {
  solution: Move[];
  minimum: number;
  lowerBound: number;
  expanded: number;
  boundsChecked: number;
};
export class OptimalSearchLimit extends Error {}

/** A pour can remove at most one colour block. Every final tube has one block. */
export function remainingLowerBound(board: Board): number {
  let blocks = 0,
    units = 0;
  for (const tube of board) {
    units += tube.length;
    for (let i = 0; i < tube.length; i++) if (i === 0 || tube[i] !== tube[i - 1]) blocks++;
  }
  return Math.max(0, blocks - units / CAPACITY);
}

/** Offline IDA*: exhaust every smaller cost before accepting a solution.
 * Tube permutations are equivalent; identity moves and equivalent children can
 * be discarded without discarding any distinct position or shorter solution.
 * A search limit throws; it must never turn an approximate path into a minimum.
 */
export function solveOptimal(
  board: Board,
  options: { maxNodes?: number; maxMoves?: number } = {},
): OptimalResult | null {
  const { maxNodes = 5_000_000, maxMoves = 140 } = options;
  const counts = new Map<number, number>();
  for (const tube of board) {
    if (tube.length > CAPACITY) throw Error('Invalid tube capacity');
    for (const color of tube) counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  if (!counts.size || [...counts.values()].some((count) => count % CAPACITY !== 0))
    throw Error('Every colour must fill whole tubes');
  const lowerBound = remainingLowerBound(board);
  let expanded = 0;
  const path: Move[] = [];
  for (let bound = lowerBound; bound <= maxMoves; bound++) {
    const seen = new Map<string, number>();
    function search(current: Board, depth: number): boolean {
      if (++expanded > maxNodes)
        throw new OptimalSearchLimit(`Exact search exceeded ${maxNodes} nodes`);
      if (depth + remainingLowerBound(current) > bound) return false;
      if (won(current)) return true;
      const position = key(current),
        remaining = bound - depth;
      if ((seen.get(position) ?? -1) >= remaining) return false;
      seen.set(position, remaining);
      if (!remaining) return false;
      const children: { board: Board; move: Move; estimate: number }[] = [];
      const equivalent = new Set<string>([position]);
      for (let from = 0; from < current.length; from++) {
        for (let to = 0; to < current.length; to++) {
          const next = pour(current, from, to);
          if (!next) continue;
          const estimate = remainingLowerBound(next);
          if (depth + 1 + estimate > bound) continue;
          const nextKey = key(next);
          if (equivalent.has(nextKey)) continue;
          equivalent.add(nextKey);
          children.push({ board: next, move: { from, to }, estimate });
        }
      }
      children.sort((a, b) => a.estimate - b.estimate);
      for (const child of children) {
        path.push(child.move);
        if (search(child.board, depth + 1)) return true;
        path.pop();
      }
      return false;
    }
    if (search(clone(board), 0))
      return {
        solution: path.slice(),
        minimum: path.length,
        lowerBound,
        expanded,
        boundsChecked: bound - lowerBound + 1,
      };
  }
  // The configured depth is not a proof of global impossibility either.
  throw new OptimalSearchLimit(`No exact solution within ${maxMoves} moves`);
}
