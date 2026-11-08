import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
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
      { width: 393, height: 852, level: 1, motion: true },
      { width: 320, height: 740, level: 7, motion: false },
      { width: 1280, height: 900, level: 61, motion: true },
      { width: 393, height: 980, level: 100, motion: true },
    ]) {
      const { width, height, level, motion } = scenario;
      let save = { ...initial(), started: true, guideSeen: true, nickname: 'Dainty' };
      for (const prior of levels.slice(0, level - 1)) {
        save = loadLevel(save, prior.id);
        for (const step of prior.solution) save = move(save, step.from, step.to);
      }
      save = loadLevel(save, level);
      save.settings = { ...save.settings, music: false, sound: false, haptics: false, motion };
      const page = await browser.newPage({ viewport: { width, height }, serviceWorkers: 'block' });
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.addInitScript(
        (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
        save,
      );
      await page.addInitScript({ content: 'window.__name = value => value;' });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      let releaseImage!: () => void;
      const imageGate = new Promise<void>((resolve) => {
        releaseImage = resolve;
      });
      let requestedImage = false;
      await page.route(/\/serre\.[^/]+\.png/, async (route) => {
        requestedImage = true;
        await imageGate;
        await route.continue().catch(() => {});
      });
      try {
        await page.goto(url);
        await expect(page.getByTestId('home-stage-settled')).toBeAttached();
        await expect.poll(() => requestedImage).toBe(true);
        const stored = () =>
          page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
        const before = await stored();
        const play = () => page.getByTestId('home-restore-action').getByRole('button');
        await play().click();
        await expect(play()).toBeDisabled();
        // Slow storage/network must leave the real menu visible, without an empty atelier.
        await expect(page.getByTestId('home-screen')).toBeVisible();
        await expect(page.getByTestId('page-folio')).toHaveCount(0);
        expect(await stored()).toEqual(before);
        if (level === 1) {
          // Choosing another destination cancels an in-flight play request.
          await page.getByRole('link', { name: 'Paramètres', exact: true }).click();
          releaseImage();
          await expect(page).toHaveURL(/\/parametres\/?$/);
          await page.waitForTimeout(150);
          await expect(page.getByTestId('page-folio')).toHaveCount(0);
          await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
          await expect(page.getByTestId('home-screen')).toBeVisible();
        }
        await page.evaluate(() => {
          (window as any).entrySamples = [];
          (window as any).entrySampling = true;
          const sample = () => {
            const el = (id: string) => document.querySelector(`[data-testid="${id}"]`);
            const board = el('liquid-board-idle');
            if (board) {
              const actions = el('game-actions')!.getBoundingClientRect();
              const images = Array.from(el('greenhouse-world-background')!.querySelectorAll('img'));
              (window as any).entrySamples.push({
                boardHeight: board.getBoundingClientRect().height,
                boardWidth: board.getBoundingClientRect().width,
                racks: document.querySelectorAll('g[id^="tube-rack-"]').length,
                tubes: document.querySelectorAll('[aria-label^="Flacon "]').length,
                actionsY: actions.y + (el('book-page-scroll')?.scrollTop || 0),
                hintHeight: el('hint-scroll-slot')!.getBoundingClientRect().height,
                imageReady:
                  images.length > 0 && images.every((img) => img.complete && img.naturalWidth > 0),
              });
            }
            if ((window as any).entrySampling) requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        releaseImage();
        if (level === 1) await play().click();
        await expect(page.getByTestId('page-folio')).toHaveText(
          `PAGE ${String(level).padStart(2, '0')}`,
        );
        await expect(page.getByRole('button', { name: /^Flacon / })).toHaveCount(save.board.length);
        await page.waitForTimeout(400);
        const samples = await page.evaluate(() => {
          (window as any).entrySampling = false;
          return (window as any).entrySamples as {
            boardHeight: number;
            boardWidth: number;
            racks: number;
            tubes: number;
            actionsY: number;
            hintHeight: number;
            imageReady: boolean;
          }[];
        });
        expect(samples.length).toBeGreaterThan(1);
        const last = samples.at(-1)!;
        for (const frame of samples) {
          expect(frame.racks).toBeGreaterThan(0);
          expect(frame.tubes).toBe(save.board.length);
          expect(frame.imageReady).toBe(true);
          expect(frame.boardHeight).toBeCloseTo(last.boardHeight, 1);
          expect(frame.boardWidth).toBeCloseTo(last.boardWidth, 1);
          expect(frame.actionsY).toBeCloseTo(last.actionsY, 1);
          expect(frame.hintHeight).toBeCloseTo(last.hintHeight, 1);
        }
        writeFileSync(
          `test-results/entry-frames-${width}-${level}.json`,
          JSON.stringify(samples, null, 2),
        );
        await page.screenshot({ path: `test-results/entry-ready-${width}-${level}.png` });
        expect(await stored()).toEqual(before);
        expect(errors).toEqual([]);
      } finally {
        releaseImage();
        await page.close();
      }
    }
    console.log(
      'Workshop entry passed: menu retained until image and layout readiness, cancellation when navigating away, complete tubes/background on the first painted game frame, stable hint/buttons, one/two rows, mobile/desktop, reduced motion and unchanged progress under 4× CPU throttling.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
