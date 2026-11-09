import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  const home = page.getByTestId('home-screen');
  const play = () => page.getByTestId('home-restore-action').getByRole('button');
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Passer le prologue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Votre pseudo', exact: true }).fill('Dainty');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(home).toBeVisible();
    await expect(page.getByTestId('botanical-guide')).toHaveCount(0);
    await expect(page.getByTestId('page-folio')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Menu principal', exact: true })).toHaveCount(0);
    await expect(page.getByTestId('home-garden-background')).toBeVisible();
    await expect(page.getByTestId('home-living-book')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Observer ma planche dans l’herbier', exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Herbier', exact: true })).toHaveCount(1);
    await expect(page.getByText('Le cabinet de Dainty', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('seed-count')).toHaveText('1');
    await expect(page.getByRole('heading', { name: 'Modes de jeu', exact: true })).toBeVisible();
    await expect(page.getByTestId('home-current-page')).toHaveText('Page 01');
    expect((await stored()).guideSeen).toBe(false);
    expect((await stored()).seeds).toBe(1);
    const first = await stored();
    // An entrance uses immutable SVG drawings; transforms move native layers only.
    await page.waitForTimeout(350);
    await page.evaluate(() => {
      (window as any).homeSvgChanges = 0;
      new MutationObserver((records) => {
        for (const record of records)
          if (record.target instanceof SVGElement) (window as any).homeSvgChanges++;
      }).observe(document.querySelector('[data-testid="home-screen"]')!, {
        subtree: true,
        attributes: true,
      });
    });
    await expect(page.getByTestId('home-stage-settled')).toBeAttached();
    expect(await page.evaluate(() => (window as any).homeSvgChanges)).toBe(0);
    await expect(page.getByTestId('home-butterfly')).toHaveCount(0);
    await page.screenshot({ path: 'test-results/home-first-390.png' });
    for (const mode of ['day', 'mystery']) {
      const card = page.getByTestId(`home-future-${mode}`);
      await expect(card).toContainText('À venir');
      await expect(card.getByRole('button')).toHaveCount(0);
      const beforeUrl = page.url();
      await card.click();
      expect(page.url()).toBe(beforeUrl);
      expect(await stored()).toEqual(first);
    }
    // Help is optional on the cabinet; the first actual play opens the first-feuillet guide.
    await page.getByRole('link', { name: 'Aide', exact: true }).click();
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    await page.getByRole('button', { name: 'Fermer l’aide', exact: true }).click();
    await expect(home).toBeVisible();
    expect(await stored()).toEqual(first);
    await play().click();
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    const attempt = levels[0].solution[0];
    const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
    await tube(attempt.from).click();
    await tube(attempt.to).click();
    await expect.poll(async () => (await stored()).moves).toBe(1);
    await expect(page.getByTestId('liquid-board-idle')).toBeAttached();
    const progressed = await stored();
    await openScreen(page, 'Accueil');
    await expect(home).toBeVisible();
    expect(await stored()).toEqual(progressed);
    await play().click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    expect(await stored()).toEqual(progressed);
    // A cold launch returns directly to the cabinet, with no extra returning/signature gate.
    await page.goto(url);
    await expect(home).toBeVisible();
    await expect(page.getByTestId('book-signature-page')).toHaveCount(0);
    await expect(page.getByTestId('book-opening-film')).toHaveCount(0);
    expect(await stored()).toEqual(progressed);
    // Replaying the cinematic is voluntary and comes back to the cabinet without a signature.
    await page.getByRole('button', { name: 'Revoir le prologue', exact: true }).click();
    await expect(page.getByTestId('book-opening-film')).toBeVisible();
    await page.getByRole('button', { name: 'Passer le prologue', exact: true }).click();
    await expect(page.getByTestId('book-opening-film')).toHaveCount(0);
    await expect(page.getByTestId('book-signature-page')).toHaveCount(0);
    await expect(home).toBeVisible();
    expect(await stored()).toEqual(progressed);
    for (const [width, height] of [
      [320, 400],
      [320, 432],
      [320, 480],
      [320, 568],
      [360, 640],
      [393, 760],
      [390, 844],
      [430, 932],
      [600, 960],
      [768, 1024],
      [820, 1180],
      [1024, 768],
      [1280, 900],
      [568, 280],
      [667, 320],
      [740, 360],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      await expect(page.getByTestId('home-stage-settled')).toBeAttached();
      const targets = [
        page.getByTestId('home-modes'),
        page.getByTestId('home-footer'),
        play(),
        page.getByRole('button', { name: /^Graines dorées/ }),
        ...['Herbier', 'Écosystèmes', 'Boutique', 'Paramètres', 'Aide'].map((name) =>
          page.getByRole('link', { name, exact: true }),
        ),
        page.getByRole('button', { name: 'Revoir le prologue', exact: true }),
      ];
      for (const target of targets) {
        await expect
          .poll(
            async () => {
              const b = await target.boundingBox();
              return (
                !!b &&
                b.x >= -1 &&
                b.y >= -1 &&
                b.x + b.width <= width + 1 &&
                b.y + b.height <= height + 1
              );
            },
            { message: `Visible without scrolling at ${width}×${height}` },
          )
          .toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
      expect(
        await home.evaluate((node) => node.scrollHeight - node.clientHeight),
      ).toBeLessThanOrEqual(1);
      const action = (await play().boundingBox())!;
      const card = (await page.getByTestId('home-restoration-card').boundingBox())!;
      expect(action.height).toBeGreaterThanOrEqual(48);
      expect(action.y + action.height).toBeLessThanOrEqual(card.y + card.height + 1);
      const masthead = (await page.getByTestId('home-masthead').boundingBox())!;
      const seeds = (await page.getByRole('button', { name: /^Graines dorées/ }).boundingBox())!;
      expect(seeds.y).toBeGreaterThanOrEqual(masthead.y - 1);
      expect(seeds.y + seeds.height).toBeLessThanOrEqual(masthead.y + masthead.height + 1);
      await page.mouse.wheel(0, 800);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({ path: `test-results/home-fit-${width}x${height}.png` });
    }
    // Reserve real space for phone system bars; mode cards adapt to the available area.
    await page.setViewportSize({ width: 360, height: 640 });
    await home.evaluate((node) => {
      node.style.paddingTop = '28px';
      node.style.paddingBottom = '24px';
    });
    await expect
      .poll(async () => {
        const b = (await page.getByTestId('home-footer').boundingBox())!;
        return b.y + b.height <= 616;
      })
      .toBe(true);
    const reserve = page.getByRole('button', { name: /^Graines dorées/ });
    await reserve.click();
    await expect(page.getByTestId('seed-explanation')).toBeVisible();
    await page.getByRole('button', { name: 'Retourner à mon herbier', exact: true }).click();
    expect(await stored()).toEqual(progressed);
    await home.evaluate((node) => {
      node.style.paddingTop = '0px';
      node.style.paddingBottom = '0px';
    });
    // The simplified card still displays the real current plant and page.
    let advanced = { ...initial(), started: true, guideSeen: true, nickname: 'Dainty' };
    for (const level of levels.slice(0, 5)) {
      advanced = loadLevel(advanced, level.id);
      for (const pour of level.solution) advanced = move(advanced, pour.from, pour.to);
    }
    advanced = loadLevel(advanced, 6);
    const next = levels[5].solution[0];
    advanced = move(advanced, next.from, next.to);
    advanced.settings = {
      sound: false,
      music: false,
      haptics: false,
      motion: false,
      patterns: true,
    };
    await page.evaluate(
      (save) => localStorage.setItem('color-world.save', JSON.stringify(save)),
      advanced,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await expect(home).toBeVisible();
    await expect(page.getByTestId('home-current-page')).toHaveText('Page 06');
    await expect(page.getByTestId('home-current-species')).toHaveText('Bleuet');
    await expect(page.getByTestId('home-collection-caption')).toHaveCount(0);
    await expect(page.getByTestId('home-stage-settled')).toBeAttached();
    await expect(page.getByTestId('home-butterfly')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Revoir le prologue', exact: true })).toHaveCount(
      0,
    );
    await page.screenshot({ path: 'test-results/home-advanced-390.png' });
    expect(await stored()).toEqual(advanced);
    await play().click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 06');
    expect(await stored()).toEqual(advanced);
    await openScreen(page, 'Paramètres');
    await page.getByRole('button', { name: 'Remettre ma progression à zéro', exact: true }).click();
    await page.getByRole('button', { name: 'Continuer vers la confirmation', exact: true }).click();
    await page.getByRole('button', { name: 'Oui, effacer ma progression', exact: true }).click();
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await page.getByRole('textbox', { name: 'Votre pseudo', exact: true }).fill('Camille');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(home).toBeVisible();
    expect((await stored()).seeds).toBe(1);
    expect((await stored()).guideSeen).toBe(false);
    expect((await stored()).completed).toEqual({});
    expect(errors).toEqual([]);
    console.log(
      'Home passed: signature → cabinet, direct returning launch, real resume preserving board/history/seeds, optional help and first-play guide, voluntary prologue replay, honest future modes, immutable SVG choreography, 17 phone/tablet/landscape sizes without scrolling, safe areas and masthead seed reserve, advanced plant progression, reduced motion and reset.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
