import type { Board } from './puzzle';
import type { Rules } from './mechanics';
export const initialKnowledge = (board: Board, rules?: Rules) =>
  board.map((t, i) =>
    t.map((c, d) => !rules?.mystery?.includes(i) || t.slice(d).every((x) => x === c)),
  );
export function revealTop(board: Board, flags: boolean[][]) {
  return flags.map((t, i) =>
    t.map((known, d) => known || board[i].slice(d).every((c) => c === board[i].at(-1))),
  );
}
export function moveKnowledge(
  before: Board,
  after: Board,
  flags: boolean[][],
  from: number,
  to: number,
) {
  const count = before[from].length - after[from].length;
  const result = flags.map((t) => t.slice());
  result[from] = result[from].slice(0, after[from].length);
  result[to].push(...Array(count).fill(true));
  return revealTop(after, result);
}
