import { openScreen } from './navigation-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(page.getByRole('button', { name: 'Commencer la restauration' })).not.toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(
      await page
        .locator('img[src*="serre."]')
        .first()
        .evaluate(
          (node) =>
            (node as HTMLImageElement).complete && (node as HTMLImageElement).naturalWidth > 1000,
        ),
    ).toBe(true);
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(2);
    const title = page.getByText('La serre des pigments', { exact: true });
    expect(await title.evaluate((node) => getComputedStyle(node).fontFamily)).toContain(
      'HerbariumDisplay',
    );
    expect(
      await page
        .getByText('Papaver rhoeas', { exact: true })
        .evaluate((node) => getComputedStyle(node).fontFamily),
    ).toContain('HerbariumScientific');
    await page.evaluate(async () => {
      await Promise.all(
        [
          'HerbariumDisplay',
          'HerbariumDisplayBold',
          'HerbariumBody',
          'HerbariumMedium',
          'HerbariumBold',
          'HerbariumScientific',
        ].map((family) => document.fonts.load(`16px "${family}"`)),
      );
    });
    const loaded = await page.evaluate(() => {
      const names: string[] = [];
      document.fonts.forEach((font) => {
        if (font.status === 'loaded') names.push(font.family.replace(/['"]/g, ''));
      });
      return names;
    });
    for (const family of [
      'HerbariumDisplay',
      'HerbariumDisplayBold',
      'HerbariumBody',
      'HerbariumMedium',
      'HerbariumBold',
      'HerbariumScientific',
    ])
      expect(loaded).toContain(family);
    await page.screenshot({ path: 'test-results/greenhouse-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(2);
    await page.screenshot({ path: 'test-results/greenhouse-small-mobile.png', fullPage: true });
    let save: Save = { ...initial(), started: true };
    for (const l of levels.slice(0, 99)) {
      save = loadLevel(save, l.id);
      for (const m of l.solution) save = move(save, m.from, m.to);
    }
    save = loadLevel(save, 100);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(4);
    await page.screenshot({ path: 'test-results/greenhouse-two-racks.png', fullPage: true });
    await openScreen(page, 'Le Grand Herbier');
    expect(
      await page
        .getByText('Le Grand Herbier', { exact: true })
        .last()
        .evaluate((node) => getComputedStyle(node).fontFamily),
    ).toContain('HerbariumDisplay');
    expect(errors).toEqual([]);
    console.log(
      'Greenhouse: background loaded, all six typefaces loaded, full interface typography, holders for each row, 320px and 390px mobile layouts passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
