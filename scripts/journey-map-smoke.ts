import { chromium, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';

function carnet(done: number, current = done + 1, motion = false) {
  let s = { ...initial(), started: true, guideSeen: true, nickname: 'Camille' };
  for (const level of levels.slice(0, done)) {
    s = loadLevel(s, level.id);
    for (const step of level.solution) s = move(s, step.from, step.to);
  }
  s = loadLevel(s, Math.min(100, current));
  s.settings = { ...s.settings, motion, sound: false, music: false, haptics: false };
  return s;
}
async function main() {
  mkdirSync('test-results', { recursive: true });
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  const seed = async (s: Save) => {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + 'carte');
    await expect(page.getByTestId('journey-frame')).toBeVisible();
  };
  const scroll = page.getByTestId('ecosystem-map-scroll');
  const root = page.getByTestId('ecosystems-screen');
  const bounds = async () => {
    const frame = (await page.getByTestId('journey-frame').boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.y + frame.height).toBeLessThanOrEqual(viewport.height);
    expect(frame.height).toBeGreaterThan(80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport.width,
    );
    expect(await root.evaluate((n) => n.scrollHeight)).toBeLessThanOrEqual(
      await root.evaluate((n) => n.clientHeight),
    );
    await expect(
      page.getByRole('button', { name: 'Revenir à ma page sur le chemin' }),
    ).toBeInViewport();
  };
  try {
    const save = carnet(23);
    await seed(save);
    await expect(page.getByTestId('journey-page-24')).toBeInViewport();
    await expect(page.getByTestId('journey-page-25')).toHaveCount(0);
    expect(await page.getByTestId('journey-page-1').count()).toBe(1);
    await expect(page.getByTestId('journey-stars-23')).toHaveAccessibleName(
      `${save.completed[23].stars} étoiles sur 3`,
    );
    for (const [width, height] of [
      [320, 480],
      [360, 640],
      [393, 852],
      [600, 960],
      [768, 1024],
      [1024, 768],
      [568, 280],
      [1280, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await expect
        .poll(async () => {
          const r = await root.boundingBox();
          return Math.round(r!.height);
        })
        .toBe(height);
      await bounds();
      await page.screenshot({ path: `test-results/journey-${width}x${height}.png` });
    }
    await page.setViewportSize({ width: 393, height: 852 });
    const y = (await page.getByTestId('journey-frame').boundingBox())!.y;
    await scroll.evaluate((n) => (n.scrollTop = n.scrollHeight));
    await expect(page.getByTestId('journey-page-1')).toBeInViewport();
    expect((await page.getByTestId('journey-frame').boundingBox())!.y).toBe(y);
    await expect(page.getByTestId('journey-biome-title')).toHaveText('Les prairies fleuries');
    await page.mouse.move(200, 600);
    await page.mouse.wheel(0, 3000);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(await state()).toEqual(save);
    await page.getByRole('button', { name: 'Page 1', exact: true }).click();
    await expect(page.getByTestId('journey-page-dialog')).toBeVisible();
    await page.screenshot({ path: 'test-results/journey-replay-dialog.png' });
    expect(await state()).toEqual(save);
    await page.getByRole('button', { name: 'Fermer la fiche', exact: true }).click();
    await expect(page.getByTestId('journey-page-dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Page 1', exact: true }).click();
    await page.getByRole('button', { name: 'Rejouer cette page', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    const replay = await state();
    expect(replay.current).toBe(1);
    expect(replay.moves).toBe(0);
    expect(replay.board).toEqual(levels[0].board);
    expect(replay.completed).toEqual(save.completed);
    expect(replay.seeds).toBe(save.seeds);
    expect(replay.pigments).toEqual(save.pigments);
    // Replaying an early page does not hide already explored landscapes.
    await page.goto(url + 'carte');
    await expect(page.getByTestId('journey-page-24')).toHaveCount(1);
    await expect(page.getByTestId('journey-page-25')).toHaveCount(0);
    const progress = move(carnet(23), levels[23].solution[0].from, levels[23].solution[0].to);
    await seed(progress);
    await page.getByRole('button', { name: 'Page 24', exact: true }).click();
    await page.getByRole('button', { name: 'Continuer cette page', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 24');
    expect(await state()).toEqual(progress);
    for (const done of [0, 43, 63, 83, 100]) {
      const s = carnet(done);
      await seed(s);
      await bounds();
      await expect(page.getByTestId(`journey-page-${Math.min(100, done + 1)}`)).toBeInViewport();
      await expect(page.getByTestId('journey-biome-title')).toHaveText(
        [
          'Les prairies fleuries',
          'Le sous-bois',
          'Les zones humides',
          'Les montagnes alpines',
          'La flore méditerranéenne',
        ][Math.floor((Math.min(100, done + 1) - 1) / 20)],
      );
      expect(await state()).toEqual(s);
      await page.screenshot({ path: `test-results/journey-frontier-${done}.png` });
    }
    await seed(carnet(23, 24, true));
    await expect(page.getByTestId('journey-life-animating')).toBeVisible();
    await expect(page.getByTestId('journey-life-animating')).toHaveCount(0, { timeout: 5000 });
    await page.evaluate(() => {
      (window as any).mapSvgChanges = 0;
      new MutationObserver((rs) => {
        for (const r of rs) if (r.target instanceof SVGElement) (window as any).mapSvgChanges++;
      }).observe(document.querySelector('[data-testid="ecosystem-map-scroll"]')!, {
        subtree: true,
        attributes: true,
      });
    });
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as any).mapSvgChanges)).toBe(0);
    expect(errors).toEqual([]);
    console.log(
      'Journey map passed: eight viewport sizes, five terrains, framed internal scrolling, explored frontier only, stars, cancel and replay, resumed attempt unchanged, full book, finite animation and stable SVG.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
