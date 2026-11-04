import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import { pour } from '../src/engine/puzzle';
import levels from '../src/data/levels.json';
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const url = (process.env.GAME_TEST_URL || 'http://localhost:8081/').replace(/\/?$/, '/');
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
    errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n},`) });
  const saved = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(page.getByRole('button', { name: 'Commencer la restauration' })).not.toBeVisible();
    const before = await saved();
    await tube(2).click();
    await tube(1).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await page.locator('#pour-jet').waitFor();
    await page.waitForTimeout(170);
    expect((await page.locator('#pour-jet').boundingBox())!.height).toBeGreaterThan(30);
    const first = await page.locator('#pour-jet').getAttribute('d');
    await page.waitForTimeout(100);
    expect(await page.locator('#pour-jet').getAttribute('d')).not.toBe(first);
    expect((await saved()).moves).toBe(before.moves);
    await expect(page.getByRole('button', { name: 'Recommencer', exact: true })).toBeDisabled();
    await page.screenshot({ path: 'test-results/pour-desktop.png', fullPage: true });
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    expect((await saved()).board).toEqual(pour(before.board, 1, 0));
    expect((await saved()).moves).toBe(1);
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    expect((await saved()).board).toEqual(before.board);
    // Leaving during an animation cancels it; it must not modify a hidden puzzle.
    await tube(2).click();
    await tube(1).click();
    await page.locator('#pour-jet').waitFor();
    await page.getByRole('link', { name: 'Le Grand Herbier' }).click();
    await page.waitForTimeout(1900);
    expect((await saved()).moves).toBe(0);
    expect((await saved()).board).toEqual(before.board);
    await page.getByRole('link', { name: 'Paramètres', exact: true }).click();
    await page.getByRole('switch', { name: 'Animations douces' }).click();
    await page.getByRole('link', { name: 'L’Atelier' }).click();
    await tube(2).click();
    await tube(1).click();
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    expect((await saved()).moves).toBe(1);
    await page.reload();
    expect((await saved()).settings.motion).toBe(false);
    // A mobile transfer from the upper row into a lower-row flask.
    let last: Save = {
      ...initial(),
      started: true,
      settings: { sound: false, haptics: false, patterns: true, motion: true },
    };
    for (const level of levels.slice(0, 99)) {
      last = loadLevel(last, level.id);
      for (const m of level.solution) last = move(last, m.from, m.to);
    }
    last = loadLevel(last, 100);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), last);
    await page.goto(url);
    await tube(3).click();
    await tube(6).click();
    await page.locator('#pour-jet').waitFor();
    await page.waitForTimeout(180);
    await page.screenshot({ path: 'test-results/pour-mobile-cross-row.png', fullPage: true });
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    expect((await saved()).board).toEqual(pour(last.board, 2, 5));
    expect((await saved()).moves).toBe(1);
    expect(errors).toEqual([]);
    console.log(
      'Pouring: visible moving stream, atomic commit, undo, navigation cancellation, reduced motion, persistence and mobile cross-row transfer passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
