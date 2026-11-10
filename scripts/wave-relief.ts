import fs from 'node:fs';
import type { Level } from '../src/data/campaign';
import { permutedLevel } from '../src/engine/remix';
export function softenWaves(levels: Level[]) {
  let seed = 19171;
  const rnd = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return Math.floor((seed / 4294967296) * n);
  };
  const fingerprint = (l: Level) => JSON.stringify([l.board, l.rules ?? null]);
  const seen = new Set(levels.map(fingerprint));
  const easy = levels.filter(
    (l) => l.difficulty === 'respiration' && l.par <= 7 && (l.rules?.mechanics.length ?? 0) <= 1,
  );
  for (let i = 150; i < levels.length; i++) {
    const page = levels[i];
    if (page.id % 8 !== 4) continue;
    const kind = page.rules?.mechanics[0];
    const choices = easy.filter((l) => (kind ? l.rules?.mechanics.includes(kind) : !l.rules));
    const pool = choices.length ? choices : easy;
    seen.delete(fingerprint(page));
    let accepted = false;
    for (let trial = 0; trial < 500; trial++) {
      const source = pool[rnd(pool.length)],
        order = source.board.map((_, j) => j);
      for (let n = order.length - 1; n > 0; n--) {
        const j = rnd(n + 1);
        [order[n], order[j]] = [order[j], order[n]];
      }
      const colors = [...new Set(source.board.flat())].sort((a, b) => a - b);
      const candidate = {
        ...permutedLevel(source, { level: source.id, order, colors }),
        id: page.id,
        difficulty: 'respiration',
      };
      if (seen.has(fingerprint(candidate))) continue;
      levels[i] = candidate;
      seen.add(fingerprint(candidate));
      accepted = true;
      break;
    }
    if (!accepted) throw Error('Could not diversify relief page ' + page.id);
  }
  return levels;
}
if (process.argv[1]?.endsWith('wave-relief.ts')) {
  const levels = JSON.parse(fs.readFileSync('src/data/levels.json', 'utf8')) as Level[];
  fs.writeFileSync('src/data/levels.json', JSON.stringify(softenWaves(levels)));
}
