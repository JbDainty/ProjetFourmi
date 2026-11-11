import type { Rules } from './mechanics';
import { capacity, pour, won, type Board, type Move } from './puzzle';
import { goalPacking } from './goalPacking';

export type HintSearchResult =
  | { status: 'found'; path: Move[]; expanded: number }
  | { status: 'blocked' | 'limit' | 'cancelled'; expanded: number };
type Options = { maxNodes?: number; maxDepth?: number; signal?: AbortSignal };

/** Interchange only vessels with identical roles. Linked/keyed vessels keep
 * their exact identity; small and large capacities are never interchangeable. */
function stateKey(rules: Rules | undefined, count: number) {
  if (rules?.links?.length || rules?.gates?.length) return (b: Board) => JSON.stringify(b);
  const groups = new Map<string, number[]>();
  for (let i = 0; i < count; i++) {
    const role = JSON.stringify([
      capacity(rules, i),
      !!rules?.pipettes?.includes(i),
      !!rules?.collectors?.includes(i),
      rules?.filters?.filter((f) => f.tube === i).map((f) => f.color),
      rules?.crystals?.filter((c) => c.tube === i).map((c) => [c.depth, c.color]),
    ]);
    const group = groups.get(role) ?? [];
    group.push(i);
    groups.set(role, group);
  }
  return (b: Board) =>
    JSON.stringify([...groups.values()].map((g) => g.map((i) => b[i].join(',')).sort()));
}

/** IDA* returns a shortest continuation, so each purchased hint strictly reduces
 * the remaining distance. A global visited set in unbounded DFS cannot do this. */
export function* hintSearch(
  board: Board,
  rules?: Rules,
  options: Options = {},
): Generator<void, HintSearchResult> {
  const key = stateKey(rules, board.length),
    packing = goalPacking(board, rules);
  const start = packing(board);
  let expanded = 0;
  if (!start.possible) return { status: 'blocked', expanded };
  const path: Move[] = [],
    maxNodes = options.maxNodes ?? 100000,
    maxDepth = options.maxDepth ?? 80;
  let cancelled = false,
    limited = false;
  for (let bound = start.lowerBound; bound <= maxDepth;) {
    const seen = new Map<string, number>();
    let nextBound = Infinity;
    function* search(current: Board, depth: number, estimate: number): Generator<void, boolean> {
      if (options.signal?.aborted) {
        cancelled = true;
        return false;
      }
      if (++expanded > maxNodes) {
        limited = true;
        return false;
      }
      if ((expanded & 7) === 0) yield;
      if (depth + estimate > bound) {
        nextBound = Math.min(nextBound, depth + estimate);
        return false;
      }
      if (won(current, rules)) return true;
      const encoded = key(current),
        left = bound - depth;
      if ((seen.get(encoded) ?? -1) >= left) return false;
      seen.set(encoded, left);
      const children: { board: Board; move: Move; estimate: number }[] = [];
      const equivalent = new Set([encoded]);
      for (let from = 0; from < current.length; from++)
        for (let to = 0; to < current.length; to++) {
          const next = pour(current, from, to, rules);
          if (!next) continue;
          const encodedNext = key(next);
          if (equivalent.has(encodedNext)) continue;
          equivalent.add(encodedNext);
          const goal = packing(next);
          if (!goal.possible || (seen.has(encodedNext) && seen.get(encodedNext)! >= left - 1))
            continue;
          if (depth + 1 + goal.lowerBound > bound) {
            nextBound = Math.min(nextBound, depth + 1 + goal.lowerBound);
            continue;
          }
          children.push({ board: next, move: { from, to }, estimate: goal.lowerBound });
        }
      children.sort((a, b) => a.estimate - b.estimate);
      for (const child of children) {
        path.push(child.move);
        if (yield* search(child.board, depth + 1, child.estimate)) return true;
        path.pop();
        if (cancelled || limited) return false;
      }
      return false;
    }
    if (yield* search(board, 0, start.lowerBound))
      return { status: 'found', path: path.slice(), expanded };
    if (cancelled) return { status: 'cancelled', expanded };
    if (limited) return { status: 'limit', expanded };
    // No cutoff means every reachable continuation was exhausted, rather than
    // merely excluded by the current depth bound or the work/time budget.
    if (!Number.isFinite(nextBound)) return { status: 'blocked', expanded };
    bound = nextBound;
  }
  return { status: 'limit', expanded };
}

export async function findHintPath(
  board: Board,
  rules?: Rules,
  options: Options & { maxMs?: number } = {},
): Promise<HintSearchResult> {
  const context = JSON.stringify(rules ?? null),
    encoded = `${context}|${JSON.stringify(board)}`;
  if (options.signal?.aborted) return { status: 'cancelled', expanded: 0 };
  const cached = planCache.get(encoded);
  if (cached) return { status: 'found', path: cached.map((m) => ({ ...m })), expanded: 0 };
  const run = hintSearch(board, rules, options),
    start = Date.now();
  let slice = start;
  while (true) {
    if (options.signal?.aborted) {
      run.return({ status: 'cancelled', expanded: 0 });
      return { status: 'cancelled', expanded: 0 };
    }
    const step = run.next();
    if (step.done) {
      if (step.value.status === 'found') {
        let state = board;
        for (let i = 0; i < step.value.path.length; i++) {
          planCache.set(`${context}|${JSON.stringify(state)}`, step.value.path.slice(i));
          state = pour(state, step.value.path[i].from, step.value.path[i].to, rules)!;
        }
        while (planCache.size > 192) planCache.delete(planCache.keys().next().value!);
      }
      return step.value;
    }
    const now = Date.now();
    if (now - start > (options.maxMs ?? 1600)) {
      run.return({ status: 'limit', expanded: 0 });
      return { status: 'limit', expanded: 0 };
    }
    if (now - slice >= 6) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      slice = Date.now();
    }
  }
}
const planCache = new Map<string, Move[]>();
