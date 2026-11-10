import levels, { legacyLevels, campaign3Levels, type Level } from '../data/campaign';
import { difficultyProfile } from '../data/difficulty';
import { pour, type Board, type Move } from './puzzle';
import type { Rules } from './mechanics';
export type Remix = {
  level: number;
  order: number[];
  colors: number[];
  legacy?: boolean;
  campaign?: 3;
};
export const campaignPool = (remix?: Remix) =>
  remix?.legacy ? legacyLevels : remix?.campaign === 3 ? campaign3Levels : levels;
const permutation = (a: unknown, n: number): a is number[] =>
  Array.isArray(a) &&
  a.length === n &&
  new Set(a).size === n &&
  a.every((i) => Number.isInteger(i) && i >= 0 && i < n);
const inventory = (b: Board) =>
  b
    .flat()
    .sort((a, b) => a - b)
    .join(',');
const signatureCache = new WeakMap<Level, string>();
const signature = (l: Level) => {
  const cached = signatureCache.get(l);
  if (cached) return cached;
  const value = JSON.stringify([
    l.rules?.mechanics.slice().sort() ?? [],
    l.board.length,
    l.board.flat().reduce((a, c) => {
      a[c] = (a[c] ?? 0) + 1;
      return a;
    }, [] as number[]),
    [
      l.rules?.mystery?.length,
      l.rules?.gates?.length,
      l.rules?.crystals?.length,
      l.rules?.links?.length,
      l.rules?.pipettes?.length,
      l.rules?.filters?.length,
      l.rules?.collectors?.length,
    ],
    l.rules?.capacities?.slice().sort(),
  ]);
  signatureCache.set(l, value);
  return value;
};
export function validRemix(page: number, value: Remix): boolean {
  if (value?.campaign !== undefined && (value.campaign !== 3 || value.legacy)) return false;
  const pool = campaignPool(value),
    source = pool[value?.level - 1],
    original = pool[page - 1];
  if (
    !source ||
    !original ||
    signature(source) !== signature(original) ||
    !permutation(value.order, original.board.length) ||
    !permutation(value.colors, new Set(original.board.flat()).size)
  )
    return false;
  return (
    inventory(source.board.map((t) => t.map((c) => value.colors[c]))) === inventory(original.board)
  );
}
function remapRules(r: Rules | undefined, m: Remix): Rules | undefined {
  if (!r) return;
  const at = (i: number) => m.order.indexOf(i),
    col = (c: number) => m.colors[c];
  return {
    ...r,
    capacities: r.capacities ? m.order.map((i) => r.capacities![i]) : undefined,
    mystery: r.mystery?.map(at),
    gates: r.gates?.map((g) => ({ tube: at(g.tube), key: at(g.key) })),
    crystals: r.crystals?.map((c) => ({ ...c, tube: at(c.tube), color: col(c.color) })),
    links: r.links?.map(([a, b]) => [at(a), at(b)]),
    pipettes: r.pipettes?.map(at),
    filters: r.filters?.map((f) => ({ tube: at(f.tube), color: col(f.color) })),
    collectors: r.collectors?.map(at),
  };
}
export function attemptPuzzle(page: number, remix?: Remix): Level {
  const source = campaignPool(remix)[(remix?.level ?? page) - 1];
  if (!remix) return source;
  return permutedLevel(source, remix);
}
export function permutedLevel(source: Level, remix: Remix): Level {
  return {
    ...source,
    board: remix.order.map((i) => source.board[i].map((c) => remix.colors[c])),
    solution: source.solution.map((m) => ({
      from: remix.order.indexOf(m.from),
      to: remix.order.indexOf(m.to),
    })),
    rules: remapRules(source.rules, remix),
  };
}
export function newRemix(page: number, previous?: Remix, random = Math.random): Remix {
  const pool = campaignPool(previous),
    source = pool[page - 1];
  const profile = difficultyProfile(page);
  const sourceSignature = signature(source);
  const candidates = pool.filter(
    (l) =>
      signature(l) === sourceSignature &&
      l.id !== (previous?.level ?? page) &&
      (previous?.legacy ||
        previous?.campaign === 3 ||
        (l.par >= profile.minimum && l.par <= Math.max(source.par, profile.minimum + 4))),
  );
  const choices = candidates.length ? candidates : [source];
  const shuffle = (n: number) => {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const counts = source.board.flat().reduce((a, c) => {
    a[c] = (a[c] ?? 0) + 1;
    return a;
  }, [] as number[]);
  const colors = shuffle(counts.length);
  if (colors.some((c, i) => counts[c] !== counts[i]))
    colors.splice(0, colors.length, ...counts.map((_, i) => i));
  const chosen =
    choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
  return {
    level: chosen.id,
    order: shuffle(source.board.length),
    colors,
    ...(previous?.legacy ? { legacy: true } : {}),
    ...(previous?.campaign === 3 ? { campaign: 3 as const } : {}),
  };
}
export function certifiedHint(page: number, board: Board, remix?: Remix): Move | undefined {
  const attempt = attemptPuzzle(page, remix);
  let current = attempt.board;
  const encoded = JSON.stringify(board);
  for (const step of attempt.solution) {
    if (JSON.stringify(current) === encoded) return step;
    current = pour(current, step.from, step.to, attempt.rules)!;
  }
}
