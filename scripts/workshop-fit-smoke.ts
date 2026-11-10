import { mechanicIds } from '../src/engine/mechanics';
import { requestHint } from './hint-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    serviceWorkers: 'block',
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let base: ReturnType<typeof initial> = {
    ...initial(),
    started: true,
    guideSeen: true,
    seenMechanics: [...mechanicIds],
  };
  for (const l of levels) {
    base = loadLevel(base, l.id);
    for (const m of l.solution) base = move(base, m.from, m.to);
  }
  base.settings = {
    ...base.settings,
    motion: false,
    music: false,
    sound: false,
    haptics: false,
    patterns: true,
  };
  mkdirSync('test-results', { recursive: true });
  const seed = async (id: number) => {
    const s = loadLevel(base, id);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + 'atelier');
    await expect(page.getByTestId('page-folio')).toHaveText(`PAGE ${String(id).padStart(2, '0')}`);
    await expect(page.getByRole('button', { name: /^Flacon \d+,/ })).toHaveCount(s.board.length);
    return s;
  };
  const densityPage = levels.find((level) => level.board.length === 7)!.id;
  const check = async (id: number) => {
    const result = await page.evaluate(() => {
      const root = document.querySelector('[data-testid=workshop-screen]')!;
      const box = root.getBoundingClientRect();
      const controls = Array.from(root.querySelectorAll('[role=button]'))
        .filter((n) => !n.closest('[data-testid=hint-slot-probe]'))
        .map((n) => ({
          name: n.getAttribute('aria-label'),
          ...n.getBoundingClientRect().toJSON(),
        }));
      return {
        width: innerWidth,
        height: innerHeight,
        scroll: root.scrollHeight,
        client: root.clientHeight,
        doc: document.documentElement.scrollHeight,
        docWidth: document.documentElement.scrollWidth,
        controls,
        box: box.toJSON(),
      };
    });
    expect(result.scroll, `page ${id}`).toBeLessThanOrEqual(result.client + 1);
    expect(result.doc).toBeLessThanOrEqual(result.height + 1);
    expect(result.docWidth).toBeLessThanOrEqual(result.width);
    for (const b of result.controls) {
      expect(b.x, `${id} ${b.name}`).toBeGreaterThanOrEqual(-1);
      expect(b.y, `${id} ${b.name}`).toBeGreaterThanOrEqual(-1);
      expect(b.x + b.width, `${id} ${b.name}`).toBeLessThanOrEqual(result.width + 1);
      expect(b.y + b.height, `${id} ${b.name}`).toBeLessThanOrEqual(result.height + 1);
      expect(b.width, `${id} ${b.name}`).toBeGreaterThanOrEqual(43.9);
      expect(b.height, `${id} ${b.name}`).toBeGreaterThanOrEqual(43.9);
    }
    const tubes = result.controls.filter((b) => b.name?.startsWith('Flacon '));
    for (let a = 0; a < tubes.length; a++)
      for (let b = a + 1; b < tubes.length; b++) {
        const one = tubes[a],
          two = tubes[b];
        expect(
          Math.min(one.x + one.width, two.x + two.width) - Math.max(one.x, two.x) > 0.5 &&
            Math.min(one.y + one.height, two.y + two.height) - Math.max(one.y, two.y) > 0.5,
        ).toBe(false);
      }
    await expect(page.getByRole('button', { name: 'Indice', exact: true })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Revenir en haut de la page' })).toHaveCount(0);
    const actions = page.getByTestId('game-actions');
    const paper = (await actions.boundingBox())!;
    const frame = (await actions.getByTestId('botanical-foliage-frame').boundingBox())!;
    expect(frame).toEqual(paper);
    const labelTops: number[] = [];
    for (const name of ['Annuler', 'Recommencer', 'Mélanger', 'Indice']) {
      const button = actions.getByRole('button', { name, exact: true });
      if (!(await button.getByText(name, { exact: true }).count())) continue;
      const label = (await button.getByText(name, { exact: true }).boundingBox())!;
      const icon = (await button.locator('svg').first().boundingBox())!;
      const inkWidth = await button.getByText(name, { exact: true }).evaluate((node) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return range.getBoundingClientRect().width;
      });
      expect(inkWidth, `${name} must not be truncated`).toBeLessThanOrEqual(label.width + 0.5);
      labelTops.push(label.y);
      for (const part of [label, icon]) {
        expect(part.y).toBeGreaterThanOrEqual(paper.y + 11.9);
        expect(part.y + part.height).toBeLessThanOrEqual(paper.y + paper.height - 11.9);
      }
    }
    if (labelTops.length) expect(Math.max(...labelTops) - Math.min(...labelTops)).toBeLessThan(0.5);
    if (await actions.getByTestId('hint-seed-price').count()) {
      const price = (await actions.getByTestId('hint-seed-price').boundingBox())!;
      expect(price.y + price.height).toBeLessThanOrEqual(paper.y + paper.height - 11.9);
    }
  };
  try {
    await page.goto(url);
    // Every page, not just one early and one late puzzle.
    for (let id = 1; id <= 100; id++) {
      await seed(id);
      await check(id);
    }
    const representatives = [
      ...new Set(
        [...new Set(levels.map((l) => l.board.length))]
          .map((n) => levels.find((l) => l.board.length === n)!.id)
          .concat([densityPage, 32, 1000]),
      ),
    ];
    for (const [width, height] of [
      [320, 400],
      [320, 480],
      [360, 640],
      [393, 760],
      [412, 915],
      [430, 932],
      [600, 960],
      [768, 1024],
      [1024, 768],
      [1280, 900],
      [480, 280],
      [568, 320],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      for (const id of representatives) {
        await seed(id);
        await check(id);
        if (width === 412 && id === densityPage) {
          const board = (await page.getByTestId('liquid-board-idle').boundingBox())!;
          const area = (await page.getByTestId('liquid-play-area').boundingBox())!;
          expect(board.height / area.height).toBeGreaterThan(0.94);
          const first = (await page.getByRole('button', { name: /^Flacon 1,/ }).boundingBox())!;
          const fourth = (await page
            .getByRole('button', { name: new RegExp(`^Flacon ${levels[id - 1].board.length},`) })
            .boundingBox())!;
          expect(fourth.y - first.y).toBeGreaterThan(100);
          await page.screenshot({ path: 'test-results/workshop-density-two-rows-412x915.png' });
        }
      }
      await page.screenshot({ path: `test-results/workshop-fit-${width}x${height}.png` });
    }
    // The reported page: labels and seed price stay inside the same paper before
    // and after the longer "Déjà cueilli" caption replaces "1 graine".
    await page.setViewportSize({ width: 412, height: 915 });
    await seed(32);
    await check(32);
    const toolbar = page.getByTestId('game-actions');
    const toolbarBeforeHint = await toolbar.boundingBox();
    await page.screenshot({ path: 'test-results/workshop-toolbar-page32.png' });
    await requestHint(page);
    await expect(page.getByTestId('hint-seed-price')).toHaveCount(0);
    await check(32);
    expect(await toolbar.boundingBox()).toEqual(toolbarBeforeHint);
    await page.screenshot({ path: 'test-results/workshop-toolbar-page32-hint.png' });
    await page.setViewportSize({ width: 320, height: 400 });
    await seed(100);
    await check(100);
    const before = await page.evaluate(() => localStorage.getItem('color-world.save'));
    const positions = () => page.getByTestId('game-actions').boundingBox();
    const bounds = await positions();
    await requestHint(page);
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      `Versez le flacon ${levels[99].solution[0].from + 1} dans le flacon ${levels[99].solution[0].to + 1}.`,
    );
    expect(await positions()).toEqual(bounds);
    await check(100);
    const paper = (await page.getByTestId('hint-scroll').boundingBox())!,
      text = (await page.getByTestId('hint-writing-text').boundingBox())!;
    expect(text.y + text.height).toBeLessThanOrEqual(paper.y + paper.height + 1);
    await page.mouse.move(150, 200);
    await page.mouse.wheel(0, 1000);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    const paid = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    expect(paid.seeds).toBe(JSON.parse(before!).seeds - 1);
    await requestHint(page);
    expect(
      (await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!))).seeds,
    ).toBe(paid.seeds);
    expect(errors).toEqual([]);
    console.log(
      'Workshop fit passed: all 100 pages on phone, every tube count on 13 additional phone/tablet/landscape formats, tall-phone two-row representative fills the play area in two rows, all controls visible with separated 44-point touch targets, no document or game scroll, stable hint and one seed per new hint.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
