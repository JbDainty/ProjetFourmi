import { chromium, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { firstPageAttempt } from './test-fixtures';
import { openCarnet } from './navigation-test-helper';

const url = process.env.GAME_TEST_URL || 'http://localhost:8106/';

async function observeBoard(page: Page) {
  await page.evaluate(() => {
    const state = window as unknown as { staticChanges: number; boardObserver?: MutationObserver };
    state.boardObserver?.disconnect();
    state.staticChanges = 0;
    state.boardObserver = new MutationObserver((records) => {
      state.staticChanges += records.length;
    });
    state.boardObserver.observe(document.querySelector('#liquid-scene')!, {
      subtree: true,
      attributes: true,
      childList: true,
    });
  });
}

async function unchanged(page: Page, ms: number) {
  await page.waitForTimeout(ms);
  expect(
    await page.evaluate(() => (window as unknown as { staticChanges: number }).staticChanges),
  ).toBe(0);
}

async function buttonFits(page: Page, testID: string) {
  const button = page.getByTestId(testID).first();
  await button.scrollIntoViewIfNeeded();
  const bounds = await button.boundingBox();
  const art = await button.locator('svg').first().boundingBox();
  const text = await button
    .getByText(/Révéler la couleur|Rejouer la page|Poursuivre la restauration|Ouvrir l’herbier/)
    .last()
    .boundingBox();
  expect(bounds).toBeTruthy();
  expect(art).toBeTruthy();
  expect(text).toBeTruthy();
  expect(Math.abs(art!.height - bounds!.height)).toBeLessThan(2);
  expect(Math.abs(art!.width - bounds!.width)).toBeLessThan(2);
  expect(text!.y).toBeGreaterThanOrEqual(bounds!.y);
  expect(text!.y + text!.height).toBeLessThanOrEqual(bounds!.y + bounds!.height + 1);
  expect(text!.x).toBeGreaterThanOrEqual(bounds!.x);
  expect(text!.x + text!.width).toBeLessThanOrEqual(bounds!.x + bounds!.width + 1);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 360, height: 780 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  try {
    const save = { ...initial(), started: true, nickname: 'Camille' };
    save.settings.sound = false;
    save.settings.music = false;
    await page.addInitScript((save) => {
      if (!localStorage.getItem('color-world.save'))
        localStorage.setItem('color-world.save', JSON.stringify(save));
    }, save);
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    await observeBoard(page);
    await unchanged(page, 1200);
    const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
    const first = levels[0].solution[0];
    await tube(first.from).click();
    await tube(first.to).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await page.waitForTimeout(100);
    await observeBoard(page);
    await unchanged(page, 240);
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();

    for (const viewport of [
      { width: 320, height: 640 },
      { width: 393, height: 851 },
    ]) {
      await page.setViewportSize(viewport);
      const fixture = firstPageAttempt(0);
      fixture.save.settings.motion = false;
      fixture.save.settings.sound = false;
      fixture.save.settings.music = false;
      fixture.save.nickname = 'Camille';
      await page.evaluate(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        fixture.save,
      );
      await page.goto(url);
      await openCarnet(page);
      for (const label of ['Annuler', 'Recommencer', 'Indice']) {
        const control = page.getByRole('button', { name: label, exact: true });
        await control.scrollIntoViewIfNeeded();
        const outer = await control.boundingBox();
        const text = await control.getByText(label, { exact: true }).boundingBox();
        expect(text!.x).toBeGreaterThanOrEqual(outer!.x);
        expect(text!.x + text!.width).toBeLessThanOrEqual(outer!.x + outer!.width + 1);
      }
      await tube(fixture.last.from).click();
      await tube(fixture.last.to).click();
      await buttonFits(page, 'victory-action-primary');
      await buttonFits(page, 'victory-action-secondary');
      await page.screenshot({
        path: `test-results/mobile-reward-${viewport.width}.png`,
        fullPage: true,
      });
      await page.getByRole('button', { name: 'Révéler la couleur', exact: true }).click();
      await buttonFits(page, 'victory-action-primary');
      await buttonFits(page, 'victory-action-secondary');
      await page.screenshot({
        path: `test-results/mobile-reveal-${viewport.width}.png`,
        fullPage: true,
      });
    }

    let hard = { ...initial(), started: true, nickname: 'Camille' };
    for (const level of levels.slice(0, 99)) {
      hard = loadLevel(hard, level.id);
      for (const m of level.solution) hard = move(hard, m.from, m.to);
    }
    hard = loadLevel(hard, 100);
    hard.settings.sound = false;
    hard.settings.music = false;
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), hard);
    await page.goto(url);
    await openCarnet(page);
    await observeBoard(page);
    await unchanged(page, 1200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      394,
    );
    expect(errors).toEqual([]);
    console.log(
      'Idle board stays unchanged on first/last pages; static holder stays unchanged during a pour; botanical button artwork and labels fit at 320/393 pixels before/after reveal.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
