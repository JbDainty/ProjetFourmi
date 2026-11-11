import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/campaign';
import audit from '../docs/solvability-audit.json';
import { initial, loadLevel, type Save } from '../src/state/model';
import { mechanicIds } from '../src/engine/mechanics';
import { referencePour, referenceWon } from '../tests/reference-puzzle';

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
  const url = process.env.GAME_TEST_URL || 'http://localhost:8161/';
  const state = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const real = { ...initial(), started: true, guideSeen: true };
  real.settings = { ...real.settings, motion: false, music: false, sound: false, haptics: false };
  const trial = (id: number) => ({
    ...loadLevel({ ...real, testSession: { returnSave: real }, seeds: 3 }, id),
    seenMechanics: [...mechanicIds],
  });
  const seed = async (save: Save) => {
    await page.goto(url);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url + 'atelier');
    await page.getByTestId('game-actions').waitFor();
    await expect(page.getByTestId('page-folio')).toHaveText(
      `PAGE ${String(save.current).padStart(2, '0')}`,
    );
  };
  const action = (name: string) => page.getByRole('button', { name, exact: true });
  const transfer = async (from: number, to: number) => {
    await page.getByRole('button', { name: new RegExp(`^Flacon ${from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${to + 1},`) }).click();
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
  };
  mkdirSync('test-results', { recursive: true });
  try {
    let save = trial(863);
    save.board = [
      [0, 0, 0, 0],
      [3, 3, 3, 3],
      [],
      [],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [4, 4, 4, 4],
      [0, 0],
    ];
    save.known = save.board.map((t) => t.map(() => true));
    save.settings.motion = true;
    save.paidHints[`863|${JSON.stringify(save.board)}`] = {
      from: 0,
      to: 7,
      context: `4:${JSON.stringify(levels[862].rules)}`,
    };
    await seed({ ...save, seeds: 0 });
    const before = (await page.getByTestId('game-actions').boundingBox())!;
    await action('Indice').click();
    await expect(page.getByTestId('workshop-confirm')).toHaveCount(0);
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      'Versez le flacon 8 dans le flacon 3.',
    );
    expect((await state()).seeds).toBe(0);
    const repairedHint = Object.values((await state()).paidHints)[0];
    expect(repairedHint.revision).toBe(1);
    expect((await page.getByTestId('game-actions').boundingBox())!.y).toBeCloseTo(before.y, 1);
    await page.screenshot({ path: 'test-results/solvability-863-corrected-hint.png' });

    // Complete the photographed layout through four separately purchased hints.
    // A checked ordinary full vial must still be pourable in the middle.
    save.settings.confirmHints = false;
    await seed(save);
    let expected = save.board;
    for (const [index, [from, to]] of [
      [7, 2],
      [4, 7],
      [0, 2],
      [0, 3],
    ].entries()) {
      await action('Indice').click();
      await expect(page.getByTestId('hint-writing-text')).toHaveText(
        `Versez le flacon ${from + 1} dans le flacon ${to + 1}.`,
      );
      expect((await state()).seeds).toBe(3 - index);
      await action('Indice').click();
      await expect(action('Indice')).toBeEnabled();
      expect((await state()).seeds).toBe(3 - index);
      await transfer(from, to);
      expected = referencePour(expected, from, to, levels[862].rules)!;
      expect((await state()).board).toEqual(expected);
    }
    expect(referenceWon(expected, levels[862].rules)).toBe(true);
    expect(expected[2]).toEqual([0, 0, 0]);
    expect(expected[3]).toEqual([0, 0, 0]);
    await expect(page.getByTestId('victory-summary')).toBeVisible();
    expect((await state()).seeds).toBe(0);
    await page.screenshot({ path: 'test-results/solvability-863-finished.png' });

    // An actual campaign state after a wrong irreversible choice, with the
    // correct page inventory/rules, rather than a fabricated invalid save.
    const dead = audit.irreversibleExamples[0],
      blocked = trial(dead.page);
    blocked.board = dead.board;
    blocked.known = dead.board.map((t) => t.map(() => true));
    blocked.settings.confirmHints = false;
    await seed(blocked);
    const fixed = (await page.getByTestId('game-actions').boundingBox())!;
    await action('Indice').click();
    await expect(page.getByTestId('hint-writing-text')).toContainText('bloquée');
    expect((await state()).seeds).toBe(3);
    expect((await page.getByTestId('game-actions').boundingBox())!.y).toBeCloseTo(fixed.y, 1);
    await page.screenshot({ path: 'test-results/solvability-blocked-no-charge.png' });

    // Leaving before the delayed search starts cancels it and spends nothing.
    await seed({ ...save, settings: { ...save.settings, motion: false } });
    const untouched = await state();
    await page.evaluate(() => {
      (document.querySelector('[aria-label="Indice"]') as HTMLElement).click();
      (document.querySelector('[aria-label="Menu principal"]') as HTMLElement).click();
    });
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.waitForTimeout(350);
    expect(await state()).toEqual(untouched);
    expect(errors).toEqual([]);
    console.log(
      'Solvability UI passed: photographed page 863 solved in four non-cyclic hints; free repair at zero seeds; ordinary completed vial pour; both small vials filled; duplicate hints; unchanged toolbar; proven dead end without seed charge; cancellation on departure.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
