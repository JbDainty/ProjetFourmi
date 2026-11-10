import levels, { legacyLevels, type Level } from '../data/campaign';
import { pour, type Board, type Move } from './puzzle';
import type { Rules } from './mechanics';
export type Remix = { level: number; order: number[]; colors: number[]; legacy?: boolean };
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
const signature = (l: Level) =>
  JSON.stringify([
    l.rules?.mechanics.slice().sort() ?? [],
    l.board.length,
    l.board.flat().reduce((a, c) => {
      a[c] = (a[c] ?? 0) + 1;
      return a;
    }, [] as number[]),
  ]);
export function validRemix(page: number, value: Remix): boolean {
  const pool = value?.legacy ? legacyLevels : levels,
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
  const source = (remix?.legacy ? legacyLevels : levels)[(remix?.level ?? page) - 1];
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
  const pool = previous?.legacy ? legacyLevels : levels,
    source = pool[page - 1];
  const candidates = pool.filter(
    (l) => signature(l) === signature(source) && l.id !== (previous?.level ?? page),
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
