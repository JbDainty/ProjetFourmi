import { softenWaves } from './wave-relief';
import fs from 'node:fs';
import old from '../src/data/legacyLevels.json';
import { pour, won, capacity, type Board, type Move } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';
import { mechanicIds, type Rules, type Mechanic } from '../src/engine/mechanics';
let seed = 0x43167;
const rnd = (n: number) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return Math.floor((seed / 4294967296) * n);
};
const intro = [11, 21, 36, 51, 71, 91, 111, 131];
const output: any[] = [];
const seen = new Set<string>();
for (let id = 1; id <= 1000; id++) {
  const introduced = mechanicIds.filter((_, i) => intro[i] <= id);
  let selected: Mechanic[] = [];
  const lesson = intro.indexOf(id);
  const relief = id % 8 === 0 || id % 8 === 1;
  if (lesson >= 0) selected = [mechanicIds[lesson]];
  else if (introduced.length && id % 3 !== 0) {
    selected = [introduced[rnd(introduced.length)]];
    if (id > 155 && !relief && id % 2 === 0)
      selected.push(introduced.filter((x) => x !== selected[0])[rnd(introduced.length - 1)]);
  }
  // The opening ten pages retain their original, verified layouts.
  if (id <= 10) {
    output.push({ ...old[id - 1], difficulty: 'douce' });
    seen.add(JSON.stringify([old[id - 1].board, undefined]));
    continue;
  }
  let accepted = false;
  for (let trial = 0; trial < 240 && !accepted; trial++) {
    const colors =
      trial >= 60
        ? 3
        : lesson >= 0
          ? 2
          : Math.max(
              selected.length > 1 ? 3 : 2,
              relief ? 2 + rnd(2) : Math.min(5, 2 + Math.floor(id / 180)) + rnd(2),
            );
    const rules: Rules = { mechanics: selected };
    let board: Board = Array.from({ length: colors }, (_, c) => [c, c, c, c]);
    board.push([], []);
    if (selected.includes('capacity')) {
      const cap = id % 2 ? 2 : 3;
      board = [[...Array(cap).fill(0)], [...Array(cap).fill(0)], ...board.slice(1)];
      rules.capacities = board.map((_, i) => (i < 2 ? cap : 4));
    }
    const last = board.length - 1;
    if (selected.includes('mystery')) rules.mystery = [0, Math.min(2, colors - 1)];
    if (selected.includes('locks')) rules.gates = [{ key: 1, tube: last }];
    if (selected.includes('crystal')) rules.crystals = [{ tube: 0, depth: 0, color: 1 }];
    if (selected.includes('links')) rules.links = [[0, last - 1]];
    if (selected.includes('pipette')) rules.pipettes = [0];
    if (selected.includes('filter')) rules.filters = [{ tube: 0, color: 0 }];
    if (selected.includes('conservation')) rules.collectors = [last];
    if (selected.includes('conservation') || selected.includes('locks')) {
      const goal = board.length - 3 === 1 ? 0 : board.length - 3;
      [board[goal], board[last]] = [board[last], board[goal]];
    }
    let certificate: Move[] = [];
    const steps = lesson >= 0 ? 7 : relief ? 8 + rnd(5) : 14 + Math.floor(id / 90) + rnd(10);
    for (let step = 0; step < steps; step++) {
      const choices: { board: Board; move: Move }[] = [];
      for (let i = 0; i < board.length; i++)
        for (let j = 0; j < board.length; j++) {
          if (i === j || !board[i].length || board[j].length >= capacity(rules, j)) continue;
          const color = board[i].at(-1)!;
          for (
            let n = 1;
            n <= Math.min(board[i].length, capacity(rules, j) - board[j].length);
            n++
          ) {
            if (!board[i].slice(-n).every((c) => c === color)) break;
            const next = board.map((t) => t.slice());
            next[j].push(...next[i].splice(-n));
            const reversed = pour(next, j, i, rules);
            if (reversed && JSON.stringify(reversed) === JSON.stringify(board))
              choices.push({ board: next, move: { from: j, to: i } });
          }
        }
      if (!choices.length) break;
      const choice = choices[rnd(choices.length)];
      board = choice.board;
      certificate.unshift(choice.move);
    }
    if (won(board, rules) || board.every((t) => t.every((c) => c === t[0]))) continue;
    const code = JSON.stringify([board, selected.length ? rules : undefined]);
    if (seen.has(code)) continue;
    // Every introduced rule must be relevant, not an already-open decoration.
    if (rules.mystery && !rules.mystery.some((i) => new Set(board[i]).size > 1)) continue;
    if (rules.crystals?.some((c) => board[c.tube].length <= c.depth)) continue;
    if (
      rules.gates?.some(
        (g) =>
          board[g.key].length === capacity(rules, g.key) &&
          board[g.key].every((c) => c === board[g.key][0]),
      )
    )
      continue;
    if (
      rules.crystals?.some((c) =>
        board.some(
          (t, i) =>
            t[0] === c.color && t.length === capacity(rules, i) && t.every((x) => x === c.color),
        ),
      )
    )
      continue;
    if (rules.collectors?.some((i) => board[i].length === capacity(rules, i))) continue;
    try {
      const exact = solveOptimal(board, {
        rules: selected.length ? rules : undefined,
        maxMoves: certificate.length,
        maxNodes: 350000,
      });
      if (!exact || exact.minimum < 2 || exact.minimum > 42) continue;
      const target = lesson >= 0 || relief ? 3 : 4 + Math.floor(id / 250) + (id % 8 >= 5 ? 2 : 0);
      const mixed = board.filter((t) => new Set(t).size > 1).length;
      if (
        trial < 100 &&
        lesson < 0 &&
        !relief &&
        (exact.minimum < target || mixed < Math.min(3, colors))
      )
        continue;

      if (rules.collectors && !exact.solution.some((m) => rules.collectors!.includes(m.to)))
        continue;
      if (rules.filters && !exact.solution.some((m) => rules.filters!.some((f) => f.tube === m.to)))
        continue;
      if (
        rules.links &&
        !exact.solution.some((m) => rules.links!.some((pair) => pair.includes(m.to)))
      )
        continue;
      if (
        rules.gates &&
        !exact.solution.some((m) => rules.gates!.some((g) => g.tube === m.from || g.tube === m.to))
      )
        continue;
      if (rules.pipettes) {
        let trace = board,
          uses = false;
        for (const m of exact.solution) {
          if (
            rules.pipettes.includes(m.from) &&
            trace[m.from].length > 1 &&
            trace[m.from].at(-1) === trace[m.from].at(-2)
          )
            uses = true;
          trace = pour(trace, m.from, m.to, rules)!;
        }
        if (!uses) continue;
      }

      seen.add(code);
      output.push({
        id,
        board,
        solution: exact.solution,
        par: exact.minimum,
        ...(selected.length ? { rules } : {}),
        difficulty:
          lesson >= 0
            ? 'découverte'
            : relief
              ? 'respiration'
              : exact.minimum >= 8 + Math.floor(id / 350)
                ? 'soutenue'
                : 'équilibrée',
      });
      accepted = true;
    } catch {}
  }
  if (!accepted) throw Error(`Cannot certify page ${id} (${selected})`);
  if (id % 25 === 0) {
    fs.writeFileSync('/tmp/herbier-levels-progress.json', JSON.stringify(output));
    console.log('Certified', id);
  }
}
softenWaves(output);
fs.writeFileSync('src/data/levels.json', JSON.stringify(output));
fs.writeFileSync(
  'docs/level-audit.json',
  JSON.stringify(
    {
      count: output.length,
      seed: '0x43167',
      mechanics: mechanicIds,
      introductions: intro,
      maxPerPage: 2,
      exactMinimum: true,
      relief: 'gentler pages at wave positions 0, 1 and 4 after the introductions',
    },
    null,
    2,
  ),
);
