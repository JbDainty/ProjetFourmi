import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';

function lastPour(replay = false): Save {
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, replay ? 5 : 4)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = loadLevel(save, 5);
  for (const m of levels[4].solution.slice(0, -1)) save = move(save, m.from, m.to);
  return save;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  await page.addInitScript({
    content: `
    window.botanicalCues = [];
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) {
      if ([2.8, 5.6].some(n => Math.abs((this.buffer?.duration || 0) - n) < .01)) window.botanicalCues.push(this.buffer?.duration);
      return start.apply(this, args);
    };
  `,
  });
  const cues = () =>
    page.evaluate(() => (window as unknown as { botanicalCues: number[] }).botanicalCues);
  const seed = async (motion: boolean, sound: boolean, replay = false) => {
    const save = lastPour(replay);
    save.settings = { ...save.settings, motion, sound, music: false, haptics: false };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 05');
  };
  const finish = async () => {
    const last = levels[4].solution.at(-1)!;
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.to + 1},`) }).click();
    await expect(page.getByTestId('victory-living-paper')).toBeVisible();
  };
  try {
    await page.goto(url);
    await seed(true, true);
    await finish();
    await expect.poll(async () => (await cues()).length).toBe(1);
    expect(await cues()).toEqual([2.8]);
    await page.getByRole('button', { name: 'Révéler la couleur' }).click();
    await expect.poll(async () => (await cues()).length).toBe(2);
    expect((await cues()).sort()).toEqual([2.8, 5.6]);
    await expect(page.getByTestId('victory-action-primary')).toBeVisible();
    expect(
      await page
        .getByRole('button', { name: 'Poursuivre la restauration' })
        .getByText('Poursuivre la restauration')
        .evaluate((n) => getComputedStyle(n).fontFamily),
    ).toContain('HerbariumDisplay');
    await page.screenshot({ path: 'test-results/botanical-victory-actions.png', fullPage: true });
    expect((await cues()).length).toBe(2);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(page.getByTestId('book-page-turn')).toBeVisible();
    await expect(page.getByTestId('book-page-turn')).toHaveAttribute(
      'aria-label',
      'Ouverture de la page 6',
    );
    const curl = page.getByTestId('book-page-curl').first();
    await expect(curl).toHaveAttribute('opacity', '1');
    const shape = await curl.getAttribute('d');
    await expect.poll(() => curl.getAttribute('d')).not.toBe(shape);
    await page.screenshot({ path: 'test-results/old-book-page-turn.png', fullPage: true });
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 06');
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    expect(after.current).toBe(6);
    expect(after.moves).toBe(0);
    expect(after.completed).toEqual(before.completed);
    expect(after.seeds).toBe(before.seeds);
    expect(after.board).toEqual(levels[5].board);
    // A page selected from the exploration book uses the same transition coordinator.
    await page.getByRole('button', { name: 'Ouvrir le carnet' }).click();
    await page.getByRole('link', { name: 'Écosystèmes' }).click();
    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await expect(page.getByTestId('book-page-turn')).toBeVisible();
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 02');
    await seed(true, false);
    await finish();
    await expect(page.getByTestId('victory-vines-settled')).toBeAttached();
    expect(await cues()).toEqual([]);
    await seed(false, true, true);
    await finish();
    await expect.poll(async () => (await cues()).length).toBe(1);
    expect(await cues()).toEqual([2.8]); // Replaying a completed plant does not repeat its fanfare.
    await page.setViewportSize({ width: 320, height: 740 });
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    const button = page.getByRole('button', { name: 'Poursuivre la restauration' });
    const box = (await button.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(320);
    expect(box.height).toBeGreaterThanOrEqual(56);
    await page.screenshot({ path: 'test-results/botanical-actions-narrow.png', fullPage: true });
    await button.click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 06');
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    // The first opening also turns a page; a normal save reload does not.
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      initial(),
    );
    await page.goto(url);
    await page.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(page.getByTestId('book-page-turn')).toBeVisible();
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    await page.reload();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log(
      'Book immersion passed: original 5.6s melody once at first full restoration, mute/replay respected; engraved actions fit 320px; curling page covers HUD, loads exactly one page without extra rewards, map and opening transitions, reduced motion and reload.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
