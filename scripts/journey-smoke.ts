import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet, openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8104/ProjetFourmi/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    (window as any).musicStarts = 0;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: any[]) {
      if (this.loop) (window as any).musicStarts++;
      return (start as any).apply(this, args);
    };
  });
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  const tube = (i: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${i + 1},`) });
  const transfer = async (from: number, to: number) => {
    await tube(from).click();
    await tube(to).click();
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await expect(page.getByTestId('book-opening-film')).toBeVisible();
    await expect(page.getByTestId('opening-film-art')).toBeVisible();
    await page.waitForTimeout(1900);
    await page.screenshot({ path: 'test-results/book-prologue-in-flight.png' });
    await expect(page.getByTestId('book-signature-page')).toBeVisible({ timeout: 24000 });
    expect(await page.evaluate(() => (window as any).musicStarts)).toBe(0);
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Choisissez un pseudo');
    await page
      .getByRole('textbox', { name: 'Votre pseudo', exact: true })
      .fill('  Élise des bois ');
    await page.screenshot({ path: 'test-results/book-signature-mobile.png' });
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByTestId('book-signature-page')).toHaveCount(0);
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect.poll(() => page.evaluate(() => (window as any).musicStarts)).toBe(1);
    expect((await stored()).moves).toBe(0);
    expect((await stored()).nickname).toBe('Élise des bois');
    expect((await stored()).seeds).toBe(1);
    // Ten-second seed animation is decorative: it never changes the balance.
    await page.evaluate(() => {
      (window as any).pouchFrames = [];
      const node = document.querySelector('[data-testid="seed-pouch-art"]')!;
      new MutationObserver(() => {
        (window as any).pouchFrames.push((node as HTMLElement).style.transform);
      }).observe(node, { attributes: true, attributeFilter: ['style'] });
    });
    await expect
      .poll(() => page.evaluate(() => (window as any).pouchFrames.length), { timeout: 12500 })
      .toBeGreaterThan(2);
    expect((await stored()).seeds).toBe(1);
    await page.getByRole('button', { name: /^Graines dorées/ }).click();
    await expect(page.getByTestId('seed-explanation')).toContainText(
      'Un nouvel indice coûte une graine',
    );
    await page.getByRole('button', { name: 'Retourner à mon herbier' }).click();
    await openScreen(page, 'Paramètres');
    await expect(page.getByText('Le carnet de Élise des bois', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Créer une copie de sauvegarde' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('textbox', { name: 'Contenu de la sauvegarde' })).toHaveCount(0);
    const beforeConnection = await stored();
    for (const provider of ['Google', 'Apple']) {
      await page.getByRole('button', { name: `Connexion ${provider}, bientôt disponible` }).click();
      await expect(page.getByTestId('account-connection-status')).toContainText(
        `La connexion ${provider} n’est pas encore activée`,
      );
    }
    expect(await stored()).toEqual(beforeConnection);
    await page.getByRole('textbox', { name: 'Votre pseudo', exact: true }).fill('Camille');
    await page.getByRole('button', { name: 'Modifier ma signature' }).click();
    await expect(page.getByText('Le carnet de Camille', { exact: true })).toBeVisible();
    for (const name of ['Animations douces', 'Sons de l’atelier', 'Musique du livre'])
      await page.getByRole('switch', { name, exact: true }).click();
    await openScreen(page, 'L’Atelier');
    const hint = page.getByRole('button', { name: 'Indice', exact: true });
    await hint.dblclick();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 1 dans le flacon 3.',
    );
    await expect.poll(async () => (await stored()).seeds).toBe(0);
    await hint.click();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 1 dans le flacon 3.',
    );
    expect((await stored()).seeds).toBe(0);
    await page.reload();
    await expect(page.getByTestId('book-signature-page')).toContainText('L’herbier de Camille');
    await expect(page.getByTestId('book-opening-film')).toHaveCount(0);
    await openCarnet(page);
    await hint.click();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 1 dans le flacon 3.',
    );
    expect((await stored()).seeds).toBe(0);
    await transfer(0, 2);
    await hint.click();
    await expect(page.getByTestId('hint-writing-text')).toContainText('Votre réserve est vide');
    expect((await stored()).seeds).toBe(0);
    expect(Object.keys((await stored()).paidHints)).toHaveLength(1);
    await page.getByRole('button', { name: 'Annuler', exact: true }).click();
    await hint.click();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 1 dans le flacon 3.',
    );
    expect((await stored()).seeds).toBe(0);
    for (const m of levels[0].solution) await transfer(m.from, m.to);
    await expect(page.getByTestId('page-seed-reward')).toContainText(
      'une graine a rejoint votre réserve',
    );
    expect((await stored()).seeds).toBe(1);
    await page.getByRole('button', { name: 'Rejouer la page' }).click();
    await hint.click();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 1 dans le flacon 3.',
    );
    expect((await stored()).seeds).toBe(1); // The same purchased advice remains free on replay.
    await transfer(0, 2);
    await hint.click();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 2 dans le flacon 3.',
    );
    expect((await stored()).seeds).toBe(0);
    expect(Object.keys((await stored()).paidHints)).toHaveLength(2);
    // Zeroing the game returns to signature and one seed; preferences are retained.
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Animations douces' }).click();
    await page.getByRole('button', { name: 'Remettre ma progression à zéro' }).click();
    await page.getByRole('button', { name: 'Continuer vers la confirmation' }).click();
    await page.getByRole('button', { name: 'Oui, effacer ma progression' }).click();
    await expect(page.getByTestId('book-opening-film')).toBeVisible();
    const reset = await stored();
    expect(reset.started).toBe(false);
    expect(reset.nickname).toBe('');
    expect(reset.seeds).toBe(1);
    expect(reset.paidHints).toEqual({});
    expect(reset.completed).toEqual({});
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await page.setViewportSize({ width: 320, height: 740 });
    await expect(page.getByRole('textbox', { name: 'Votre pseudo' })).toHaveValue('');
    await page.screenshot({ path: 'test-results/book-signature-320.png', fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    expect(errors).toEqual([]);
    console.log(
      'Journey passed: opening film/signature, real entry music before any move, 10s seed animation, one starting seed, idempotent paid hints across double taps/reload/undo/replay, no balance underflow, personalized settings, honest Apple/Google buttons, no manual export, reset restarts film, 320px layout.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
