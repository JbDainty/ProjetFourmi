import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';
import type { Move } from '../src/engine/puzzle';

// Build real attempts with harmless extra transfers, not fabricated move counts.
function attempt(extra: number, replay = false): { save: Save; last: Move } {
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

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    for (const [extra, stars] of [
      [0, 3],
      [1, 3],
      [2, 2],
      [3, 1],
    ]) {
      const fixture = attempt(extra);
      expect(fixture.save.moves).toBe(levels[0].par + extra - 1);
      await page.evaluate(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        fixture.save,
      );
      await page.goto(url);
      await expect(page.getByTestId('page-star-target')).toHaveCount(0);
      await expect(page.getByTestId('page-result-moves')).toHaveCount(0);
      await page
        .getByRole('button', { name: new RegExp(`^Flacon ${fixture.last.from + 1},`) })
        .click();
      await page
        .getByRole('button', { name: new RegExp(`^Flacon ${fixture.last.to + 1},`) })
        .click();
      await expect(page.getByTestId('page-earned-stars')).toHaveText('★'.repeat(stars));
      await expect(page.getByTestId('page-star-target')).toHaveText(
        'Minimum : 4 · Objectif ★★★ : 5',
      );
      await expect(page.getByTestId('page-result-moves')).toHaveText(
        `Page achevée en ${4 + extra} mouvements.`,
      );
      const stored = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('color-world.save')!),
      );
      expect(stored.completed[1].stars).toBe(stars);
      expect(stored.seeds).toBe(35);
      expect(stored.pigments).toHaveLength(1);
    }
    const replay = attempt(3, true);
    await page.setViewportSize({ width: 320, height: 740 });
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      replay.save,
    );
    await page.goto(url);
    await page
      .getByRole('button', { name: new RegExp(`^Flacon ${replay.last.from + 1},`) })
      .click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${replay.last.to + 1},`) }).click();
    await expect(page.getByTestId('page-earned-stars')).toHaveText('★');
    await expect(page.getByTestId('page-saved-best-stars')).toHaveText(
      'Meilleur résultat conservé : ★★★',
    );
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    expect(stored.completed).toEqual(replay.save.completed);
    expect(stored.seeds).toBe(replay.save.seeds);
    expect(stored.pigments).toEqual(replay.save.pigments);
    await page.screenshot({ path: 'test-results/stars-current-attempt-and-best.png' });
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    await expect(page.getByRole('button', { name: 'Poursuivre la restauration' })).toBeVisible();
    const target = (await page.getByTestId('page-star-target').boundingBox())!;
    expect(target.x).toBeGreaterThanOrEqual(0);
    expect(target.x + target.width).toBeLessThanOrEqual(320);
    expect(errors).toEqual([]);
    console.log(
      'Stars passed: legitimate 4/5/6/7-move attempts earn 3/3/2/1 stars; exact minimum and target shown only in result, actual replay rating displayed while best/date/seeds/pigments stay intact, narrow mobile controls usable.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
