import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/campaign';
import { initial, loadLevel } from '../src/state/model';
import { mechanicIds } from '../src/engine/mechanics';
import { capacity } from '../src/engine/puzzle';

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
  const base = process.env.GAME_TEST_URL || 'http://localhost:8163/';
  const real = { ...initial(), started: true, guideSeen: true, seenMechanics: [...mechanicIds] };
  real.settings = { ...real.settings, music: false, sound: false, motion: false };
  const seed = async (id: number, motion = false) => {
    await page.goto(base);
    const save = loadLevel(
      {
        ...real,
        testSession: { returnSave: real },
        settings: { ...real.settings, motion },
        seeds: 50,
      },
      id,
    );
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(base + 'atelier');
    await expect(page.getByTestId('page-folio')).toHaveText(`PAGE ${String(id).padStart(2, '0')}`);
    return save;
  };
  mkdirSync('test-results', { recursive: true });
  try {
    const representatives = [
      levels.find((l) => l.rules?.gates?.length === 2)!,
      levels.find((l) => (l.rules?.mystery?.length ?? 0) >= 4)!,
      levels.find((l) => l.rules?.crystals?.length === 2)!,
      levels.find((l) => l.rules?.filters?.length === 2)!,
      levels.find((l) => l.rules?.pipettes?.length === 2)!,
      levels.find((l) => l.rules?.collectors?.length === 2)!,
      levels[35],
      levels.find((l) => l.rules?.crystals?.some((c) => (l.rules?.capacities?.[c.tube] ?? 4) < 4))!,
    ];
    for (const [width, height] of [
      [320, 568],
      [412, 915],
      [768, 1024],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      for (const level of representatives) {
        await seed(level.id);
        await expect(page.getByRole('button', { name: 'Indice', exact: true })).toBeInViewport();
        const fittings = await page.locator('[data-testid^="tube-insignia-"]').all();
        expect(fittings.length).toBe(level.board.length);
        // Every fitting belongs to the actual transformed glass, never a scene label.
        for (const fitting of fittings)
          expect(await fitting.evaluate((n) => n.parentElement?.getAttribute('transform'))).toMatch(
            /translate.*rotate.*scale/,
          );
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
          width,
        );
        if (width === 412)
          await page.screenshot({ path: `test-results/tube-fittings-page-${level.id}.png` });
      }
    }
    await page.setViewportSize({ width: 412, height: 915 });
    const locked = representatives[0];
    await seed(locked.id, true);
    const step = locked.solution[0];
    const source = page.getByTestId(`tube-insignia-${step.from}`);
    const restingPose = await source.evaluate((n) => n.parentElement?.getAttribute('transform'));
    await page.getByRole('button', { name: new RegExp(`^Flacon ${step.from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${step.to + 1},`) }).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(page.locator('#pouring-vessel')).toBeVisible();
    await expect
      .poll(() => source.evaluate((n) => n.parentElement?.getAttribute('transform')))
      .not.toBe(restingPose);
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    // Both locks visibly open after the shared brush key is completed.
    await seed(locked.id);
    const key = locked.rules!.gates![0].key;
    const targets = locked.rules!.gates!.map((g) => g.tube);
    let opened = false;
    for (const m of locked.solution) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
      const current = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('color-world.save')!),
      );
      if (
        current.board[key].length === capacity(locked.rules, key) &&
        current.board[key].every((c: number) => c === current.board[key][0])
      ) {
        for (const tube of targets)
          await expect(page.getByTestId(`tube-lock-${tube}`).locator('g').first()).toHaveAttribute(
            'opacity',
            '0.45',
          );
        opened = true;
        break;
      }
    }
    expect(opened).toBe(true);
    expect(errors).toEqual([]);
    console.log(
      'Tube details passed: all integrated fittings at four formats, multiple locks/crystals/filters/pipettes/collectors and mysteries, symbols move with glass, shared key opens both collars and controls remain visible.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
