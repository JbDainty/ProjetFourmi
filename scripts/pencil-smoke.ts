import { requestHint } from './hint-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/levels.json';
import { botanicalFact } from '../src/data/botanicalFacts';
import { initial, loadLevel, move } from '../src/state/model';
import { openCarnet, openScreen } from './navigation-test-helper';

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
  const firstHint = levels[0].solution[0];
  const fullHint = `Versez le flacon ${firstHint.from + 1} dans le flacon ${firstHint.to + 1}.`;
  const note = page.getByTestId('hint-writing-text');
  try {
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect(note).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
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
    // Sample what would be painted, from the click through the final letter.
    // A search message or a fully rendered hint before typing is a regression.
    // Keep the recursive sampler as browser JavaScript, without TSX helpers.
    await page.evaluate(`
      document.querySelector('[aria-label="Indice"]').addEventListener('click', () => {
        const frames = [];
        window.hintPaintFrames = frames;
        const sample = () => {
          const node = document.querySelector('[data-testid="hint-writing-text"]');
          const text = node?.textContent || '';
          frames.push({ text, font: node ? getComputedStyle(node).fontFamily : '', rolling: !!document.querySelector('[data-testid="hint-scroll-unrolling"]'), pencil: !!document.querySelector('[data-testid="hint-pencil"]') });
          if (frames.length < 240 && !(text === ${JSON.stringify(fullHint)} && !document.querySelector('[data-testid="hint-pencil"]'))) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      }, { once: true, capture: true });
    `);
    await requestHint(page);
    await expect(page.getByTestId('hint-scroll-unrolling')).toBeVisible();
    await expect(note).toHaveText('');
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    const rolledWidth = (await page.locator('#hint-parchment-sheet').boundingBox())!.width;
    await page.waitForTimeout(180);
    expect((await page.locator('#hint-parchment-sheet').boundingBox())!.width).toBeGreaterThan(
      rolledWidth,
    );
    await expect(note).toHaveText('');
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    await page.screenshot({ path: 'test-results/hint-scroll-unrolling.png', fullPage: true });
    await expect(page.getByTestId('pencil-note-writing')).toBeVisible();
    await page.waitForTimeout(240);
    const partial = (await note.textContent())!;
    expect(partial.length).toBeGreaterThan(0);
    expect(partial.length).toBeLessThan(fullHint.length);
    expect(fullHint.startsWith(partial)).toBe(true);
    await page.screenshot({ path: 'test-results/pencil-writing.png', fullPage: true });
    await expect(note).toHaveText(fullHint);
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    const paints = await page.evaluate(
      () =>
        (
          window as unknown as {
            hintPaintFrames: { text: string; font: string; rolling: boolean; pencil: boolean }[];
          }
        ).hintPaintFrames,
    );
    expect(paints.length).toBeGreaterThan(5);
    expect(paints[0].text).not.toBe(fullHint);
    expect(paints.some((paint) => paint.rolling)).toBe(true);
    expect(
      paints.filter((paint) => paint.rolling).every((paint) => paint.text === '' && !paint.pencil),
    ).toBe(true);
    expect(paints.every((paint) => fullHint.startsWith(paint.text))).toBe(true);
    expect(
      paints.every((paint) => !paint.text || paint.font.includes('HerbariumHandwriting')),
    ).toBe(true);
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
    // Asking again rewinds the paper; a tube touch cancels either phase.
    await requestHint(page);
    await expect(page.getByTestId('hint-scroll-unrolling')).toBeVisible();
    await expect(note).toHaveText('');
    await page.getByRole('button', { name: /^Flacon 2,/ }).click();
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
    await page.getByRole('button', { name: /^Flacon 2,/ }).click();
    await requestHint(page);
    await expect(page.getByTestId('hint-pencil')).toBeVisible();
    await page.getByRole('button', { name: /^Flacon 2,/ }).click();
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
    await page.waitForTimeout(180);
    await expect(note).toHaveCount(0);
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Animations douces' }).click();
    await openScreen(page, 'L’Atelier');
    await requestHint(page);
    await expect(note).toHaveText(fullHint);
    await expect(page.getByTestId('hint-scroll-open')).toBeVisible();
    await expect(page.getByTestId('hint-scroll-unrolling')).toHaveCount(0);
    await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
    for (const m of levels[0].solution) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
    }
    await expect(page.getByTestId('page-result-moves')).toHaveText(
      `${levels[0].solution.length} mouvements`,
    );
    await page.screenshot({ path: 'test-results/page-result-movements.png', fullPage: true });
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    await expect(page.getByTestId('victory-living-paper')).toBeVisible();
    await expect(page.getByTestId('restoration-botanical-fact')).toHaveText(
      botanicalFact(1, 'reveal'),
    );
    await page.screenshot({ path: 'test-results/restoration-botanical-fact.png', fullPage: true });
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(note).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
    await expect(page.getByTestId('page-result-moves')).toHaveCount(0);
    await expect(page.getByText(/\b\d+ mouvements?\b/)).toHaveCount(0);
    // A new species gets its own annotations, in play and after the reveal.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 02');
    await expect(page.getByText(/\b\d+ mouvements?\b/)).toHaveCount(0);
    let nextPlant = { ...initial(), started: true };
    nextPlant.settings.motion = false;
    for (const level of levels.slice(0, 5)) {
      nextPlant = loadLevel(nextPlant, level.id);
      for (const m of level.solution) nextPlant = move(nextPlant, m.from, m.to);
    }
    nextPlant = loadLevel(nextPlant, 6);
    await page.evaluate(
      (save) => localStorage.setItem('color-world.save', JSON.stringify(save)),
      nextPlant,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('current-botanical-stamp')).toHaveAccessibleName(
      'Ouvrir la planche de Bleuet, 0 couleurs sur 4 restaurées',
    );
    await expect(note).toHaveCount(0);
    await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
    expect(botanicalFact(6)).not.toBe(botanicalFact(1));
    for (const m of levels[5].solution) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
    }
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    await expect(page.getByTestId('restoration-botanical-fact')).toHaveText(
      botanicalFact(6, 'reveal'),
    );
    expect(errors).toEqual([]);
    console.log(
      'Parchment: invisible before hint, animated unrolling before writing, no flash, repeated requests, cancellation in both phases, reduced motion and botanical facts only after restoration passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
