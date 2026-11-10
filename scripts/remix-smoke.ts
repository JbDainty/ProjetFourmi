import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import { attemptPuzzle } from '../src/engine/remix';
import levels from '../src/data/levels.json';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    serviceWorkers: 'block',
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8146/';
  const saved = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  let base = { ...initial(), started: true, guideSeen: true };
  for (const level of levels.slice(0, 32)) {
    base = loadLevel(base, level.id);
    for (const m of level.solution) base = move(base, m.from, m.to);
  }
  base = loadLevel(base, 32);
  base.seeds = 3;
  base.settings = { ...base.settings, motion: false, music: false, sound: false, haptics: false };
  const seed = async (s: Save) => {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), s);
    await page.goto(url + 'atelier');
    await page.getByTestId('game-actions').waitFor();
  };
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  mkdirSync('test-results', { recursive: true });
  try {
    await seed(base);
    await expect(page.getByTestId('hint-seed-price')).toHaveCount(0);
    await button('Indice').click();
    await expect(page.getByTestId('workshop-confirm')).toBeVisible();
    expect((await saved()).seeds).toBe(3);
    await page.getByRole('checkbox', { name: 'Ne plus me prévenir' }).click();
    await button('Continuer à chercher').click();
    expect((await saved()).settings.confirmHints).toBe(true);
    await button('Indice').click();
    await page.getByRole('checkbox', { name: 'Ne plus me prévenir' }).click();
    await page.screenshot({ path: 'test-results/hint-seed-confirm.png' });
    await button('Utiliser une graine').dblclick();
    await expect(page.getByTestId('hint-writing-text')).not.toBeEmpty();
    expect((await saved()).seeds).toBe(2);
    expect((await saved()).settings.confirmHints).toBe(false);
    await button('Indice').click();
    expect((await saved()).seeds).toBe(2);
    await expect(page.getByTestId('workshop-confirm')).toHaveCount(0);
    await page.reload();
    await page.getByTestId('game-actions').waitFor();
    expect((await saved()).settings.confirmHints).toBe(false);
    const before = await saved();
    await button('Mélanger').click();
    await button('Continuer à chercher').click();
    expect(await saved()).toEqual(before);
    await button('Mélanger').click();
    await button('Mélanger cette page').click();
    const mixed = await saved();
    expect(mixed.remix).toBeDefined();
    expect(mixed.board).not.toEqual(before.board);
    expect(mixed.seeds).toBe(before.seeds);
    expect(mixed.completed).toEqual(before.completed);
    expect(mixed.moves).toBe(0);
    expect(mixed.history).toEqual([]);
    await page.reload();
    await page.getByTestId('game-actions').waitFor();
    expect((await saved()).board).toEqual(mixed.board);
    await button('Indice').click();
    await expect(page.getByTestId('workshop-confirm')).toHaveCount(0);
    const certificate = attemptPuzzle(32, mixed.remix);
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      `Versez le flacon ${certificate.solution[0].from + 1} dans le flacon ${certificate.solution[0].to + 1}.`,
    );
    expect((await saved()).seeds).toBe(before.seeds - 1);
    for (const m of certificate.solution) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
    }
    await expect(page.getByTestId('victory-summary')).toBeVisible();
    expect((await saved()).moves).toBe(certificate.par);
    expect((await saved()).seeds).toBe(before.seeds);
    await expect(page.getByTestId('page-star-target')).toHaveAttribute(
      'aria-label',
      new RegExp(`Minimum possible : ${certificate.par} mouvements`),
    );
    // The compositor-only mixture locks every control and never mutates a hidden page.
    await seed({ ...base, settings: { ...base.settings, motion: true } });
    await button('Mélanger').click();
    await button('Mélanger cette page').click();
    await expect(page.getByTestId('workshop-mixing')).toBeVisible();
    await expect(button('Indice')).toBeDisabled();
    await expect(page.getByTestId('workshop-mixture-ready')).toBeVisible();
    await expect(button('Mélanger')).toBeEnabled();
    await page.screenshot({ path: 'test-results/remixed-page32.png' });
    const stable = await saved();
    await button('Mélanger').click();
    await button('Mélanger cette page').click();
    await page.goBack();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.waitForTimeout(650);
    expect((await saved()).board).toEqual(stable.board);
    await seed({ ...base, seeds: 0 });
    await button('Indice').click();
    await expect(page.getByTestId('workshop-confirm')).toHaveCount(0);
    expect((await saved()).seeds).toBe(0);
    await page.goto(url + 'aide');
    await expect(page.getByText('Mélanger pour repartir autrement', { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
    console.log(
      'Remix passed: confirmation/cancel/opt-out persistence, one seed per new hint, certified mixed puzzle and exact stars, reload, animation lock, cancellation on departure, zero seeds and updated help.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
