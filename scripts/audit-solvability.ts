import assert from 'node:assert/strict';
import fs from 'node:fs';
import levels, { campaign3Levels, legacyLevels, type Level } from '../src/data/campaign';
import { goalPacking } from '../src/engine/goalPacking';
import { findHintPath } from '../src/engine/hintSearch';
import { newRemix, attemptPuzzle, validRemix } from '../src/engine/remix';
import { capacity, pour, won, type Board, type Move } from '../src/engine/puzzle';
import { referencePour, referenceWon } from '../tests/reference-puzzle';

let seed = 0x8632026;
const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const inventory = (b: Board) =>
  b
    .flat()
    .sort((a, b) => a - b)
    .join(',');
const report = {
  campaign: 4,
  seed,
  certified: { current: 0, previous: 0, legacy: 0, mixtures: 0, transfers: 0 },
  capacities: {} as Record<number, number>,
  mechanics: {} as Record<string, number>,
  randomPlay: { pages: 0, states: 0, moveComparisons: 0, legalMoves: 0, capacityDeadEnds: 0 },
  offCertificateSearch: { positions: 0, solved: 0, blocked: 0, limited: 0, worstMs: 0 },
  irreversibleExamples: [] as { page: number; board: Board }[],
  limitations: [
    'Every starting puzzle and sampled mixture has a full independently replayed solution; this is not an exhaustive traversal of every player-reachable state.',
    'Irreversible conservation, completed keys and completed crystal triggers can create dead ends after an unsuitable choice; undo/restart remain available.',
    'A bounded hint search is reported as incomplete, never as a proof of impossibility.',
  ],
};

function certify(level: Level) {
  const stock = inventory(level.board),
    packing = goalPacking(level.board, level.rules);
  let board = level.board;
  for (let i = 0; i <= level.solution.length; i++) {
    assert.equal(inventory(board), stock, `inventory ${level.id}/${i}`);
    board.forEach((tube, at) => assert(tube.length <= capacity(level.rules, at)));
    assert.equal(won(board, level.rules), referenceWon(board, level.rules));
    const goal = packing(board);
    assert(goal.possible, `packing ${level.id}/${i}`);
    assert(goal.lowerBound <= level.solution.length - i, `bound ${level.id}/${i}`);
    if (i === level.solution.length) break;
    const m = level.solution[i],
      next = referencePour(board, m.from, m.to, level.rules);
    assert(next, `independent certificate ${level.id}/${i}`);
    assert.deepEqual(pour(board, m.from, m.to, level.rules), next);
    board = next;
    report.certified.transfers++;
  }
  assert(referenceWon(board, level.rules), `independent goal ${level.id}`);
}

async function main() {
  for (const [name, pool] of [
    ['current', levels],
    ['previous', campaign3Levels],
    ['legacy', legacyLevels],
  ] as const) {
    for (const level of pool) {
      certify(level);
      report.certified[name]++;
    }
  }
  console.log('Current and archived starting certificates independently verified.');
  for (const level of levels) {
    level.board.forEach((_, i) => {
      const cap = capacity(level.rules, i);
      report.capacities[cap] = (report.capacities[cap] ?? 0) + 1;
    });
    for (const mechanic of level.rules?.mechanics ?? [])
      report.mechanics[mechanic] = (report.mechanics[mechanic] ?? 0) + 1;
    let remix;
    for (let sample = 0; sample < 3; sample++) {
      remix = newRemix(level.id, remix, random);
      assert(validRemix(level.id, remix));
      certify(attemptPuzzle(level.id, remix));
      report.certified.mixtures++;
    }
    let board = level.board;
    const visited = new Set<string>([JSON.stringify(board)]),
      packing = goalPacking(board, level.rules);
    const stock = inventory(board);
    report.randomPlay.pages++;
    for (let turn = 0; turn < 24; turn++) {
      report.randomPlay.states++;
      assert.equal(won(board, level.rules), referenceWon(board, level.rules));
      const candidates: { next: Board; m: Move }[] = [];
      for (let from = 0; from < board.length; from++)
        for (let to = 0; to < board.length; to++) {
          const independent = referencePour(board, from, to, level.rules),
            actual = pour(board, from, to, level.rules);
          assert.deepEqual(actual, independent, `random move ${level.id}/${turn}/${from}/${to}`);
          report.randomPlay.moveComparisons++;
          if (!actual) continue;
          report.randomPlay.legalMoves++;
          assert.equal(inventory(actual), stock);
          actual.forEach((tube, i) => assert(tube.length <= capacity(level.rules, i)));
          if (!visited.has(JSON.stringify(actual)))
            candidates.push({ next: actual, m: { from, to } });
        }
      if (!packing(board).possible) {
        report.randomPlay.capacityDeadEnds++;
        if (report.irreversibleExamples.length < 3)
          report.irreversibleExamples.push({ page: level.id, board });
        break;
      }
      if (referenceWon(board, level.rules)) break;
      if (!candidates.length) break;
      board = candidates[Math.floor(random() * candidates.length)].next;
      visited.add(JSON.stringify(board));
    }
    // Off-certificate continuations exercise the actual new hint engine, rather
    // than rechecking only the supplied starting solution. Budgets are explicit.
    if (level.id % 10 === 3 && !referenceWon(board, level.rules)) {
      const start = performance.now(),
        result = await findHintPath(board, level.rules, { maxMs: 120, maxNodes: 12000 });
      const elapsed = performance.now() - start;
      report.offCertificateSearch.positions++;
      report.offCertificateSearch.worstMs = Math.max(
        report.offCertificateSearch.worstMs,
        Math.round(elapsed),
      );
      if (result.status === 'found') {
        report.offCertificateSearch.solved++;
        const states = new Set([JSON.stringify(board)]);
        for (const m of result.path) {
          board = referencePour(board, m.from, m.to, level.rules)!;
          assert(board, `hint continuation ${level.id}`);
          const code = JSON.stringify(board);
          assert(!states.has(code), `cyclic hint continuation ${level.id}`);
          states.add(code);
        }
        assert(referenceWon(board, level.rules), `hint goal ${level.id}`);
      } else if (result.status === 'blocked') report.offCertificateSearch.blocked++;
      else {
        assert.equal(result.status, 'limit');
        report.offCertificateSearch.limited++;
      }
    }
  }
  fs.writeFileSync('docs/solvability-audit.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
