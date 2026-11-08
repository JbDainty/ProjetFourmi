import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial } from '../src/state/model';
import { openCarnet, openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const url = process.env.GAME_TEST_URL || 'http://localhost:8120/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await context.addInitScript(() => {
    (window as any).ambienceStarts = 0;
    const original = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: any[]) {
      if (this.loop) (window as any).ambienceStarts++;
      return (original as any).apply(this, args);
    };
  });
  const saved = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  const vial = (n: number) =>
    page.getByRole('button', { name: new RegExp(`^Fiole d’essai ${n},`) });
  const practice = async () => {
    await vial(1).click();
    await vial(2).click();
    await expect(page.getByTestId('guide-practice-note')).toContainText('Essayez une fiole vide');
    for (const [from, to] of [
      [1, 3],
      [2, 1],
      [2, 3],
    ]) {
      await vial(from).click();
      await vial(to).click();
    }
    await expect(page.getByTestId('guide-practice-note')).toContainText('Vous avez le geste');
    await expect(page.getByRole('button', { name: /Fiole d’essai \d, complète/ })).toHaveCount(2);
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Passer le prologue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Votre pseudo', exact: true }).fill('Élise');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).ambienceStarts)).toBe(1);
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    await expect(
      page.getByText('Bienvenue dans votre carnet, Élise.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('page-folio')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).ambienceStarts)).toBe(1);
    expect((await saved()).guideSeen).toBe(false);
    const before = await saved();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/guide-welcome-390.png' });
    await practice();
    expect(await saved()).toEqual(before);
    await page
      .getByTestId('guide-practice')
      .screenshot({ path: 'test-results/guide-practice-complete.png' });
    await page.getByRole('button', { name: 'Recommencer l’essai', exact: true }).click();
    await expect(page.getByTestId('guide-practice-note')).toContainText('Touchez la fiole 1');
    expect(await saved()).toEqual(before);
    // A signed but unread carnet still offers its introduction after an interruption.
    await page.reload();
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    await page.getByRole('button', { name: 'Entrer dans la serre', exact: true }).click();
    await expect(page.getByTestId('botanical-guide')).toHaveCount(0);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect.poll(async () => (await saved()).guideSeen).toBe(true);
    await expect.poll(() => page.evaluate(() => (window as any).ambienceStarts)).toBe(1);
    expect(await saved()).toEqual({ ...before, guideSeen: true });
    // Help is the same complete page, and never resets a live puzzle or spends a seed.
    await openScreen(page, 'Aide');
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    const progress = await saved();
    await practice();
    expect(await saved()).toEqual(progress);
    await page.getByRole('button', { name: 'Revenir au début de l’aide', exact: true }).click();
    await expect
      .poll(() => page.getByTestId('guide-scroll').evaluate((node) => node.scrollTop))
      .toBe(0);
    await page.screenshot({ path: 'test-results/guide-help-390.png' });
    for (const viewport of [
      { width: 320, height: 740 },
      { width: 1280, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.getByRole('button', { name: 'Revenir au début de l’aide', exact: true }).click();
      await expect
        .poll(() => page.getByTestId('guide-scroll').evaluate((node) => node.scrollTop))
        .toBe(0);
      await page.screenshot({ path: `test-results/guide-help-${viewport.width}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width,
      );
      for (const name of [
        'Une teinte, une fiole',
        'Réveiller une planche',
        'Les trésors du jardin',
      ])
        await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Fermer l’aide', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    expect(await saved()).toEqual(progress);
    await page.reload();
    await openCarnet(page);
    await expect(page.getByTestId('botanical-guide')).toHaveCount(0);
    // Reset keeps accessibility preferences, replays the film, then opens a fresh guide.
    await openScreen(page, 'Paramètres');
    await page.getByRole('button', { name: 'Remettre ma progression à zéro', exact: true }).click();
    await page.getByRole('button', { name: 'Continuer vers la confirmation', exact: true }).click();
    await page.getByRole('button', { name: 'Oui, effacer ma progression', exact: true }).click();
    await expect(page.getByTestId('book-opening-film')).toBeVisible();
    expect((await saved()).guideSeen).toBe(false);
    await page.getByRole('button', { name: 'Passer le prologue', exact: true }).click();
    await page.getByRole('textbox', { name: 'Votre pseudo', exact: true }).fill('Camille');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    expect((await saved()).seeds).toBe(1);
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    // A previously installed release with no guide field keeps its place on upgrade.
    const { guideSeen, ...legacy } = { ...initial(), started: true, nickname: 'Dainty', seeds: 8 };
    await page.evaluate(
      (save) => localStorage.setItem('color-world.save', JSON.stringify(save)),
      legacy,
    );
    await page.reload();
    await openCarnet(page);
    await expect(page.getByTestId('botanical-guide')).toHaveCount(0);
    expect((await saved()).seeds).toBe(8);
    expect(errors).toEqual([]);
    console.log(
      'Guide passed: first signature, interrupted welcome, correct practice pours/win, no progress or seed changes, cabinet music and workshop restart, help menu/close, 320/390/1280 layouts, reset, migration.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
