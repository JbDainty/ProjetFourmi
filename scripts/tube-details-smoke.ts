import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/campaign';
import { initial, loadLevel, move } from '../src/state/model';
import { mechanicIds } from '../src/engine/mechanics';
import { capacity, pour, crystalOpen } from '../src/engine/puzzle';

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
      levels[979],
      levels[862],
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
        for (const fitting of fittings) {
          expect(await fitting.evaluate((n) => n.parentElement?.getAttribute('transform'))).toMatch(
            /translate.*rotate.*scale/,
          );
          const i = Number((await fitting.getAttribute('data-testid'))!.split('-').at(-1));
          const glassTarget = (await page
            .getByRole('button', { name: new RegExp(`^Flacon ${i + 1},`) })
            .boundingBox())!;
          const ornament = (await fitting.boundingBox())!;
          if (ornament.height > 0) {
            expect(
              ornament.y,
              `equipment hit area page ${level.id}, tube ${i}`,
            ).toBeGreaterThanOrEqual(glassTarget.y - 1);
            expect(ornament.y + ornament.height).toBeLessThanOrEqual(
              glassTarget.y + glassTarget.height + 1,
            );
          }
        }
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
    for (const tube of targets) {
      await expect(page.getByTestId(`tube-sealed-mouth-${tube}`)).toHaveCount(0);
      await expect(page.getByTestId(`tube-open-mouth-${tube}`)).toBeAttached();
    }
    // The reported pair is physically adjacent, while its original identities
    // and stored puzzle stay intact. Hints and all pours use those identities.
    const linked = levels[979],
      [a, b] = linked.rules!.links![0];
    await seed(980);
    const target = (i: number) =>
      page.getByRole('button', { name: new RegExp(`^Flacon ${i + 1},`) });
    const one = (await target(a).boundingBox())!,
      two = (await target(b).boundingBox())!;
    expect(one.y).toBe(two.y);
    expect(Math.abs(one.x - two.x)).toBeLessThanOrEqual(one.width + 6.1);
    await expect(page.getByTestId('botanical-coupling')).toHaveCount(1);
    await target(a).click();
    for (const tube of [a, b])
      await expect(
        page.getByTestId(`tube-coupling-${tube}`).locator('path').first(),
      ).toHaveAttribute('fill', '#83975d');
    await target(a).click();
    await page.screenshot({ path: 'test-results/botanical-coupled-page980.png' });
    let expected = linked.board;
    for (const m of linked.solution) {
      await target(m.from).click();
      await target(m.to).click();
      expected = pour(expected, m.from, m.to, linked.rules)!;
      expect(
        await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).board),
      ).toEqual(expected);
    }
    await expect(page.getByTestId('victory-summary')).toBeVisible();
    // During an animated pour, the moving glass leaves its shared spring while
    // the other vessel and their common rack fitting stay in place.
    let animated = await seed(980, true);
    const at = linked.solution.findIndex((step) => step.from === a || step.from === b);
    expect(at).toBeGreaterThanOrEqual(0);
    for (const step of linked.solution.slice(0, at)) animated = move(animated, step.from, step.to);
    if (at > 0) {
      await page.evaluate(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        animated,
      );
      await page.reload();
      await expect(page.getByTestId('page-folio')).toHaveText('PAGE 980');
    }
    const firstMove = linked.solution[at];
    // Direct reload bypasses the home screen's premeasurement gate. Allow the
    // hidden hint probe to settle before comparing the rack through a pour.
    await page.waitForTimeout(150);
    const fittingPose = await page.getByTestId('botanical-coupling').getAttribute('transform');
    const partner = firstMove.from === a ? b : a,
      partnerBefore = await target(partner).boundingBox();
    await target(firstMove.from).click();
    await target(firstMove.to).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    expect(await target(partner).boundingBox()).toEqual(partnerBefore);
    await expect(page.getByTestId('botanical-coupling')).toHaveAttribute('transform', fittingPose!);
    await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
    const frozen = representatives[2];
    await seed(frozen.id);
    let thawed = false;
    for (const step of frozen.solution) {
      await target(step.from).click();
      await target(step.to).click();
      const board = await page.evaluate(
        () => JSON.parse(localStorage.getItem('color-world.save')!).board,
      );
      for (const c of frozen.rules!.crystals!)
        if (crystalOpen(board, c.color, frozen.rules)) {
          await expect(page.getByTestId(`tube-frozen-layer-${c.tube}`)).toHaveCount(0);
          thawed = true;
        }
      if (thawed) break;
    }
    expect(thawed).toBe(true);
    expect(errors).toEqual([]);
    console.log(
      'Tube details passed: all botanical fittings at four formats; adjacent clasped pairs including small capacities; unchanged identities and complete page 980 solution; shared key opens both cages; frozen-layer ice disappears on activation; pouring glass and static clasp; controls remain visible.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
