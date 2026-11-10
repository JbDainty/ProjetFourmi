import { readFileSync, writeFileSync } from 'node:fs';
import { Board, Move, pour, won, key } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';
// This historical generator predates the eight campaign rules. Never replace
// an expanded campaign with its original hundred classic puzzles by accident.
if (JSON.parse(readFileSync('src/data/levels.json', 'utf8')).length > 100)
  throw Error(
    'Campagne étendue conservée. Utilisez node --import tsx scripts/expand-levels.ts pour générer les 1 000 pages.',
  );
let seed = 84239;
const random = (n: number) => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed % n;
};
const levels: { id: number; board: Board; solution: Move[]; par: number }[] = [];
const unique = new Set<string>();
for (let id = 1; id <= 100; id++) {
  const colors = id < 6 ? 2 : id < 11 ? 3 : id < 26 ? 4 : id < 51 ? 5 : id < 76 ? 6 : 7;
  for (let attempt = 0; ; attempt++) {
    let board: Board = [...Array.from({ length: colors }, (_, c) => [c, c, c, c]), [], []];
    let reverse: Move[] = [];
    for (let step = 0; step < 8 + Math.floor(id * 0.7); step++) {
      const options: { i: number; j: number; n: number }[] = [];
      for (let i = 0; i < board.length; i++)
        for (let j = 0; j < board.length; j++) {
          if (i === j || !board[i].length || board[j].length === 4) continue;
          const color = board[i].at(-1)!;
          if (board[j].at(-1) === color) continue;
          for (let n = 1; n <= Math.min(board[i].length, 4 - board[j].length); n++) {
            const rest = board[i].slice(0, -n);
            if (
              board[i].slice(-n).every((c) => c === color) &&
              (!rest.length || rest.at(-1) === color)
            )
              options.push({ i, j, n });
          }
        }
      if (!options.length) break;
      const { i, j, n } = options[random(options.length)];
      board[j].push(...board[i].splice(-n));
      reverse.unshift({ from: j, to: i });
    }
    // Reject already separated colors as trivial starting layouts, even if partial.
    if (board.every((t) => t.every((c) => c === t[0])) || unique.has(key(board))) continue;
    // Independently verify the exact reverse certificate under the real pouring rules.
    let verify = board;
    for (const m of reverse) {
      const next = pour(verify, m.from, m.to);
      if (!next) throw Error('Invalid certificate');
      verify = next;
    }
    if (!won(verify)) throw Error('Unsolved certificate');
    const exact = solveOptimal(board, { maxMoves: reverse.length });
    if (!exact) throw Error(`No certified minimum for page ${id}`);
    const solution = exact.solution;
    unique.add(key(board));
    levels.push({ id, board, solution, par: solution.length });
    break;
  }
}
writeFileSync('src/data/levels.json', JSON.stringify(levels));
console.log(`Validated ${levels.length} distinct solvable levels.`);
