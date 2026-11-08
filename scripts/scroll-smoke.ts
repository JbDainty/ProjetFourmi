import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet, openScreen } from './navigation-test-helper';

function twoRows(motion: boolean) {
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, 99)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = loadLevel(save, 100);
  save.settings = { ...save.settings, motion, sound: false, music: false, haptics: false };
  return save;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 680 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  const scroll = page.getByTestId('book-page-scroll');
  const hud = page.getByTestId('game-hud');
  const top = page.getByRole('button', { name: 'Revenir en haut de la page' });
  const offset = () => scroll.evaluate((node) => node.scrollTop);
  const seed = async (motion: boolean) => {
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      twoRows(motion),
    );
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 100');
    await expect(hud).toBeInViewport();
  };
  try {
    await page.goto(url);
    await openCarnet(page);
    await seed(true);
    const before = await page.evaluate(() => localStorage.getItem('color-world.save'));
    await expect(page.locator('g[id^="tube-rack-"]')).toHaveCount(4);
    await expect(top).not.toBeInViewport();
    // Real wheel scrolling reproduces the formerly pinned header over the second row.
    await page.mouse.move(195, 420);
    await page.mouse.wheel(0, 900);
    await expect.poll(offset).toBeGreaterThan(150);
    await expect(hud).not.toBeInViewport();
    await expect(
      page.getByRole('button', { name: 'Menu principal', exact: true }),
    ).not.toBeInViewport();
    await expect(top).toBeInViewport();
    const arrow = (await top.boundingBox())!,
      hint = (await page.getByRole('button', { name: 'Indice', exact: true }).boundingBox())!;
    const lastTube = (await page
      .getByRole('button', { name: /^Flacon \d+,/ })
      .last()
      .boundingBox())!;
    expect(arrow.y).toBeGreaterThanOrEqual(hint.y + hint.height);
    expect(arrow.y).toBeGreaterThan(lastTube.y + lastTube.height);
    await page.screenshot({ path: 'test-results/scroll-two-rows-bottom.png' });
    const initialOffset = await offset();
    await page.evaluate(`
      window.bookScrollFrames = [];
      const node = document.querySelector('[data-testid="book-page-scroll"]');
      const sample = () => {
        window.bookScrollFrames.push(node.scrollTop);
        if (node.scrollTop > 0 && window.bookScrollFrames.length < 200) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    `);
    await top.click();
    await expect.poll(offset).toBe(0);
    await expect(hud).toBeInViewport();
    expect(
      await page
        .evaluate(() => (window as unknown as { bookScrollFrames: number[] }).bookScrollFrames)
        .then((frames) => frames.some((y) => y > 0 && y < initialOffset - 2)),
    ).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
    await page.screenshot({ path: 'test-results/scroll-returned-to-title.png' });
    // The footer measures overflow without measuring itself; it must disappear on tall screens.
    await page.setViewportSize({ width: 390, height: 1200 });
    await expect(top).toHaveCount(0);
    expect(await offset()).toBe(0);
    await page.setViewportSize({ width: 320, height: 740 });
    await expect(top).toBeAttached();
    await scroll.evaluate((node) => (node.scrollTop = node.scrollHeight));
    await expect(top).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await page.screenshot({ path: 'test-results/scroll-narrow-bottom.png' });
    await top.click();
    await expect.poll(offset).toBe(0);
    await openScreen(page, 'Le Grand Herbier');
    await expect(hud).toHaveCount(1);
    await scroll.evaluate((node) => (node.scrollTop = node.scrollHeight));
    await expect(hud).not.toBeInViewport();
    await expect(top).toBeInViewport();
    await top.click();
    await expect.poll(offset).toBe(0);
    await openScreen(page, 'Écosystèmes');
    await expect(hud).toHaveCount(1);
    await expect(hud).toBeInViewport();
    await seed(false);
    await scroll.evaluate((node) => (node.scrollTop = node.scrollHeight));
    await expect(hud).not.toBeInViewport();
    await top.click();
    expect(await offset()).toBe(0); // Reduced motion returns immediately.
    await expect(hud).toBeInViewport();
    const small = { ...initial(), started: true };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), small);
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect(hud).toBeInViewport();
    await expect(top).toHaveCount(0);
    await expect(page.getByTestId('book-return-footer')).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log(
      'Scroll passed: two rows scroll header/book/seeds out of view; botanical footer never overlaps tubes or controls, smooth and reduced-motion return, stable resize without self-created overflow, 320px mobile, gallery/map header, unchanged progression and no unnecessary arrow on fitting pages.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
