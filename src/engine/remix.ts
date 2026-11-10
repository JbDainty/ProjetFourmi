import levels from '../data/levels.json';
import { pour, type Board, type Move } from './puzzle';

export type Remix = { level: number; order: number[]; colors: number[] };
const permutation = (a: unknown, length: number): a is number[] =>
  Array.isArray(a) &&
  a.length === length &&
  new Set(a).size === length &&
  a.every((n) => Number.isInteger(n) && n >= 0 && n < length);

export function validRemix(page: number, value: Remix): boolean {
  const source = levels[value?.level - 1],
    original = levels[page - 1];
  return (
    !!source &&
    source.board.length === original.board.length &&
    permutation(value.order, original.board.length) &&
    permutation(value.colors, new Set(original.board.flat()).size)
  );
}

/** Relabel a puzzle with an offline-certified exact minimum; never search on the UI thread. */
export function attemptPuzzle(
  page: number,
  remix?: Remix,
): { board: Board; solution: Move[]; par: number } {
  const source = levels[(remix?.level ?? page) - 1];
  if (!remix) return source;
  return {
    board: remix.order.map((i) => source.board[i].map((c) => remix.colors[c])),
    solution: source.solution.map((m) => ({
      from: remix.order.indexOf(m.from),
      to: remix.order.indexOf(m.to),
    })),
    par: source.par,
  };
}

export function newRemix(page: number, previous?: Remix, random = Math.random): Remix {
  const source = levels[page - 1];
  const choices = levels.filter(
    (l) => l.board.length === source.board.length && l.id !== (previous?.level ?? page),
  );
  const shuffle = (count: number) => {
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) {
      const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1))));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  };
  const chosen =
    choices[Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)))];
  return {
    level: chosen.id,
    order: shuffle(source.board.length),
    colors: shuffle(new Set(source.board.flat()).size),
  };
}

export function certifiedHint(page: number, board: Board, remix?: Remix): Move | undefined {
  const attempt = attemptPuzzle(page, remix);
  let current = attempt.board;
  const encoded = JSON.stringify(board);
  for (const step of attempt.solution) {
    if (JSON.stringify(current) === encoded) return step;
    current = pour(current, step.from, step.to)!;
  }
}
