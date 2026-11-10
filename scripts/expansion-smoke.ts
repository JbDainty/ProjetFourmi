import { chromium, expect } from '@playwright/test';
import fs from 'node:fs';
import levels, { legacyLevels } from '../src/data/campaign';
import { initial, loadLevel, restore, type Save } from '../src/state/model';
import { mechanicIds } from '../src/engine/mechanics';
import { discoverPigment } from '../src/state/pigments';
import { pour, capacity } from '../src/engine/puzzle';
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
  const url = process.env.GAME_TEST_URL || 'http://localhost:8154/';
  const state = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const seed = async (s: Save, route = 'atelier') => {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + route);
  };
  const real = { ...initial(), started: true, guideSeen: true, seeds: 17 };
  real.settings = { ...real.settings, motion: false, music: false, sound: false };
  fs.mkdirSync('test-results', { recursive: true });
  try {
    await seed(real, 'parametres');
    await page.getByRole('textbox', { name: 'Numéro de la page à tester' }).fill('11');
    await page.getByRole('button', { name: 'Tester cette page', exact: true }).click();
    await expect(page.getByTestId('mechanic-introduction')).toBeVisible();
    await page.getByRole('button', { name: 'J’ai compris', exact: true }).click();
    expect((await state()).testSession?.returnSave.seeds).toBe(17);
    expect(
      await page.getByRole('button', { name: /^Flacon .*teinte mystère/ }).count(),
    ).toBeGreaterThan(0);
    await page.screenshot({ path: 'test-results/expansion-mystery.png' });
    const trial = (id: number) =>
      loadLevel({ ...real, testSession: { returnSave: real }, seeds: 50 }, id);
    for (const mechanic of mechanicIds) {
      const level = levels.find((l) => l.rules?.mechanics.includes(mechanic))!;
      await seed(trial(level.id));
      await expect(page.getByTestId('mechanic-introduction')).toBeVisible();
      await page.screenshot({ path: `test-results/lesson-${mechanic}.png` });
      await page.getByRole('button', { name: 'J’ai compris', exact: true }).click();
      await expect(page.getByTestId('game-actions')).toBeInViewport();
      let expected = level.board;
      for (const m of level.solution) {
        await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
        await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
        expected = pour(expected, m.from, m.to, level.rules)!;
        expect((await state()).board).toEqual(expected);
      }
      await expect(page.getByTestId('victory-summary')).toBeVisible();
      expect((await state()).seeds).toBe(50);
      expect((await state()).completed).toEqual(real.completed);
    }
    // Preview-only navigation restores the exact real attempt, never synthetic rewards.
    await page.goto(url + 'parametres');
    await page
      .getByRole('button', { name: 'Quitter l’essai et retrouver ma partie', exact: true })
      .click();
    expect(await state()).toEqual(real);
    for (const [width, height] of [
      [320, 400],
      [412, 915],
      [768, 1024],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      for (const id of [36, 131, 650, 657, 999, 1000]) {
        await seed({ ...trial(id), seenMechanics: [...mechanicIds] });
        await expect(page.getByTestId('page-folio')).toHaveText(
          `PAGE ${String(id).padStart(2, '0')}`,
        );
        const overflow = await page.evaluate(() => ({
          h: document.documentElement.scrollHeight,
          w: document.documentElement.scrollWidth,
        }));
        expect(overflow.h).toBeLessThanOrEqual(height + 1);
        expect(overflow.w).toBeLessThanOrEqual(width);
        for (const name of ['Annuler', 'Recommencer', 'Mélanger', 'Indice'])
          await expect(page.getByRole('button', { name, exact: true })).toBeInViewport();
        const targets = await page.getByRole('button', { name: /^Flacon / }).all();
        for (const target of targets) {
          const b = (await target.boundingBox())!;
          expect(b.width).toBeGreaterThanOrEqual(43.9);
          expect(b.y + b.height).toBeLessThanOrEqual(height + 1);
        }
      }
    }
    await page.setViewportSize({ width: 412, height: 915 });
    await seed({
      ...trial(36),
      seenMechanics: [...mechanicIds],
      settings: { ...real.settings, motion: true },
    });
    const first = levels[35].solution[0];
    await page.getByRole('button', { name: new RegExp(`^Flacon ${first.from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${first.to + 1},`) }).click();
    await expect(page.locator('#pour-jet')).toBeVisible();
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    const after = await state();
    after.board.forEach((t, i) =>
      expect(t.length).toBeLessThanOrEqual(capacity(levels[35].rules, i)),
    );
    await seed(trial(1000), 'carte');
    await expect(page.getByTestId('journey-page-1000')).toBeVisible();
    expect(await page.locator('[data-testid^="journey-page-"]').count()).toBeLessThan(100);
    await page.screenshot({ path: 'test-results/map-1000.png' });
    await seed(real, 'herbier');
    await expect(page.getByTestId('herbarium-collection-title')).toBeVisible();
    expect(await page.getByRole('button', { name: /^Ouvrir le carnet / }).count()).toBe(20);
    await page
      .getByRole('button', { name: 'Ouvrir le carnet Les sous-bois frais', exact: true })
      .click();
    await expect(page.getByTestId('ecosystem-album')).toBeVisible();
    expect(await page.locator('[aria-label^="Planche de "]').count()).toBe(1);
    await page.getByRole('button', { name: 'Suivante', exact: true }).click();
    await page.screenshot({ path: 'test-results/new-botanical-album.png' });
    expect(await page.locator('[aria-label^="Planche de "]').count()).toBe(1);
    const legacy = { ...real, current: 32, board: legacyLevels[31].board };
    delete legacy.campaign;
    delete legacy.known;
    delete legacy.historyKnown;
    for (let id = 1; id < 32; id++) {
      legacy.completed[id] = { stars: 2, date: '2026-11-01T00:00:00Z' };
      legacy.pigments.push(discoverPigment(id, '2026-11-01T00:00:00Z'));
    }
    const migrated = restore(JSON.stringify(legacy));
    await seed(migrated);
    await expect(page.getByTestId('game-actions')).toBeVisible();
    expect((await state()).board).toEqual(legacy.board);
    expect((await state()).seeds).toBe(17);
    expect(errors).toEqual([]);
    console.log(
      'Expansion passed: 8 real mechanic lessons/solutions, hidden accessibility, isolated tester and return, 1000-page map virtualization, 200-species paged albums, mixed capacities pouring, responsive controls and legacy progression.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
