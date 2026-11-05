import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';
import type { Move } from '../src/engine/puzzle';

// Build real attempts with harmless extra transfers, not fabricated move counts.
export function firstPageAttempt(extra: number, replay = false): { save: Save; last: Move } {
  let save = { ...initial(), started: true };
  const solution = levels[0].solution;
  if (replay) {
    for (const m of solution) save = move(save, m.from, m.to);
    save = loadLevel(save, 1);
  }
  for (const m of solution.slice(0, -1)) save = move(save, m.from, m.to);
  let last = { ...solution.at(-1)! };
  const empty = save.board.findIndex((t) => !t.length);
  const full = save.board.findIndex((t) => t.length === 4 && t.every((c) => c === t[0]));
  for (let i = 0; i < Math.floor(extra / 2); i++) {
    save = move(save, full, empty);
    save = move(save, empty, full);
  }
  if (extra % 2) {
    save = move(save, last.from, empty);
    last = { from: empty, to: last.to };
  }
  save.settings = { ...save.settings, motion: false, sound: false, haptics: false };
  return { save, last };
}
