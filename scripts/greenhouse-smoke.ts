import { openCarnet, openScreen } from './navigation-test-helper';
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
  const tightPlayArea = async () => {
    const board = (await page.getByTestId('liquid-board-idle').boundingBox())!;
    const area = (await page.getByTestId('liquid-play-area').boundingBox())!;
    expect(area.height - board.height).toBeLessThanOrEqual(5);
    expect(board.y - area.y).toBeLessThanOrEqual(3);
    return board.height;
  };
  try {
    await page.goto(url);
    await openCarnet(page);
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
    const title = page.getByTestId('current-species-heading');
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
          'HerbariumHandwriting',
          'HerbariumHandwritingMedium',
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
      'HerbariumHandwriting',
      'HerbariumHandwritingMedium',
    ])
      expect(loaded).toContain(family);
    await page.screenshot({ path: 'test-results/greenhouse-desktop.png', fullPage: true });
    const desktopOneRow = await tightPlayArea();
    await page.setViewportSize({ width: 1440, height: 1400 });
    expect(await tightPlayArea()).toBeCloseTo(desktopOneRow, 0);
    await page.setViewportSize({ width: 320, height: 740 });
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(2);
    await page.screenshot({ path: 'test-results/greenhouse-small-mobile.png', fullPage: true });
    const mobileOneRow = await tightPlayArea();
    const mobileBackdrop = (await page.getByTestId('greenhouse-world-background').boundingBox())!
      .height;
    await page.setViewportSize({ width: 320, height: 1200 });
    expect(await tightPlayArea()).toBeCloseTo(mobileOneRow, 0);
    expect(
      (await page.getByTestId('greenhouse-world-background').boundingBox())!.height,
    ).toBeCloseTo(mobileBackdrop, 0);
    await page.screenshot({
      path: 'test-results/greenhouse-tall-phone-compact.png',
      fullPage: true,
    });
    let save: Save = { ...initial(), started: true };
    let fiveTubePage: Save | undefined;
    for (const l of levels.slice(0, 99)) {
      save = loadLevel(save, l.id);
      for (const m of l.solution) save = move(save, m.from, m.to);
      if (l.id === 5) fiveTubePage = loadLevel(save, 6);
    }
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      fiveTubePage!,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await openCarnet(page);
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(2);
    const fiveInOneRow = await tightPlayArea();
    await page.screenshot({
      path: 'test-results/greenhouse-five-tubes-compact.png',
      fullPage: true,
    });
    await page.setViewportSize({ width: 320, height: 844 });
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(4);
    expect(await tightPlayArea()).toBeGreaterThan(fiveInOneRow + 100);
    save = loadLevel(save, 100);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await openCarnet(page);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(4);
    const twoRows = await tightPlayArea();
    expect(twoRows).toBeGreaterThan(mobileOneRow + 100);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
      844,
    );
    await page.screenshot({ path: 'test-results/greenhouse-two-racks.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(2);
    const oneRowSamePuzzle = await tightPlayArea();
    expect(oneRowSamePuzzle).toBeLessThan(twoRows - 100);
    await page.screenshot({ path: 'test-results/greenhouse-wide-one-rack.png', fullPage: true });
    await openScreen(page, 'Le Grand Herbier');
    expect(
      await page
        .getByText('Le Grand Herbier', { exact: true })
        .last()
        .evaluate((node) => getComputedStyle(node).fontFamily),
    ).toContain('HerbariumDisplay');
    expect(errors).toEqual([]);
    console.log(
      'Greenhouse: fonts and scenery loaded, play area fits one or two rows, stable height on tall screens, responsive rack count and mobile layouts passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
