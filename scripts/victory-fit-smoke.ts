import { chromium, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet } from './navigation-test-helper';
import { firstPageAttempt } from './test-fixtures';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  mkdirSync('test-results', { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
  const win = async (id: number, motion = false) => {
    let save = { ...initial(), started: true, guideSeen: true, nickname: 'Camille' };
    for (const prior of levels.slice(0, id - 1)) {
      save = loadLevel(save, prior.id);
      for (const step of prior.solution) save = move(save, step.from, step.to);
    }
    save = loadLevel(save, id);
    for (const step of levels[id - 1].solution.slice(0, -1)) save = move(save, step.from, step.to);
    save.settings = { ...save.settings, motion, sound: false, music: false, haptics: false };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await openCarnet(page);
    const last = levels[id - 1].solution.at(-1)!;
    await tube(last.from).click();
    await tube(last.to).click();
    await expect(page.getByTestId('victory-result-view')).toBeVisible();
  };
  const fits = async (view: Page, names: string[], width: number, height: number) => {
    const paper = view.getByTestId('victory-living-paper');
    for (const target of [
      paper,
      view.getByTestId('page-earned-stars'),
      ...names.map((name) => paper.getByRole('button', { name, exact: true })),
    ]) {
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
          { message: `Entire result control visible without scrolling at ${width}×${height}` },
        )
        .toBe(true);
    }
    for (const name of names)
      expect(
        (await paper.getByRole('button', { name, exact: true }).boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
    await expect
      .poll(() => paper.evaluate((n) => n.scrollHeight - n.clientHeight))
      .toBeLessThanOrEqual(1);
    const art = view.getByTestId('victory-art-space');
    const image = art.getByRole('img').last();
    await expect(image).toBeVisible();
    await expect
      .poll(
        async () => {
          const b = await image.boundingBox(),
            a = await art.boundingBox();
          return (
            !!b &&
            !!a &&
            b.height > 30 &&
            b.x >= a.x - 1 &&
            b.y >= a.y - 1 &&
            b.x + b.width <= a.x + a.width + 1 &&
            b.y + b.height <= a.y + a.height + 1
          );
        },
        { message: `Botanical artwork fits at ${width}×${height}` },
      )
      .toBe(true);
  };
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Passer le prologue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Votre pseudo', exact: true }).fill('Camille');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await win(3);
    const won = await stored();
    const sizes = [
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
    ];
    for (const revealed of [false, true]) {
      if (revealed)
        await page.getByRole('button', { name: 'Passer l’animation', exact: true }).click();
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        await fits(
          page,
          revealed
            ? ['Poursuivre la restauration', 'Rejouer la page', 'Ouvrir l’herbier']
            : ['Révéler la couleur', 'Rejouer la page', 'Passer l’animation'],
          width,
          height,
        );
        await page.screenshot({
          path: `test-results/victory-fit-${width}x${height}-${revealed ? 'color' : 'ink'}.png`,
        });
      }
      expect(await stored()).toEqual(won);
    }
    await page.getByRole('button', { name: 'Poursuivre la restauration', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 04');
    expect((await stored()).seeds).toBe(won.seeds);
    // A lower-star attempt keeps its replay action on the same visible bottom row.
    const low = firstPageAttempt(3);
    low.save.guideSeen = true;
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      low.save,
    );
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(url);
    await openCarnet(page);
    await tube(low.last.from).click();
    await tube(low.last.to).click();
    await fits(page, ['Révéler la couleur', 'Rejouer la page', 'Passer l’animation'], 320, 568);
    await expect(page.getByTestId('page-earned-stars')).toHaveAccessibleName(
      '1 étoile obtenue sur 3',
    );
    const lowWon = await stored();
    await page.getByRole('button', { name: 'Rejouer la page', exact: true }).click();
    await expect(page.getByTestId('victory-result-view')).toHaveCount(0);
    expect((await stored()).moves).toBe(0);
    expect((await stored()).seeds).toBe(lowWon.seeds);
    // The wax seal is visible in short landscape as well as portrait, and still unlocks continuation.
    for (const [width, height] of [
      [393, 852],
      [568, 280],
    ]) {
      await page.setViewportSize({ width, height });
      await win(5, true);
      const awarded = await stored();
      await page.getByRole('button', { name: 'Estampiller la planche', exact: true }).click();
      const focus = page.getByTestId('seal-ceremony-focus');
      await expect(focus).toBeVisible();
      const sheet = focus.getByTestId('focused-finished-plate');
      const b = (await sheet.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 1);
      expect(b.y + b.height).toBeLessThanOrEqual(height + 1);
      await expect(focus).toHaveCount(0, { timeout: 10000 });
      await fits(
        page,
        ['Découvrir l’espèce suivante', 'Rejouer la page', 'Ouvrir l’herbier'],
        width,
        height,
      );
      expect(await stored()).toEqual(awarded);
    }
    await page.setViewportSize({ width: 320, height: 568 });
    await win(1000);
    await page.getByRole('button', { name: 'Passer l’animation', exact: true }).click();
    await fits(page, ['Contempler mon herbier', 'Rejouer la page', 'Ouvrir l’herbier'], 320, 568);
    const final = await stored();
    await page.getByRole('button', { name: 'Contempler mon herbier', exact: true }).click();
    await expect(page).toHaveURL(/\/herbier\/?$/);
    expect(await stored()).toEqual(final);
    expect(errors).toEqual([]);
    console.log(
      'Victory fit passed: all controls, botanical artwork and stars within fifteen phone/tablet/landscape viewports before and after reveal, low-star replay, large/short wax ceremony, last page, no scroll and unchanged rewards.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
