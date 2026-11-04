import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/levels.json';
import { openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  mkdirSync('test-results', { recursive: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const fullHint = 'Versez le flacon 2 dans le flacon 1.';
  const note = page.getByTestId('hint-writing-text');
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect(page.getByText(/\b\d+ mouvements?\b/)).toHaveCount(0);
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const name of ['Annuler', 'Recommencer', 'Indice']) {
        const button = page.getByRole('button', { name, exact: true });
        const text = button.getByText(name, { exact: true });
        expect(await text.evaluate((node) => getComputedStyle(node).fontFamily)).toContain(
          'HerbariumHandwritingMedium',
        );
        const label = (await text.boundingBox())!,
          control = (await button.boundingBox())!;
        expect(label.x).toBeGreaterThanOrEqual(control.x);
        expect(label.x + label.width).toBeLessThanOrEqual(control.x + control.width + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    await page.evaluate(() => {
      const samples: { text: string; x: number; y: number }[] = [];
      (window as unknown as { pencilSamples: typeof samples }).pencilSamples = samples;
      new MutationObserver(() => {
        const pen = document.querySelector('[data-testid="hint-pencil"]');
        const text = document.querySelector('[data-testid="hint-writing-text"]')?.textContent;
        if (pen && text) {
          const box = pen.getBoundingClientRect();
          samples.push({ text, x: box.x, y: box.y });
        }
      }).observe(document.querySelector('[data-testid="integrated-game-scene"]')!, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
      });
    });
    await page.getByRole('button', { name: 'Indice', exact: true }).click();
    await expect(page.getByTestId('pencil-note-writing')).toBeVisible();
    await page.waitForTimeout(240);
    const partial = (await note.textContent())!;
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(fullHint.length);
    expect(fullHint.startsWith(partial)).toBe(true);
    await page.screenshot({ path: 'test-results/pencil-writing.png', fullPage: true });
    await expect(note).toHaveText(fullHint);
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    const samples = await page.evaluate(
      () =>
        (window as unknown as { pencilSamples: { text: string; x: number; y: number }[] })
          .pencilSamples,
    );
    const writingSamples = samples.filter((sample) => fullHint.startsWith(sample.text));
    expect(new Set(writingSamples.map((sample) => sample.text)).size).toBeGreaterThan(5);
    expect(
      Math.max(...writingSamples.map((sample) => sample.x)) -
        Math.min(...writingSamples.map((sample) => sample.x)),
    ).toBeGreaterThan(40);
    await page.screenshot({ path: 'test-results/pencil-note-complete.png', fullPage: true });
    // Asking again replays the writing; touching a tube cancels it immediately.
    await page.getByRole('button', { name: 'Indice', exact: true }).click();
    await expect(page.getByTestId('hint-pencil')).toBeVisible();
    await page.getByRole('button', { name: /^Flacon 2,/ }).click();
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    await page.waitForTimeout(180);
    await expect(note).toHaveText('Touchez un flacon, puis un autre pour verser.');
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Animations douces' }).click();
    await openScreen(page, 'L’Atelier');
    await page.getByRole('button', { name: 'Indice', exact: true }).click();
    await expect(note).toHaveText(fullHint);
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    for (const m of levels[0].solution) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
    }
    await expect(page.getByTestId('page-result-moves')).toHaveText(
      `Page achevée en ${levels[0].solution.length} mouvements.`,
    );
    await page.screenshot({ path: 'test-results/page-result-movements.png', fullPage: true });
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(page.getByTestId('page-result-moves')).toHaveCount(0);
    await expect(page.getByText(/\b\d+ mouvements?\b/)).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 02');
    await expect(page.getByText(/\b\d+ mouvements?\b/)).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log(
      'Pencil: progressive handwritten hint, moving pencil, repeated request, cancellation, reduced motion, command typography, styled folio and moves only after victory passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
