import { readFileSync, writeFileSync } from 'node:fs';
import { solveOptimal } from '../src/engine/optimal';
import { pour, won } from '../src/engine/puzzle';
import type { Level } from '../src/data/campaign';

const checkOnly = process.argv.includes('--check');
const path = 'src/data/levels.json';
const original = readFileSync(path, 'utf8');
const levels = JSON.parse(original) as Level[];
const report = [];
for (const level of levels) {
  const start = performance.now();
  const result = solveOptimal(level.board, { maxMoves: level.solution.length, rules: level.rules });
  if (!result) throw Error(`No exact solution for page ${level.id}`);
  let verified = level.board;
  for (const m of result.solution) {
    const next = pour(verified, m.from, m.to, level.rules);
    if (!next) throw Error(`Invalid solution for page ${level.id}`);
    verified = next;
  }
  if (!won(verified, level.rules)) throw Error(`Incomplete solution for page ${level.id}`);
  if (checkOnly && result.minimum !== level.par)
    throw Error(`Incorrect reference for page ${level.id}`);
  report.push({
    page: level.id,
    previous: level.par,
    minimum: result.minimum,
    lowerBound: result.lowerBound,
    boundsChecked: result.boundsChecked,
    expanded: result.expanded,
  });
  console.log(
    `Page ${level.id}: ${level.par} → ${result.minimum}, ${result.expanded} nodes, ${Math.round(performance.now() - start)}ms`,
  );
  level.solution = result.solution;
  level.par = result.minimum;
}
// Commit only after every page has a proven minimum; preserve all tube layouts.
if (readFileSync(path, 'utf8') !== original) throw Error('Levels changed during calibration');
if (!checkOnly) {
  writeFileSync(path, JSON.stringify(levels));
  writeFileSync(
    'scripts/star-calibration.json',
    JSON.stringify(
      {
        algorithm: 'IDA* exact; exhaustive lower cost bounds; no approximate fallback',
        pages: report,
      },
      null,
      2,
    ) + '\n',
  );
}
console.log(
  `${levels.length} exact references ${checkOnly ? 'checked without writing' : 'saved'}; existing boards preserved.`,
);
