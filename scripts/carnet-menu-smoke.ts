import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet, openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const fixture = { ...initial(), started: true, nickname: 'Dainty' };
  fixture.settings = { ...fixture.settings, sound: false, music: false, haptics: false };
  await page.addInitScript((s) => {
    if (!localStorage.getItem('color-world.save'))
      localStorage.setItem('color-world.save', JSON.stringify(s));
  }, fixture);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8110/';
  const menu = page.getByTestId('game-carnet-menu');
  const openMenu = async () => {
    await page.getByRole('button', { name: 'Ouvrir le carnet', exact: true }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByTestId('carnet-menu-settled')).toBeAttached();
  };
  const stored = () => page.evaluate(() => localStorage.getItem('color-world.save'));
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await openCarnet(page);
    const move = levels[0].solution[0];
    const tube = (i: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${i + 1},`) });
    await tube(move.from).click();
    const before = await stored();
    await openMenu();
    await expect(menu.getByTestId('carnet-owner')).toHaveText('Le carnet de Dainty');
    const bounds = (await menu.boundingBox())!;
    expect(bounds.x + bounds.width / 2).toBeCloseTo(393 / 2, 0);
    expect(bounds.y + bounds.height / 2).toBeCloseTo(852 / 2, 0);
    for (const name of [
      'Le Grand Herbier',
      'Écosystèmes',
      'La Boutique',
      'Paramètres',
      'L’Atelier',
      'Aide',
    ]) {
      await expect(menu.getByRole('link', { name, exact: true })).toBeInViewport();
    }
    expect(
      await menu
        .getByRole('link', { name: 'Le Grand Herbier', exact: true })
        .getByText('Le Grand Herbier', { exact: true })
        .evaluate((n) => getComputedStyle(n).fontFamily),
    ).toContain('HerbariumDisplay');
    await page.screenshot({ path: 'test-results/carnet-frontispiece-393.png' });
    await menu.getByRole('button', { name: 'Reprendre la partie' }).click();
    await expect(menu).toHaveCount(0);
    expect(await stored()).toBe(before);
    // Source selection survives the menu: only the destination is touched now.
    await tube(move.to).click();
    await expect.poll(async () => JSON.parse((await stored())!).moves).toBe(1);
    await expect(page.getByTestId('liquid-board-idle')).toBeAttached();
    const progressed = JSON.parse((await stored())!);
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [1440, 900],
      [740, 360],
    ]) {
      await page.setViewportSize({ width, height });
      await openMenu();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      const box = (await menu.boundingBox())!;
      expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
      await expect(
        menu.getByRole('button', { name: 'Fermer le carnet', exact: true }),
      ).toBeInViewport();
      for (const name of [
        'Reprendre la partie',
        'Le Grand Herbier',
        'Écosystèmes',
        'La Boutique',
        'Paramètres',
        'L’Atelier',
        'Aide',
      ]) {
        const item = menu.getByRole(name === 'Reprendre la partie' ? 'button' : 'link', {
          name,
          exact: true,
        });
        await item.scrollIntoViewIfNeeded();
        const b = (await item.boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(box.x);
        expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 1);
        await expect(item).toBeInViewport();
      }
      await page.screenshot({
        path: `test-results/carnet-frontispiece-${width}x${height}.png`,
        fullPage: true,
      });
      await menu.getByRole('button', { name: 'Fermer le carnet' }).click();
      expect(JSON.parse((await stored())!).board).toEqual(progressed.board);
    }
    await page.setViewportSize({ width: 393, height: 852 });
    for (const name of [
      'Le Grand Herbier',
      'Écosystèmes',
      'La Boutique',
      'Paramètres',
      'L’Atelier',
    ]) {
      await openScreen(page, name);
      await expect(menu).toHaveCount(0);
      expect(JSON.parse((await stored())!).board).toEqual(progressed.board);
    }
    // Observe SVG geometry during the real entrance, after its initial layout settles.
    await page.getByRole('button', { name: 'Ouvrir le carnet', exact: true }).click();
    await expect(menu).toBeVisible();
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      (window as any).menuSvgChanges = 0;
      new MutationObserver((rs) => {
        for (const r of rs) if (r.target instanceof SVGElement) (window as any).menuSvgChanges++;
      }).observe(document.querySelector('[data-testid="game-carnet-menu"]')!, {
        subtree: true,
        attributes: true,
      });
    });
    await expect(menu.getByTestId('carnet-menu-settled')).toBeAttached();
    expect(await page.evaluate(() => (window as any).menuSvgChanges)).toBe(0);
    await expect(menu.getByTestId('carnet-pollen')).toHaveCount(0);
    await menu.getByRole('button', { name: 'Fermer le carnet' }).click();
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Animations douces', exact: true }).click();
    await page.getByRole('button', { name: 'Ouvrir le carnet', exact: true }).click();
    await expect(menu.getByTestId('carnet-menu-settled')).toBeAttached();
    await expect(menu.getByTestId('carnet-pollen')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log(
      'Carnet passed: centered frontispiece, original illustrated tiles, 320×568/390/desktop/landscape scroll access, all destinations, source selection and progress preserved, immutable SVG entrance, finite pollen and reduced motion/Escape.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
