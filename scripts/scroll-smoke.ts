import { chromium, expect } from '@playwright/test';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet, openScreen } from './navigation-test-helper';
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 680 } });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  let save = { ...initial(), started: true, guideSeen: true };
  for (const l of levels.slice(0, 99)) {
    save = loadLevel(save, l.id);
    for (const m of l.solution) save = move(save, m.from, m.to);
  }
  save = loadLevel(save, 100);
  save.settings = { ...save.settings, motion: true, music: false, sound: false, haptics: false };
  try {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await openCarnet(page);
    const before = await page.evaluate(() => localStorage.getItem('color-world.save'));
    const hud = page.getByTestId('game-hud');
    const top = page.getByRole('button', { name: 'Revenir en haut de la page' });
    await expect(page.getByTestId('book-page-scroll')).toHaveCount(0);
    await expect(top).toHaveCount(0);
    await page.mouse.move(190, 400);
    await page.mouse.wheel(0, 1000);
    await expect(hud).toBeInViewport();
    for (const tube of await page.getByRole('button', { name: /^Flacon \d+,/ }).all())
      await expect(tube).toBeInViewport();
    expect(await page.evaluate(() => scrollY)).toBe(0);
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
    await openScreen(page, 'Le Grand Herbier');
    const scroll = page.getByTestId('book-page-scroll');
    await scroll.evaluate((n) => (n.scrollTop = n.scrollHeight));
    await expect(hud).not.toBeInViewport();
    await expect(top).toBeInViewport();
    await top.click();
    await expect.poll(() => scroll.evaluate((n) => n.scrollTop)).toBe(0);
    await expect(hud).toBeInViewport();
    await openScreen(page, 'Écosystèmes');
    await expect(page.getByTestId('ecosystem-map-scroll')).toBeVisible();
    await expect(hud).toBeInViewport();
    await expect(top).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
    console.log(
      'Scroll behavior passed: gameplay stays fixed with every tube and control visible; the herbarium keeps its scroll/return arrow and the ecosystems keep their inner frame scroll; unchanged save.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
