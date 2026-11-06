import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet } from './navigation-test-helper';

function beforeWin(id: number, motion: boolean, sound: boolean) {
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, id - 1)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = loadLevel(save, id);
  for (const m of levels[id - 1].solution.slice(0, -1)) save = move(save, m.from, m.to);
  save.settings = { ...save.settings, motion, sound, music: false, haptics: false };
  return save;
}
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8110/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  await page.addInitScript({
    content: `
    window.sealSounds = [];
    window.stampGeometryChanges = 0;
    new MutationObserver(records => {
      for (const r of records) if (r.target instanceof SVGElement && r.target.closest('[data-testid="ancient-stamp-animation"]')) window.stampGeometryChanges++;
    }).observe(document, { subtree: true, attributes: true });
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) {
      if (Math.abs((this.buffer?.duration || 0) - .42) < .005) window.sealSounds.push(performance.now());
      return start.apply(this, args);
    };
  `,
  });
  const result = page.getByTestId('victory-living-paper');
  const seed = async (id: number, motion = true, sound = true) => {
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      beforeWin(id, motion, sound),
    );
    await page.goto(url);
    await openCarnet(page);
    const last = levels[id - 1].solution.at(-1)!;
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.to + 1},`) }).click();
    await expect(result).toBeVisible();
  };
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  const sounds = () => page.evaluate(() => (window as any).sealSounds.length);
  try {
    await page.goto(url);
    await openCarnet(page);
    await seed(4);
    await expect(result.getByText('Les couleurs retrouvées', { exact: true })).toBeVisible();
    await result.getByRole('button', { name: 'Révéler la couleur', exact: true }).click();
    const target = result.getByTestId('watercolor-target');
    await expect(target.locator('image')).not.toHaveAttribute('filter');
    await expect(result.getByTestId('botanical-restoration-seal')).toHaveCount(0);
    await expect.poll(() => target.evaluate((n) => Number(getComputedStyle(n).opacity))).toBe(1);
    await result.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 05');
    await page.getByTestId('current-botanical-stamp').click();
    await expect(page.getByTestId('plant-restoration-progress')).toHaveText(
      '4 / 4 couleurs · À estampiller',
    );
    await page.getByRole('button', { name: 'Revenir au jeu' }).click();
    await seed(5);
    await expect(result.locator('image')).not.toHaveAttribute('filter');
    await expect(result.getByTestId('botanical-restoration-seal')).toHaveCount(0);
    const earned = await state();
    const began = await page.evaluate(() => performance.now());
    await result.getByRole('button', { name: 'Estampiller la planche', exact: true }).click();
    const next = result.getByRole('button', { name: 'Découvrir l’espèce suivante', exact: true });
    await expect(next).toBeDisabled();
    const tool = result.getByTestId('carved-wood-stamp');
    const first = await tool.evaluate((n) => getComputedStyle(n).transform);
    await expect.poll(() => tool.evaluate((n) => getComputedStyle(n).transform)).not.toBe(first);
    await expect
      .poll(() =>
        result
          .getByTestId('seal-ink-impression')
          .evaluate((n) => Number(getComputedStyle(n).opacity)),
      )
      .toBeGreaterThan(0.8);
    await page.screenshot({ path: 'test-results/botanical-stamp-press.png' });
    await expect.poll(sounds).toBe(1);
    const at = await page.evaluate(() => (window as any).sealSounds[0]);
    expect(at - began).toBeGreaterThan(500);
    await expect(next).toBeEnabled();
    await expect(result.getByTestId('ancient-stamp-animation')).toHaveCount(0);
    await expect(result.getByTestId('botanical-restoration-seal')).toHaveCount(1);
    await page.screenshot({ path: 'test-results/botanical-seal-finished.png' });
    expect((await state()).seeds).toBe(earned.seeds);
    expect((await state()).completed).toEqual(earned.completed);
    expect(await page.evaluate(() => (window as any).stampGeometryChanges)).toBe(0);
    await next.click();
    await expect(page.getByTestId('book-species-riffle')).toBeVisible();
    await expect(page.getByTestId('book-destination-species')).toHaveText('Bleuet');
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 06');
    await page.reload();
    await openCarnet(page);
    expect((await state()).completed).toEqual(earned.completed);
    await page.setViewportSize({ width: 320, height: 740 });
    await seed(5, false, false);
    await result.getByRole('button', { name: 'Estampiller la planche', exact: true }).click();
    await expect(result.getByRole('button', { name: 'Découvrir l’espèce suivante' })).toBeEnabled();
    await expect(result.getByTestId('botanical-restoration-seal')).toHaveCount(1);
    await expect(result.getByTestId('ancient-stamp-animation')).toHaveCount(0);
    expect(await sounds()).toBe(0);
    await seed(5, true, false);
    await result.getByRole('button', { name: 'Passer l’animation' }).click();
    await expect(result.getByRole('button', { name: 'Découvrir l’espèce suivante' })).toBeEnabled();
    await expect(result.getByTestId('botanical-restoration-seal')).toHaveCount(1);
    expect(await sounds()).toBe(0);
    expect(errors).toEqual([]);
    console.log(
      'Restoration passed: original full watercolor on page 4; page 5 carved stamp, synchronized soft cue, immutable SVG, completion gate, new species, reload keeps rewards, 320px, mute, skip and reduced motion.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
