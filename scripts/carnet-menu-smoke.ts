import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel } from '../src/state/model';
import { mechanicIds } from '../src/engine/mechanics';
import levels from '../src/data/levels.json';
import { openCarnet, openHome, openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const fixture = { ...initial(), started: true, guideSeen: true, nickname: 'Dainty' };
  fixture.settings = { ...fixture.settings, sound: false, music: false, haptics: false };
  await page.addInitScript((s) => {
    if (!localStorage.getItem('color-world.save'))
      localStorage.setItem('color-world.save', JSON.stringify(s));
  }, fixture);
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  const stored = () => page.evaluate(() => localStorage.getItem('color-world.save'));
  const home = page.getByTestId('home-screen');
  const menu = () => page.getByRole('button', { name: 'Menu principal', exact: true });
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await openCarnet(page);
    const first = levels[0].solution[0];
    const tube = (i: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${i + 1},`) });
    await tube(first.from).click();
    await tube(first.to).click();
    await expect.poll(async () => JSON.parse((await stored())!).moves).toBe(1);
    await expect(page.getByTestId('liquid-board-idle')).toBeAttached();
    const progress = await stored();
    await expect(menu().getByText('Menu', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/central-menu-button.png' });
    await page.evaluate(() => {
      (window as any).menuSvgChanges = 0;
      (window as any).menuMotionFrames = new Set<string>();
      const button = document.querySelector('[data-testid="herbarium-book-button"]')!;
      new MutationObserver((records) => {
        for (const r of records) {
          if (r.target instanceof SVGElement) (window as any).menuSvgChanges++;
          if (r.target instanceof HTMLElement && r.target.dataset.testid === 'menu-book-cover')
            (window as any).menuMotionFrames.add(r.target.style.transform);
        }
      }).observe(button, { subtree: true, attributes: true });
    });
    // Rapid taps must produce one finite return, with immutable SVG drawings.
    await menu().dispatchEvent('click');
    await menu().dispatchEvent('click');
    await expect(page.getByTestId('menu-book-folio-0')).toBeAttached();
    await expect(page.getByTestId('menu-book-folio-1')).toBeAttached();
    await page.waitForTimeout(230);
    await page.screenshot({ path: 'test-results/central-menu-book-opening.png' });
    await expect(home).toBeVisible();
    expect(await page.evaluate(() => (window as any).menuSvgChanges)).toBe(0);
    expect(await page.evaluate(() => (window as any).menuMotionFrames.size)).toBeGreaterThan(1);
    await expect(page.getByTestId('game-carnet-menu')).toHaveCount(0);
    expect(await stored()).toBe(progress);
    const destinations = [
      ['Herbier', /\/herbier\/?$/],
      ['Écosystèmes', /\/carte\/?$/],
      ['Boutique', /\/boutique\/?$/],
      ['Paramètres', /\/parametres\/?$/],
      ['Aide', /\/aide\/?$/],
    ] as const;
    for (const [label, path] of destinations) {
      await page.getByRole('link', { name: label, exact: true }).click();
      await expect(page).toHaveURL(path);
      expect(await stored()).toBe(progress);
      if (label === 'Aide')
        await page.getByRole('button', { name: 'Fermer l’aide', exact: true }).click();
      else await openHome(page);
      await expect(home).toBeVisible();
      await expect(page.getByTestId('game-carnet-menu')).toHaveCount(0);
      expect(await stored()).toBe(progress);
    }
    await openCarnet(page);
    expect(await stored()).toBe(progress);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Animations douces', exact: true }).click();
    const staticSave = await stored();
    await menu().dispatchEvent('click');
    await expect(home).toBeVisible();
    await expect(page.getByTestId('menu-return-opening')).toHaveCount(0);
    expect(await stored()).toBe(staticSave);
    await page.screenshot({ path: 'test-results/central-menu-home.png' });
    await openCarnet(page);
    expect(await stored()).toBe(staticSave);
    // The same readable compact book must fit dense trial pages and the
    // 48-point landscape HUD without changing the play area's scroll behavior.
    for (const [width, height] of [
      [320, 400],
      [412, 915],
      [932, 430],
      [768, 1024],
    ]) {
      await page.setViewportSize({ width, height });
      const trial = loadLevel({ ...fixture, testSession: { returnSave: fixture } }, 870);
      trial.seenMechanics = [...mechanicIds];
      trial.settings = { ...fixture.settings, motion: false };
      await page.evaluate(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        trial,
      );
      await page.goto(url + 'atelier');
      await expect(page.getByTestId('page-folio')).toHaveText('PAGE 870');
      await expect(menu().getByText('Menu', { exact: true })).toBeVisible();
      const button = (await menu().boundingBox())!,
        hud = (await page.getByTestId('game-hud').boundingBox())!;
      expect(button.width).toBeGreaterThanOrEqual(44);
      expect(button.height).toBeGreaterThanOrEqual(44);
      expect(button.y).toBeGreaterThanOrEqual(hud.y);
      expect(button.y + button.height).toBeLessThanOrEqual(hud.y + hud.height + 0.1);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
        height + 1,
      );
      await page.screenshot({ path: `test-results/menu-book-${width}x${height}.png` });
      const untouched = await stored();
      await menu().click();
      await expect(home).toBeVisible();
      expect(await stored()).toBe(untouched);
    }
    expect(errors).toEqual([]);
    console.log(
      'Central menu passed: gilt botanical book and readable Menu label; two turning folios and immutable SVG; rapid-tap guard; all five destinations and return paths; real game resume; reduced motion; dense page 870 on four phone/tablet/landscape formats without scroll or HUD overlap.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
