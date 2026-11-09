import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import { species } from '../src/data/botany';
import levels from '../src/data/levels.json';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8124/';
  mkdirSync('test-results', { recursive: true });
  try {
    for (const scenario of [
      { current: 1, done: 0, width: 393, height: 852, motion: true },
      { current: 4, done: 3, width: 320, height: 568, motion: true },
      { current: 5, done: 5, width: 393, height: 852, motion: false },
      { current: 44, done: 43, width: 393, height: 852, motion: true },
      { current: 100, done: 100, width: 768, height: 1024, motion: true },
    ]) {
      let save = { ...initial(), started: true, guideSeen: true };
      for (const level of levels.slice(0, scenario.done)) {
        save = loadLevel(save, level.id);
        for (const m of level.solution) save = move(save, m.from, m.to);
      }
      save = loadLevel(save, scenario.current);
      save.settings = {
        ...save.settings,
        motion: scenario.motion,
        sound: false,
        music: false,
        haptics: false,
      };
      const page = await browser.newPage({
        viewport: { width: scenario.width, height: scenario.height },
        serviceWorkers: 'block',
      });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        save,
      );
      await page.addInitScript({ content: 'window.__name=value=>value;' });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      try {
        await page.goto(url);
        const book = page.getByRole('button', {
          name: 'Observer ma planche dans l’herbier',
          exact: true,
        });
        await book.waitFor({ state: 'attached' });
        await page.evaluate(() => {
          (window as any).plateEntryFrames = [];
          (window as any).plateEntrySampling = true;
          const sample = () => {
            const direct = document.querySelector('[data-testid=herbarium-direct-plate]');
            const collection = document.querySelector('[aria-label="Observer Coquelicot"]');
            if (direct || collection)
              (window as any).plateEntryFrames.push({
                direct: !!direct,
                collection: !!collection,
                time: performance.now(),
              });
            if ((window as any).plateEntrySampling) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        await book.evaluate((node: HTMLElement) => {
          node.click();
          node.click();
          node.click();
        });
        await page.waitForFunction(() => (window as any).plateEntryFrames.length > 2);
        const frames = await page.evaluate(
          () =>
            (window as any).plateEntryFrames as {
              direct: boolean;
              collection: boolean;
              time: number;
            }[],
        );
        writeFileSync(
          `test-results/herbarium-entry-${scenario.current}.json`,
          JSON.stringify(frames, null, 2),
        );
        // The first drawn destination must be the requested plate, never a grid behind a modal.
        expect(frames.every((f) => f.direct && !f.collection)).toBe(true);
        const plate = page.getByTestId('herbarium-direct-plate');
        await expect(plate).toBeVisible();
        await expect(page.getByRole('button', { name: /^Observer (?!ma planche)/ })).toHaveCount(0);
        await expect(
          plate.getByRole('img', {
            name: new RegExp(
              `^Planche de ${species[Math.floor((scenario.current - 1) / 5)].name},`,
            ),
          }),
        ).toHaveCount(1);
        await expect(
          plate.getByRole('button', { name: 'Fermer la planche', exact: true }),
        ).toBeInViewport();
        await page.screenshot({ path: `test-results/herbarium-direct-${scenario.current}.png` });
        await plate.getByRole('button', { name: 'Agrandir l’illustration', exact: true }).click();
        await expect(plate.getByText('Touchez pour réduire la planche')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(plate).toHaveCount(0);
        await expect(page.getByTestId('herbarium-collection-title')).toBeVisible();
        await expect(page.getByRole('button', { name: /^Observer (?!ma planche)/ })).toHaveCount(
          20,
        );
        await page.getByRole('button', { name: 'Observer Coquelicot', exact: true }).click();
        await expect(page.getByTestId('herbarium-plate')).toBeVisible();
        await page.getByRole('button', { name: 'Fermer la planche', exact: true }).click();
        await expect(page.getByTestId('herbarium-plate')).toHaveCount(0);
        await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
        await expect(page.getByTestId('home-screen')).toBeVisible();
        await book.evaluate((node: HTMLElement) => node.click());
        await expect(plate).toBeVisible();
        await plate.getByRole('button', { name: 'Fermer la planche', exact: true }).click();
        expect(
          await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!)),
        ).toEqual(save);
        expect(errors).toEqual([]);
      } finally {
        await page.close();
      }
    }
    console.log(
      'Herbarium entry passed: immediate book taps draw only the selected plate from the first destination frame, no collection mounted underneath, zoom, close/Escape, normal collection dialog, repeated return, five restoration/progress cases, phone/tablet and 4× CPU throttling.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
