import { openCarnet, openScreen } from './navigation-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await openCarnet(page);
    const save = initial();
    save.started = true;
    save.settings.motion = false;
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.reload();
    await openCarnet(page);
    await expect(page.getByTestId('game-hud')).toBeVisible();
    await expect(page.getByText('PAGE 01', { exact: true })).toBeVisible();
    await expect(page.getByText(/NIVEAU|\/ 100/)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Herbier\s+des couleurs/ })).toBeVisible();
    await expect(page.getByText('COLOR WORLD', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('link')).toHaveCount(0);
    expect(
      await page
        .getByTestId('liquid-board-idle')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
    ).toBe('rgba(0, 0, 0, 0)');
    const stamp = page.getByTestId('current-botanical-stamp');
    await expect(stamp).toHaveAccessibleName(
      'Ouvrir la planche de Coquelicot, 0 couleurs sur 4 restaurées',
    );
    await expect(page.getByTestId('atelier-full-plate')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Indice', exact: true })).toBeInViewport();
    await expect(page.getByTestId('spell-icon-hint')).toBeVisible();
    const first = levels[0].solution[0];
    await page.getByRole('button', { name: new RegExp(`^Flacon ${first.from + 1},`) }).click();
    const before = await page.evaluate(() => localStorage.getItem('color-world.save'));
    await openScreen(page, 'Accueil');
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect(page.getByTestId('menu-return-opening')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Herbier', exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/game-main-menu.png', fullPage: true });
    await openCarnet(page);
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
    await page.getByRole('button', { name: new RegExp(`^Flacon ${first.from + 1},`) }).click();
    await stamp.click();
    const dialog = page.getByTestId('current-plate-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('0 / 4 couleurs restaurées')).toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-stamp-open.png', fullPage: true });
    await page.getByRole('button', { name: 'Revenir au jeu' }).click();
    await expect(dialog).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(before);
    // The selected source survives opening the plate: only the destination is tapped now.
    await page.getByRole('button', { name: new RegExp(`^Flacon ${first.to + 1},`) }).click();
    await expect
      .poll(
        async () =>
          JSON.parse((await page.evaluate(() => localStorage.getItem('color-world.save')))!).moves,
      )
      .toBe(1);
    for (const m of levels[0].solution.slice(1)) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
    }
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(stamp).toHaveAccessibleName(
      'Ouvrir la planche de Coquelicot, 1 couleur sur 4 restaurée',
    );
    await page.reload();
    await openCarnet(page);
    await expect(stamp).toHaveAccessibleName(
      'Ouvrir la planche de Coquelicot, 1 couleur sur 4 restaurée',
    );
    await stamp.click();
    await expect(dialog.getByText('1 / 4 couleur restaurée')).toBeVisible();
    await page.getByRole('button', { name: 'Fermer la planche' }).click();
    await page.screenshot({ path: 'test-results/mobile-stamp-restored.png', fullPage: true });
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await expect(stamp).toBeInViewport();
      await page.screenshot({
        path: `test-results/mobile-integrated-${width}.png`,
        fullPage: true,
      });
      await openScreen(page, 'Le Grand Herbier');
      await expect(
        page.getByRole('button', { name: 'Pigments et sceaux', exact: true }),
      ).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      await openScreen(page, 'L’Atelier');
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByTestId('atelier-full-plate')).toBeVisible();
    // The fixed caption keeps the same stamp access across phone and desktop layouts.
    await expect(stamp).toBeInViewport();
    await stamp.click();
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Revenir au jeu' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Le Grand Herbier', exact: true })).toHaveCount(0);
    await page.screenshot({ path: 'test-results/game-hud-desktop.png', fullPage: true });
    // Observe actual SVG frames while the cover opens; the same menu must then be usable.
    const animated = await browser.newPage({ viewport: { width: 390, height: 844 } });
    animated.on('pageerror', (e) => errors.push(e.message));
    await animated.goto(url);
    let bookSave = { ...initial(), started: true };
    for (const level of levels.slice(0, 3)) {
      bookSave = loadLevel(bookSave, level.id);
      for (const m of level.solution) bookSave = move(bookSave, m.from, m.to);
    }
    bookSave = loadLevel(bookSave, 4);
    await animated.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      bookSave,
    );
    await animated.reload();
    await openCarnet(animated);
    await expect(animated.getByText('PAGE 04', { exact: true })).toBeVisible();
    await expect(animated.getByText(/\/ 100/)).toHaveCount(0);
    await animated.screenshot({
      path: 'test-results/botanical-book-title-mobile.png',
      fullPage: true,
    });
    const livingTitle = animated.getByTestId('game-hud').getByTestId('herbarium-book-title');
    const flowerMove = levels[3].solution[0];
    await animated
      .getByRole('button', { name: new RegExp(`^Flacon ${flowerMove.from + 1},`) })
      .click();
    const savedBeforeFlowers = await animated.evaluate(() =>
      localStorage.getItem('color-world.save'),
    );
    await livingTitle.getByRole('button', { name: 'Faire fleurir le titre' }).click();
    await expect(livingTitle.getByTestId('title-vines-growing')).toHaveCount(1);
    const stem = livingTitle.getByTestId('title-vine-stem');
    const firstStem = await stem.getAttribute('stroke-dashoffset');
    await expect.poll(() => stem.getAttribute('stroke-dashoffset')).not.toBe(firstStem);
    await expect(livingTitle.getByTestId('title-vines-bloomed')).toHaveCount(1);
    await expect(livingTitle.getByTestId('title-vine-flower')).toHaveCount(4);
    expect(await animated.evaluate(() => localStorage.getItem('color-world.save'))).toBe(
      savedBeforeFlowers,
    );
    // Only the destination is tapped: the source selected before flowering survives.
    await animated
      .getByRole('button', { name: new RegExp(`^Flacon ${flowerMove.to + 1},`) })
      .click();
    await expect(animated.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(animated.getByTestId('liquid-board-idle')).toBeVisible();
    await expect
      .poll(
        async () =>
          JSON.parse((await animated.evaluate(() => localStorage.getItem('color-world.save')))!)
            .moves,
      )
      .toBe(1);
    await animated.getByRole('button', { name: 'Annuler', exact: true }).click();
    await expect(animated.getByTestId('menu-return-opening')).toHaveCount(0);
    await animated.screenshot({
      path: 'test-results/living-title-bloomed-mobile.png',
      fullPage: true,
    });
    await openScreen(animated, 'Accueil');
    await expect(animated.getByTestId('home-screen')).toBeVisible();
    await openCarnet(animated);
    await expect(animated.getByText('PAGE 04', { exact: true })).toBeVisible();
    await openScreen(animated, 'Paramètres');
    await animated.getByRole('switch', { name: 'Animations douces' }).click();
    await openScreen(animated, 'L’Atelier');
    await livingTitle.getByRole('button', { name: 'Faire fleurir le titre' }).click();
    await expect(livingTitle.getByTestId('title-vines-bloomed')).toHaveCount(1);
    await expect(livingTitle.getByTestId('title-vines-growing')).toHaveCount(0);
    await animated.close();
    expect(errors).toEqual([]);
    console.log(
      'Living herbarium: growing title vines and flowers, selection preserved through bloom, reduced motion, stamp restoration, persistence, organic chapter and 320/390px layouts passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
