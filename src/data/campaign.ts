import raw from './levels.json';
import old from './legacyLevels.json';
import previous from './campaign3Levels.json';
import type { Rules } from '../engine/mechanics';
import type { Board, Move } from '../engine/puzzle';
export type Level = {
  id: number;
  board: Board;
  solution: Move[];
  par: number;
  rules?: Rules;
  difficulty?: string;
};
const levels = raw as Level[];
export const legacyLevels = old as Level[];
export const campaign3Levels = previous as Level[];
export default levels;
