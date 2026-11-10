import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { chapters } from '../src/data/botany';
import levels from '../src/data/campaign';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    serviceWorkers: 'block',
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const base = process.env.GAME_TEST_URL || 'http://localhost:8158/';
  const real: Save = { ...initial(), started: true, guideSeen: true };
  real.settings = { ...real.settings, motion: false, sound: false, music: false };
  const seed = async (save: Save, route: string) => {
    await page.goto(base);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(base + route);
  };
  mkdirSync('test-results', { recursive: true });
  try {
    // Test-mode completion has a seal but deliberately grants no real completion date.
    let trial = loadLevel({ ...real, testSession: { returnSave: real }, seeds: 50 }, 1000);
    for (const m of levels[999].solution) trial = move(trial, m.from, m.to);
    await seed(trial, 'herbier?plant=199');
    if (process.argv.includes('--reproduce')) {
      await page.waitForTimeout(1000);
      expect(errors.some((e) => /date/.test(e))).toBe(true);
      console.log('Reproduced released crash:', errors);
      return;
    }
    await expect(page.getByTestId('herbarium-direct-plate')).toBeVisible();
    await expect(page.getByText('4 / 4 couleurs · Estampillée', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    await page.getByRole('button', { name: 'Fermer la planche', exact: true }).click();
    await expect(page.getByTestId('herbarium-shelf')).toBeVisible();

    // Worst collection size: only a shelf of four covers is mounted, with no plant images.
    const full: Save = { ...real, completed: {}, pigments: [] };
    for (let id = 1; id <= 1000; id++) {
      full.completed[id] = { stars: 3, date: '2026-11-10T12:00:00Z' };
      full.pigments.push(discoverPigment(id, '2026-11-10T12:00:00Z'));
    }
    await seed(full, 'herbier');
    const saved = await page.evaluate(() => localStorage.getItem('color-world.save'));
    for (const [width, height] of [
      [320, 568],
      [412, 915],
      [768, 1024],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(4);
      expect(await page.locator('[aria-label^="Planche de "]').count()).toBe(0);
      // Covers have fixed, modest dimensions; no screen-sized offscreen SVG frames.
      expect(await page.getByTestId('botanical-foliage-frame').count()).toBe(0);
      const books = await page.locator('[data-testid^="herbarium-book-"]').all();
      for (const book of books) {
        const bounds = (await book.boundingBox())!;
        expect(bounds.height).toBeLessThan(300);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(width + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    await page.setViewportSize({ width: 412, height: 915 });
    await page.screenshot({ path: 'test-results/herbarium-light-shelf.png', fullPage: true });
    const visited: number[] = [];
    for (let shelf = 0; shelf < 5; shelf++) {
      await expect(page.getByTestId('herbarium-shelf-page')).toHaveText(`${shelf + 1} / 5`);
      for (let book = 0; book < 4; book++) {
        const index = shelf * 4 + book;
        await expect(
          page.getByRole('button', {
            name: `Ouvrir le carnet ${chapters[index].name}`,
            exact: true,
          }),
        ).toBeVisible();
        visited.push(index);
      }
      if (shelf < 4) await page.getByRole('button', { name: 'Suite', exact: true }).click();
    }
    expect(visited).toEqual(Array.from({ length: 20 }, (_, i) => i));
    await page
      .getByRole('button', { name: `Ouvrir le carnet ${chapters[19].name}`, exact: true })
      .click();
    for (let leaf = 0; leaf < 10; leaf++) {
      await expect(page.getByTestId('ecosystem-album')).toBeVisible();
      await expect(page.locator('[aria-label^="Planche de "]')).toHaveCount(1);
      if (leaf < 9) await page.getByRole('button', { name: 'Suivante', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Carnets', exact: true }).click();
    await expect(page.getByTestId('herbarium-shelf')).toBeVisible();
    await expect(page.getByTestId('herbarium-shelf-page')).toHaveText('5 / 5');
    await page.getByRole('button', { name: 'Pigments et sceaux', exact: true }).click();
    await expect(page.getByText(/Découvert le|Apposé le/)).toHaveCount(8);
    await page.getByRole('button', { name: 'Suivants', exact: true }).click();
    await expect(page.getByText(/Découvert le|Apposé le/)).toHaveCount(8);
    for (let repeat = 0; repeat < 6; repeat++) {
      await page.goto(base);
      await page.getByRole('link', { name: 'Herbier', exact: true }).click();
      await expect(page.getByTestId('herbarium-shelf')).toBeVisible();
      await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(4);
    }
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saved);
    expect(errors).toEqual([]);
    console.log(
      'Herbarium passed: missing test completion date, 1000-page collection, four lightweight covers, all 20 books, one plate, eight pigments, repeated menu openings, four screen formats and unchanged save.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
