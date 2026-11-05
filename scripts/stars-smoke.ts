import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/levels.json';
import { firstPageAttempt as attempt } from './test-fixtures';

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
      await expect(page.getByTestId('page-earned-stars')).toHaveAccessibleName(
        `${stars} ${stars === 1 ? 'étoile obtenue' : 'étoiles obtenues'} sur 3`,
      );
      await expect(page.getByTestId('botanical-star-earned')).toHaveCount(stars);
      await expect(page.getByTestId('botanical-star-empty')).toHaveCount(3 - stars);
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
    await expect(page.getByTestId('page-earned-stars')).toHaveAccessibleName(
      '1 étoile obtenue sur 3',
    );
    await expect(page.getByTestId('botanical-star-earned')).toHaveCount(1);
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
