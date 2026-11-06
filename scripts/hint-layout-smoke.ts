import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  // tsx preserves names of the functions injected below into the browser.
  await page.addInitScript({ content: 'window.__name = (value) => value;' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8110/';
  const geometry = () =>
    page.evaluate(() => {
      const bounds = (id: string) =>
        document.querySelector(`[data-testid="${id}"]`)!.getBoundingClientRect();
      const slot = bounds('hint-scroll-slot');
      const actions = bounds('game-actions');
      const backdrop = bounds('greenhouse-world-background');
      return {
        slot: slot.height,
        actions:
          actions.top +
          (document.querySelector('[data-testid="book-page-scroll"]')?.scrollTop || 0),
        backdrop: backdrop.height,
      };
    });
  try {
    mkdirSync('test-results', { recursive: true });
    await page.goto(url);
    for (const scenario of [
      { width: 393, height: 851, level: 7, seeds: 1, motion: true },
      { width: 320, height: 740, level: 7, seeds: 0, motion: true },
      { width: 393, height: 980, level: 100, seeds: 0, motion: false },
    ]) {
      const { width, height, level, seeds, motion } = scenario;
      await page.setViewportSize({ width, height });
      let save = { ...initial(), started: true };
      for (const prior of levels.slice(0, level - 1)) {
        save = loadLevel(save, prior.id);
        for (const step of prior.solution) save = move(save, step.from, step.to);
      }
      save = loadLevel(save, level);
      save.seeds = seeds;
      save.settings = { ...save.settings, music: false, sound: false, haptics: false, motion };
      await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
      await page.goto(url);
      await openCarnet(page);
      await expect(page.getByTestId('page-folio')).toHaveText(
        `PAGE ${String(level).padStart(2, '0')}`,
      );
      await page.getByTestId('game-actions').scrollIntoViewIfNeeded();
      await page.waitForTimeout(150);
      const before = await geometry();
      expect(before.slot).toBeGreaterThanOrEqual(78);
      expect(before.backdrop).toBeGreaterThanOrEqual(height);
      await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
      // Capture actual painted positions through pending search, unrolling and every letter.
      await page.evaluate(() => {
        (window as any).hintLayoutSamples = [];
        (window as any).hintSVGChanges = 0;
        new MutationObserver((records) => {
          for (const record of records) {
            const node = record.target;
            if (node instanceof SVGElement && node.closest('[data-testid="hint-scroll"]'))
              (window as any).hintSVGChanges++;
          }
        }).observe(document, { subtree: true, attributes: true });
        document.querySelector('[aria-label="Indice"]')!.addEventListener(
          'click',
          () => {
            const sample = () => {
              const actions = document
                .querySelector('[data-testid="game-actions"]')!
                .getBoundingClientRect();
              const backdrop = document
                .querySelector('[data-testid="greenhouse-world-background"]')!
                .getBoundingClientRect();
              (window as any).hintLayoutSamples.push({
                actions:
                  actions.top +
                  (document.querySelector('[data-testid="book-page-scroll"]')?.scrollTop || 0),
                backdrop: backdrop.height,
              });
              if ((window as any).hintLayoutSamples.length < 330) requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          },
          { once: true, capture: true },
        );
      });
      await page.getByRole('button', { name: 'Indice', exact: true }).click();
      const expected = seeds
        ? `Versez le flacon ${levels[level - 1].solution[0].from + 1} dans le flacon ${levels[level - 1].solution[0].to + 1}.`
        : 'Votre réserve est vide. Obtenez trois étoiles sur une page pour gagner une graine.';
      await expect(page.getByTestId('hint-writing-text')).toHaveText(expected, { timeout: 10000 });
      await expect(page.getByTestId('hint-pencil')).toHaveCount(0);
      expect(await geometry()).toEqual(before);
      await expect
        .poll(() => page.evaluate(() => (window as any).hintLayoutSamples.length))
        .toBeGreaterThan(0);
      const samples = await page.evaluate(
        () => (window as any).hintLayoutSamples as { actions: number; backdrop: number }[],
      );
      expect(samples.length).toBeGreaterThan(0);
      for (const sample of samples) {
        expect(sample.actions).toBeCloseTo(before.actions, 1);
        expect(sample.backdrop).toBeCloseTo(before.backdrop, 1);
      }
      expect(await page.evaluate(() => (window as any).hintSVGChanges)).toBe(0);
      const paper = (await page.getByTestId('hint-scroll').boundingBox())!;
      const text = (await page.getByTestId('hint-writing-text').boundingBox())!;
      expect(text.y).toBeGreaterThanOrEqual(paper.y);
      expect(text.y + text.height).toBeLessThanOrEqual(paper.y + paper.height);
      await page.screenshot({ path: `test-results/hint-stable-${width}-${level}.png` });
      await page.getByRole('button', { name: 'Indice', exact: true }).click();
      expect(await geometry()).toEqual(before);
      await page.getByRole('button', { name: /^Flacon 1,/ }).click();
      await expect(page.getByTestId('hint-scroll')).toHaveCount(0);
      expect(await geometry()).toEqual(before);
    }
    expect(errors).toEqual([]);
    console.log(
      'Hint layout passed: no movement of actions/backdrop during search, native-style unrolling, typing, repeat or dismissal; long empty-seed text fits at 320/393px, two tube rows and reduced motion. No SVG updates during unrolling.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
