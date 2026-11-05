import { type Board, CAPACITY } from '../engine/puzzle';
export type TubeReward = { id: number; tube: number; color: number };
const complete = (tube: number[]) =>
  tube.length === CAPACITY && tube.every((color) => color === tube[0]);
export function completedByPour(before: Board, after: Board, destination: number): boolean {
  return (
    !!before[destination] &&
    !!after[destination] &&
    !complete(before[destination]) &&
    complete(after[destination]) &&
    after.filter(complete).length > before.filter(complete).length
  );
}
