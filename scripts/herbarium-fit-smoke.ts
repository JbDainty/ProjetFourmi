import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';
import { herbariumLayout } from '../src/layout/herbarium';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  await page.addInitScript({ content: 'window.__name = value => value;' });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const base = process.env.GAME_TEST_URL || 'http://localhost:8171/';
  const full: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    seeds: 27,
    completed: {},
    pigments: [],
  };
  full.settings = { ...full.settings, motion: false, sound: false, music: false };
  for (let id = 1; id <= 1000; id++) {
    full.completed[id] = { stars: 3, date: '2026-11-11T12:00:00Z' };
    full.pigments.push(discoverPigment(id, '2026-11-11T12:00:00Z'));
  }
  const stored = () => page.evaluate(() => localStorage.getItem('color-world.save'));
  const seed = async (motion = false) => {
    await page.goto(base);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), {
      ...full,
      settings: { ...full.settings, motion },
    });
    await page.goto(base + 'herbier');
    await expect(page.getByTestId('herbarium-shelf')).toBeVisible();
  };
  const fit = async (width: number, height: number) => {
    const doc = await page.evaluate(() => ({
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    }));
    expect(doc.w).toBeLessThanOrEqual(width);
    expect(doc.h).toBeLessThanOrEqual(height + 1);
    const actions = await page.getByRole('button').all();
    for (const button of actions) {
      if (!(await button.isVisible())) continue;
      const b = (await button.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(-0.5);
      expect(b.y).toBeGreaterThanOrEqual(-0.5);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 0.5);
      expect(b.y + b.height).toBeLessThanOrEqual(height + 0.5);
      expect(b.width).toBeGreaterThanOrEqual(43.9);
      expect(b.height).toBeGreaterThanOrEqual(43.9);
    }
    await page.mouse.wheel(0, 700);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  };
  mkdirSync('test-results', { recursive: true });
  try {
    await seed();
    const saved = await stored();
    for (const [width, height] of [
      [320, 400],
      [320, 568],
      [360, 640],
      [412, 915],
      [768, 1024],
      [1024, 1366],
      [932, 430],
      [480, 280],
    ]) {
      await page.setViewportSize({ width, height });
      await page.getByRole('button', { name: 'Les planches', exact: true }).click();
      const layout = herbariumLayout(width, height);
      await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(
        layout.booksPerPage,
      );
      await fit(width, height);
      expect(await page.locator('[aria-label^="Planche de "]').count()).toBe(0);
      await page.screenshot({ path: `test-results/herbarium-fit-${width}x${height}.png` });
      await page.getByRole('button', { name: 'Pigments et sceaux', exact: true }).click();
      await expect(page.getByTestId('herbarium-pigment-card')).toHaveCount(layout.pigmentsPerPage);
      await fit(width, height);
      await page.getByRole('button', { name: 'Suivants', exact: true }).click();
      await fit(width, height);
      await page.screenshot({ path: `test-results/herbarium-pigments-${width}x${height}.png` });
      expect(await stored()).toBe(saved);
    }
    // Every ecosystem, including the longest titles, stays inside its binding.
    await page.setViewportSize({ width: 320, height: 568 });
    await seed();
    const ink: unknown[] = [];
    for (let shelf = 0; shelf < 5; shelf++) {
      const samples = await page
        .locator('[data-testid^="antique-cover-title-"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const ink = range.getBoundingClientRect(),
              box = node.getBoundingClientRect();
            return {
              name: node.textContent,
              inkHeight: ink.height,
              boxHeight: box.height,
              inkWidth: ink.width,
              boxWidth: box.width,
            };
          }),
        );
      ink.push(...samples);
      for (const s of samples) {
        expect(s.inkHeight, s.name!).toBeLessThanOrEqual(s.boxHeight + 1);
        expect(s.inkWidth, s.name!).toBeLessThanOrEqual(s.boxWidth + 1);
      }
      if (shelf < 4) await page.getByRole('button', { name: 'Suite', exact: true }).click();
    }
    writeFileSync('test-results/herbarium-title-ink.json', JSON.stringify(ink, null, 2));
    await page.screenshot({ path: 'test-results/herbarium-last-shelf-small.png' });
    await page.setViewportSize({ width: 412, height: 915 });
    await seed(true);
    const unchanged = await stored();
    await page
      .getByRole('button', { name: /^Ouvrir le carnet / })
      .first()
      .dispatchEvent('click');
    await expect(page.getByTestId('antique-book-opening')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 400 });
    await expect(page.getByTestId('antique-book-opening')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Ouvrir le carnet / })).toHaveCount(2);
    await page.waitForTimeout(450);
    await expect(page.getByTestId('ecosystem-album')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Ouvrir le carnet / }).first()).toBeEnabled();
    await page.setViewportSize({ width: 412, height: 915 });
    await page
      .getByRole('button', { name: /^Ouvrir le carnet / })
      .first()
      .dispatchEvent('click');
    await expect(page.getByTestId('antique-book-opening')).toBeVisible();
    await page.getByRole('button', { name: 'Pigments et sceaux', exact: true }).click();
    await page.waitForTimeout(450);
    await expect(page.getByTestId('ecosystem-album')).toHaveCount(0);
    await page.getByRole('button', { name: 'Les planches', exact: true }).click();
    const first = page.getByRole('button', { name: /^Ouvrir le carnet / }).first();
    await first.dispatchEvent('click');
    await first.dispatchEvent('click');
    await expect(page.getByTestId('ecosystem-album')).toBeVisible();
    expect(await stored()).toBe(unchanged);
    await page.getByRole('button', { name: 'Carnets', exact: true }).click();
    await expect(page.getByTestId('herbarium-shelf')).toBeVisible();
    await page
      .getByRole('button', { name: /^Ouvrir le carnet / })
      .first()
      .dispatchEvent('click');
    await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.waitForTimeout(450);
    await expect(page.getByTestId('ecosystem-album')).toHaveCount(0);
    expect(await stored()).toBe(unchanged);
    expect(errors).toEqual([]);
    console.log(
      'Herbarium viewport passed: no scroll in either tab on eight phone/tablet/landscape sizes; 44-point controls; all twenty titles inside bindings; adaptive pagination; 1000-pigment collection; rapid taps and cancellation during opening; unchanged save.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
