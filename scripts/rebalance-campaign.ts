import fs from 'node:fs';
import { campaign3Levels, type Level } from '../src/data/campaign';
import { difficultyProfile, mechanicIntroductions } from '../src/data/difficulty';
import { mechanicIds, type Rules } from '../src/engine/mechanics';
import { permutedLevel } from '../src/engine/remix';
import { pour, won, completeTube, type Board } from '../src/engine/puzzle';
import { solveOptimal } from '../src/engine/optimal';

let seed = 0x74696e74;
const rnd = (n: number) => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return Math.floor((seed / 4294967296) * n);
};
const shuffle = (n: number) => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};
const colors = (level: Level) => new Set(level.board.flat()).size;
const mixed = (level: Level) => level.board.filter((t) => new Set(t).size > 1).length;
const replay = (l: Level, rules = l.rules): Board[] | null => {
  const trace = [l.board];
  for (const move of l.solution) {
    const next = pour(trace.at(-1)!, move.from, move.to, rules);
    if (!next) return null;
    trace.push(next);
  }
  return won(trace.at(-1)!, rules) ? trace : null;
};
/** Preserve an attained optimum for constraint-only extensions. Pipettes and
 * frozen layers can also change pour amounts, so those get a fresh exact search. */
function spreadMechanics(l: Level): Level {
  if (!l.rules || l.id < 80) return l;
  let rules = JSON.parse(JSON.stringify(l.rules)) as Rules;
  const trace = replay(l)!;
  const touched = (tube: number) => l.solution.some((m) => m.from === tube || m.to === tube);
  const take = (candidate: Rules) => {
    if (replay(l, candidate)) {
      rules = candidate;
      return true;
    }
    return false;
  };
  if (rules.mystery) {
    const eligible = l.board
      .map((t, i) => ({ i, mix: new Set(t).size }))
      .filter((x) => x.mix > 1)
      .map((x) => x.i);
    const target = Math.min(eligible.length, 5, 2 + Math.floor(l.id / 220));
    rules.mystery = eligible.slice(0, target);
  }
  if (l.id > 150 && rules.gates?.length === 1) {
    const gate = rules.gates[0];
    for (const tube of shuffle(l.board.length)) {
      if (
        tube === gate.key ||
        tube === gate.tube ||
        !touched(tube) ||
        completeTube(l.board, tube, rules)
      )
        continue;
      if (take({ ...rules, gates: [gate, { key: gate.key, tube }] })) break;
    }
  }
  if (l.id > 200 && rules.filters?.length === 1) {
    for (const tube of shuffle(l.board.length)) {
      if (rules.filters.some((f) => f.tube === tube)) continue;
      const incoming = l.solution.flatMap((m, step) =>
        m.to === tube ? [trace[step][m.from].at(-1)!] : [],
      );
      if (!incoming.length || new Set(incoming).size !== 1) continue;
      if (take({ ...rules, filters: [...rules.filters, { tube, color: incoming[0] }] })) break;
    }
  }
  if (l.id > 240 && rules.crystals?.length === 1) {
    const crystal = rules.crystals[0];
    for (const tube of shuffle(l.board.length)) {
      if (
        tube === crystal.tube ||
        !l.board[tube].length ||
        !l.solution.some((m) => m.from === tube)
      )
        continue;
      if (take({ ...rules, crystals: [crystal, { tube, depth: 0, color: crystal.color }] })) break;
    }
  }
  if (l.id > 300 && rules.collectors?.length === 1) {
    for (const tube of shuffle(l.board.length)) {
      if (
        rules.collectors.includes(tube) ||
        l.solution.some((m) => m.from === tube) ||
        !l.solution.some((m) => m.to === tube)
      )
        continue;
      if (take({ ...rules, collectors: [...rules.collectors, tube] })) break;
    }
  }
  if (l.id > 300 && rules.pipettes?.length === 1) {
    for (const tube of shuffle(l.board.length)) {
      if (rules.pipettes.includes(tube) || !l.solution.some((m) => m.from === tube)) continue;
      if (take({ ...rules, pipettes: [...rules.pipettes, tube] })) break;
    }
  }
  const partialPourChanged =
    JSON.stringify([rules.pipettes, rules.crystals]) !==
    JSON.stringify([l.rules.pipettes, l.rules.crystals]);
  if (partialPourChanged) {
    try {
      const exact = solveOptimal(l.board, { rules, maxMoves: l.par });
      if (!exact || exact.minimum !== l.par) return l;
    } catch {
      return l;
    }
  }
  return { ...l, rules };
}

const output: Level[] = [];
const seen = new Set<string>();
let replaced = 0;
for (const original of campaign3Levels) {
  const id = original.id,
    profile = difficultyProfile(id);
  const allowed = mechanicIds.filter((_, i) => mechanicIntroductions[i] <= id);
  const fits = (l: Level) =>
    colors(l) >= profile.colors &&
    colors(l) <= profile.maxColors &&
    l.par >= profile.minimum &&
    mixed(l) >= profile.mixed &&
    (l.rules?.mechanics ?? []).every((m) => allowed.includes(m)) &&
    (!profile.lesson ||
      JSON.stringify(l.rules?.mechanics) === JSON.stringify(original.rules?.mechanics)) &&
    (!profile.relief || (l.rules?.mechanics.length ?? 0) <= 1) &&
    (!profile.relief || l.par <= profile.minimum + 4);
  let chosen = original;
  if (id > 10 && !fits(original)) {
    let pool = campaign3Levels.filter(fits);
    const matching = pool.filter(
      (l) =>
        JSON.stringify(l.rules?.mechanics ?? []) ===
        JSON.stringify(original.rules?.mechanics ?? []),
    );
    if (matching.length) pool = matching;
    else {
      const primary = pool.filter((l) =>
        original.rules?.mechanics.some((m) => l.rules?.mechanics.includes(m)),
      );
      if (primary.length) pool = primary;
    }
    if (!pool.length)
      throw Error(`No certified progression pool for page ${id}: ${JSON.stringify(profile)}`);
    chosen = pool[rnd(pool.length)];
    replaced++;
  }
  let accepted = false;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const candidate = spreadMechanics({
      ...(attempt === 0 && chosen === original
        ? original
        : permutedLevel(chosen, {
            level: chosen.id,
            order: shuffle(chosen.board.length),
            colors: shuffle(colors(chosen)),
          })),
      id,
      difficulty:
        id <= 10
          ? 'douce'
          : profile.lesson
            ? 'découverte'
            : profile.relief
              ? 'respiration'
              : chosen.par >= profile.minimum + 3
                ? 'soutenue'
                : 'équilibrée',
    });
    const key = JSON.stringify([candidate.board, candidate.rules ?? null]);
    if (seen.has(key)) continue;
    if (!replay(candidate)) throw Error(`Invalid unchanged optimal certificate at ${id}`);
    seen.add(key);
    output.push(candidate);
    accepted = true;
    break;
  }
  if (!accepted) throw Error(`Could not diversify page ${id}`);
}
fs.writeFileSync('src/data/levels.json', JSON.stringify(output));
const bands = [
  [1, 50],
  [51, 150],
  [151, 350],
  [351, 650],
  [651, 1000],
].map(([a, b]) => {
  const pages = output.slice(a - 1, b);
  return {
    from: a,
    to: b,
    minColors: Math.min(...pages.map(colors)),
    minMoves: Math.min(...pages.map((p) => p.par)),
    meanMoves: Math.round((pages.reduce((n, p) => n + p.par, 0) / pages.length) * 10) / 10,
  };
});
const instances = Object.fromEntries(
  ['mystery', 'gates', 'crystals', 'filters', 'pipettes', 'collectors'].map((key) => [
    key,
    output.filter((l) => (l.rules?.[key as keyof Rules]?.length ?? 0) > 1).length,
  ]),
);
fs.writeFileSync(
  'docs/progression-audit.json',
  JSON.stringify(
    {
      campaign: 4,
      replaced,
      bands,
      multipleInstances: instances,
      proof:
        'Archived exact optima; unchanged attained optimum for constraint-only extensions; partial-pour extensions recertified by IDA*',
      reliefPositions: [0, 1, 4],
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ replaced, bands, multipleInstances: instances }, null, 2));

fs.writeFileSync(
  'docs/level-audit.json',
  JSON.stringify(
    {
      campaign: 4,
      count: output.length,
      seed: '0x74696e74',
      templateSeed: '0x43167',
      mechanics: mechanicIds,
      introductions: mechanicIntroductions,
      maxPerPage: 2,
      exactMinimum: true,
      relief: 'wave positions 0, 1 and 4, with progression floors',
      difficultyCounts: Object.fromEntries(
        [...new Set(output.map((l) => l.difficulty))].map((d) => [
          d,
          output.filter((l) => l.difficulty === d).length,
        ]),
      ),
      minimumRange: [Math.min(...output.map((l) => l.par)), Math.max(...output.map((l) => l.par))],
      meanFirstHundred: output.slice(0, 100).reduce((n, l) => n + l.par, 0) / 100,
      meanLastHundred: output.slice(-100).reduce((n, l) => n + l.par, 0) / 100,
    },
    null,
    2,
  ) + '\n',
);
