import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, move } from '../src/state/model';
import { openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  mkdirSync('test-results', { recursive: true });
  const leaf = page.getByTestId('mistake-leaf-note');
  const text = page.getByTestId('mistake-leaf-text');
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n},`) });
  const seed = async (motion: boolean, mismatch = false) => {
    let save = { ...initial(), started: true };
    if (mismatch) save = move(save, 1, 0);
    save.settings = { ...save.settings, motion, sound: false, music: false, haptics: false };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect(leaf).toHaveCount(0);
  };
  try {
    await page.goto(url);
    await seed(true);
    const saveBefore = await page.evaluate(() => localStorage.getItem('color-world.save'));
    const boardBefore = (await page.getByTestId('liquid-board-idle').boundingBox())!;
    await tube(1).click();
    await tube(2).click(); // A full destination cannot accept another pigment.
    await expect(leaf).toBeVisible();
    await expect(text).toHaveText('Versez sur une couleur identique\nou dans un flacon vide.');
    await expect(page.getByTestId('mistake-falling-leaf')).toHaveCount(4);
    const drifting = page.getByTestId('mistake-leaf-drifting');
    const first = await drifting.evaluate((n) => getComputedStyle(n).transform);
    await expect
      .poll(() => drifting.evaluate((n) => getComputedStyle(n).transform))
      .not.toBe(first);
    expect(await text.evaluate((n) => getComputedStyle(n).fontFamily)).toContain(
      'HerbariumHandwritingMedium',
    );
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/mistake-leaves-mobile.png', fullPage: true });
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saveBefore);
    const boardAfter = (await page.getByTestId('liquid-board-idle').boundingBox())!;
    expect(boardAfter.y).toBeCloseTo(boardBefore.y, 0);
    expect(boardAfter.height).toBeCloseTo(boardBefore.height, 0);
    // Repeated errors replace the previous effect, whose cleanup must not dismiss the new one.
    await page.waitForTimeout(1000);
    await tube(2).click(); // Deselect; playing remains possible throughout the effect.
    await expect(leaf).toHaveCount(0);
    await tube(1).click();
    await tube(2).click();
    await expect(leaf).toBeVisible();
    await page.waitForTimeout(4100);
    await expect(leaf).toBeVisible();
    await expect(leaf).toHaveCount(0, { timeout: 3000 });
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saveBefore);

    await page.setViewportSize({ width: 320, height: 740 });
    await seed(true, true);
    await tube(2).click();
    await tube(3).click(); // Two different top colours cannot be combined.
    await expect(leaf).toBeVisible();
    await page.waitForTimeout(1100);
    const noteBox = (await leaf.boundingBox())!,
      textBox = (await text.boundingBox())!;
    expect(await text.evaluate((n) => n.clientHeight)).toBeLessThanOrEqual(48);
    expect(textBox.x).toBeGreaterThanOrEqual(noteBox.x);
    expect(textBox.x + textBox.width).toBeLessThanOrEqual(noteBox.x + noteBox.width + 1);
    expect(textBox.y + textBox.height).toBeLessThan(noteBox.y + noteBox.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await page.screenshot({ path: 'test-results/mistake-leaves-narrow.png', fullPage: true });
    await page.getByRole('button', { name: 'Indice', exact: true }).click();
    await expect(leaf).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toBeVisible();
    await expect(page.getByTestId('hint-pencil')).toBeVisible();
    await page.getByRole('button', { name: 'Recommencer', exact: true }).click();
    await expect(leaf).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
    await tube(2).click();
    await tube(1).click(); // Valid pours still commit immediately after their animation.
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).moves),
    ).toBe(1);

    await seed(false);
    await tube(1).click();
    await tube(2).click();
    await expect(leaf).toBeVisible();
    await expect(page.getByTestId('mistake-leaf-still')).toBeVisible();
    await expect(page.getByTestId('mistake-falling-leaf')).toHaveCount(0);
    await expect(page.getByTestId('mistake-leaf-drifting')).toHaveCount(0);
    await expect(text).toHaveText('Versez sur une couleur identique\nou dans un flacon vide.');
    await page.waitForTimeout(6100);
    await expect(leaf).toHaveCount(0);
    await tube(2).click();
    await tube(1).click();
    await tube(2).click();
    await expect(leaf).toBeVisible();
    await openScreen(page, 'Paramètres');
    await openScreen(page, 'L’Atelier');
    await expect(leaf).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log(
      'Mistake feedback passed: full/different-colour pours show drifting handwritten leaves, auto-dismiss, rapid replacement cleanup, stable rack geometry and unchanged save; input/hints/restart stay responsive, 320px layout, reduced motion and navigation cleanup.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
