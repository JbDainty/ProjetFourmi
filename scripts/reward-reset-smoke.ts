import { chromium, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import { acquireTheme } from '../src/state/economy';
import levels from '../src/data/levels.json';
import { firstPageAttempt } from './test-fixtures';
import { openCarnet, openScreen } from './navigation-test-helper';

function progressedSave() {
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, 8)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = acquireTheme({ ...save, seeds: 200, nickname: 'Camille' }, 'sauge');
  save = loadLevel(save, 9);
  const next = levels[8].solution[0];
  save = move(save, next.from, next.to);
  save.settings = { motion: false, sound: false, music: false, haptics: false, patterns: true };
  return save;
}

async function rewards(page: Page, url: string) {
  await page.addInitScript({
    content: `
    window.rewardRuns = [];
    const observed = new WeakSet();
    new MutationObserver(() => {
      const root = document.querySelector('[data-testid="page-earned-stars"]');
      if (!root || observed.has(root)) return;
      observed.add(root);
      const frames = []; window.rewardRuns.push(frames);
      const sample = () => {
        if (!root.isConnected) return;
        frames.push(Array.from(root.querySelectorAll('[data-testid="reward-star-bloom"]')).map(n => Number(getComputedStyle(n).opacity)));
        if (!root.querySelector('[data-testid="reward-stars-settled"]') && frames.length < 240) requestAnimationFrame(sample);
      }; requestAnimationFrame(sample);
    }).observe(document, { subtree: true, childList: true });
  `,
  });
  await page.goto(url);
  await openCarnet(page);
  const fixture = firstPageAttempt(0);
  fixture.save.settings.motion = true;
  await page.evaluate(
    (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
    fixture.save,
  );
  await page.goto(url);
  await openCarnet(page);
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
  await tube(fixture.last.from).click();
  await tube(fixture.last.to).click();
  await expect(page.getByTestId('reward-stars-animating')).toBeAttached();
  await expect(page.getByTestId('botanical-star-earned')).toHaveCount(3);
  // Colour reveal changes the layout but must not replay the reward animation.
  await page.getByRole('button', { name: 'Révéler la couleur' }).click();
  await expect(page.getByTestId('reward-stars-settled')).toBeAttached();
  const frames = await page.evaluate(
    () => (window as unknown as { rewardRuns: number[][][] }).rewardRuns,
  );
  expect(frames).toHaveLength(1);
  expect(frames[0].length).toBeGreaterThan(10);
  const appears = [0, 1, 2].map((i) => frames[0].findIndex((frame) => frame[i] > 0.15));
  expect(appears[0]).toBeGreaterThanOrEqual(0);
  expect(appears[1]).toBeGreaterThan(appears[0]);
  expect(appears[2]).toBeGreaterThan(appears[1]);
  expect(frames[0].at(-1)).toEqual([1, 1, 1]);
  await page.getByTestId('page-earned-stars').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'test-results/reward-botanical-stars.png' });
  const won = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  await page.getByRole('button', { name: 'Rejouer la page' }).click();
  await expect(page.getByTestId('book-page-turn')).toBeVisible();
  await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
  await expect(page.getByTestId('page-earned-stars')).toHaveCount(0);
  const replay = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  expect(replay.current).toBe(1);
  expect(replay.moves).toBe(0);
  expect(replay.board).toEqual(levels[0].board);
  expect(replay.history).toEqual([]);
  expect(replay.completed).toEqual(won.completed);
  expect(replay.seeds).toBe(won.seeds);
  expect(replay.pigments).toEqual(won.pigments);
  for (const m of levels[0].solution) {
    await tube(m.from).click();
    await tube(m.to).click();
    await expect(page.getByTestId('liquid-board-pouring')).toHaveCount(0);
  }
  await expect(page.getByTestId('page-earned-stars')).toHaveAccessibleName(
    '3 étoiles obtenues sur 3',
  );
  await expect(page.getByTestId('reward-stars-settled')).toBeAttached();
  expect(
    await page.evaluate(() => (window as unknown as { rewardRuns: unknown[] }).rewardRuns.length),
  ).toBe(2);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).seeds),
  ).toBe(won.seeds + 1);
  // Replay is available before revealing the pigment as well.
  await page.getByRole('button', { name: 'Rejouer la page' }).click();
  await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
  await expect(page.getByTestId('page-earned-stars')).toHaveCount(0);
  const low = firstPageAttempt(3);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), low.save);
  await page.goto(url);
  await openCarnet(page);
  await tube(low.last.from).click();
  await tube(low.last.to).click();
  await expect(page.getByTestId('reward-stars-settled')).toBeAttached();
  await expect(page.getByTestId('reward-stars-animating')).toHaveCount(0);
  await expect(page.getByTestId('botanical-star-earned')).toHaveCount(1);
  await expect(page.getByTestId('botanical-star-empty')).toHaveCount(2);
  await expect(page.getByTestId('reward-star-sparks')).toHaveCount(0);
  const starBox = (await page.getByTestId('page-earned-stars').boundingBox())!;
  expect(starBox.x).toBeGreaterThanOrEqual(0);
  expect(starBox.x + starBox.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'test-results/reward-one-star-narrow.png' });
  await page.getByRole('button', { name: 'Rejouer la page' }).click();
  await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
  await expect(page.getByTestId('page-earned-stars')).toHaveCount(0);
  // The last page can also be replayed directly without advancing beyond the book.
  let finalSave = { ...initial(), started: true };
  finalSave.settings = {
    ...finalSave.settings,
    motion: false,
    sound: false,
    music: false,
    haptics: false,
  };
  for (const level of levels.slice(0, 99)) {
    finalSave = loadLevel(finalSave, level.id);
    for (const m of level.solution) finalSave = move(finalSave, m.from, m.to);
  }
  finalSave = loadLevel(finalSave, 100);
  for (const m of levels[99].solution.slice(0, -1)) finalSave = move(finalSave, m.from, m.to);
  await page.evaluate(
    (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
    finalSave,
  );
  await page.goto(url);
  await openCarnet(page);
  const last = levels[99].solution.at(-1)!;
  await tube(last.from).click();
  await tube(last.to).click();
  await expect(page.getByTestId('page-earned-stars')).toBeVisible();
  const completedBook = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('color-world.save')!),
  );
  await page.getByRole('button', { name: 'Rejouer la page' }).click();
  await expect(page.getByTestId('page-earned-stars')).toHaveCount(0);
  const finalReplay = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('color-world.save')!),
  );
  expect(finalReplay.current).toBe(100);
  expect(finalReplay.board).toEqual(levels[99].board);
  expect(finalReplay.completed).toEqual(completedBook.completed);
  expect(finalReplay.seeds).toBe(completedBook.seeds);
}

async function resetting(page: Page, url: string) {
  const save = progressedSave();
  await page.evaluate((s) => {
    localStorage.setItem('color-world.save', JSON.stringify(s));
    localStorage.setItem('herbarium.test.sentinel', 'keep');
  }, save);
  await page.goto(url);
  await openCarnet(page);
  await openScreen(page, 'Paramètres');
  const start = page.getByRole('button', { name: 'Remettre ma progression à zéro' });
  const warning = page.getByTestId('reset-progress-warning');
  const confirm = page.getByTestId('reset-progress-confirmation');
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
  await start.click();
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('seront effacés de cet appareil');
  await expect(page.getByRole('button', { name: 'Oui, effacer ma progression' })).toHaveCount(0);
  expect(await stored()).toEqual(save);
  await warning.getByRole('button', { name: 'Conserver ma progression' }).click();
  await expect(warning).toHaveCount(0);
  expect(await stored()).toEqual(save);
  await start.click();
  await page.getByRole('button', { name: 'Continuer vers la confirmation' }).click();
  await expect(confirm).toBeVisible();
  expect(await stored()).toEqual(save);
  await page.screenshot({ path: 'test-results/reset-last-confirmation.png' });
  await confirm.getByRole('button', { name: 'Conserver ma progression' }).click();
  await expect(confirm).toHaveCount(0);
  expect(await stored()).toEqual(save);
  await start.click();
  await expect(warning).toBeVisible();
  await page.getByRole('button', { name: 'Continuer vers la confirmation' }).click();
  await page.keyboard.press('Escape');
  await expect(confirm).toHaveCount(0);
  expect(await stored()).toEqual(save);
  // A rapid double-tap on the first action must not become approval to erase.
  await start.click();
  await page.getByRole('button', { name: 'Continuer vers la confirmation' }).dblclick();
  expect(await stored()).toEqual(save);
  if (await confirm.count())
    await confirm.getByRole('button', { name: 'Conserver ma progression' }).click();
  if (await warning.count())
    await warning.getByRole('button', { name: 'Conserver ma progression' }).click();
  // Simulate a storage failure at the actual persistence boundary.
  await page.evaluate(`
    window.savedSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === 'color-world.save') throw new DOMException('Storage unavailable', 'QuotaExceededError');
      return window.savedSetItem.call(this, key, value);
    };
  `);
  await start.click();
  await page.getByRole('button', { name: 'Continuer vers la confirmation' }).click();
  await confirm.getByRole('button', { name: 'Oui, effacer ma progression' }).click();
  await expect(confirm.getByRole('alert')).toContainText('n’a pas pu être enregistré');
  expect(await stored()).toEqual(save);
  await confirm.getByRole('button', { name: 'Conserver ma progression' }).click();
  await expect(page.getByRole('button', { name: 'Créer une copie de sauvegarde' })).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Contenu de la sauvegarde' })).toHaveCount(0);
  await page.evaluate(`Storage.prototype.setItem = window.savedSetItem;`);
  await start.click();
  await expect(warning).toBeVisible();
  await page.getByRole('button', { name: 'Continuer vers la confirmation' }).click();
  await confirm.getByRole('button', { name: 'Oui, effacer ma progression' }).click();
  await expect(page.getByTestId('book-signature-page')).toBeVisible();
  expect(await stored()).toEqual({ ...initial(), settings: save.settings });
  expect(await page.evaluate(() => localStorage.getItem('herbarium.test.sentinel'))).toBe('keep');
  await page.reload();
  await expect(page.getByTestId('book-signature-page')).toBeVisible();
  expect(await stored()).toEqual({ ...initial(), settings: save.settings });
  await openCarnet(page);
  await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
  await expect(page.getByText('✦', { exact: true }).first()).toBeVisible();
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  try {
    const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
    await rewards(page, url);
    await resetting(page, url);
    expect(errors).toEqual([]);
    console.log(
      'Reward/reset passed: sequential botanical stars, no repeat on reveal, replay before/after reveal and new victory, preserved gains, reduced motion, 320px; two reset confirmations, cancel/Escape/double-tap safety, failed persistence preserves memory/save, successful reset survives reload and keeps preferences/unrelated storage.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
