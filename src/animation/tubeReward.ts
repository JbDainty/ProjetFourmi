import type { Rules } from '../engine/mechanics';
import { capacity } from '../engine/puzzle';
import { type Board, CAPACITY } from '../engine/puzzle';
export type TubeReward = { id: number; tube: number; color: number };
const complete = (tube: number[]) =>
  tube.length === CAPACITY && tube.every((color) => color === tube[0]);
export function completedByPour(
  before: Board,
  after: Board,
  destination: number,
  rules?: Rules,
): boolean {
  return (
    !!before[destination] &&
    !!after[destination] &&
    !(
      before[destination].length === capacity(rules, destination) &&
      before[destination].every((c) => c === before[destination][0])
    ) &&
    after[destination].length === capacity(rules, destination) &&
    after[destination].every((c) => c === after[destination][0]) &&
    after.filter((t, i) => t.length === capacity(rules, i) && t.every((c) => c === t[0])).length >
      before.filter((t, i) => t.length === capacity(rules, i) && t.every((c) => c === t[0])).length
  );
}
