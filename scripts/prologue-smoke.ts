import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial } from '../src/state/model';
import { prologueDuration } from '../src/animation/prologue';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--use-gl=angle',
    ],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8104/ProjetFourmi/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    (window as any).webglReleased = 0;
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: any,
      ...rest: any[]
    ) {
      const result = (original as any).call(this, type, ...rest);
      if (result && (type === 'webgl2' || type === 'webgl')) {
        const extension = result.getExtension('WEBGL_lose_context');
        if (extension) {
          const lose = extension.loseContext.bind(extension);
          extension.loseContext = () => {
            (window as any).webglReleased++;
            lose();
          };
        }
      }
      return result;
    } as any;
  });
  // This suite now exercises the retained realtime fallback, independent of the default film.
  await page.route('**/*.mp4', (route) => route.abort());
  const book = page.getByTestId('opening-webgl-book');
  const ready = async () => {
    // React Native's image loader needs animation-frame callbacks even while the film clock is mocked.
    await expect
      .poll(
        async () => {
          await page.clock.runFor(50);
          return (await book.count()) ? book.getAttribute('data-renderer') : 'absent';
        },
        { timeout: 20000 },
      )
      .toBe('webgl');
  };
  const phase = async (p: number) => {
    const current = Number(await book.getAttribute('data-progress'));
    await page.clock.fastForward(Math.max(0, Math.ceil((p - current) * prologueDuration)));
    await page.clock.runFor(50);
  };
  const finishFilm = async () => {
    await page.clock.fastForward(prologueDuration + 100);
    await page.clock.runFor(50);
  };
  mkdirSync('test-results', { recursive: true });
  try {
    const now = Date.now();
    await page.clock.install({ time: new Date(now) });
    await page.clock.pauseAt(new Date(now + 250));
    await page.goto(url);
    await ready();
    await phase(0.13);
    const held = Number(await book.getAttribute('data-progress'));
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.fastForward(4000);
    await page.clock.runFor(50);
    expect(Number(await book.getAttribute('data-progress'))).toBe(held);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.clock.runFor(90);
    expect(Number(await book.getAttribute('data-progress'))).toBeLessThan(held + 0.03);
    for (const [progress, name] of [
      [0.06, 'cover'],
      [0.32, 'opening'],
      [0.61, 'vortex'],
      [0.82, 'bloom'],
    ] as const) {
      await phase(progress);
      await page.screenshot({ path: `test-results/prologue-3d-mobile-${name}.png` });
    }
    // Geometry batching lowers the draw count; this metric counts calls in one frame, not FPS.
    const draws = Number(await book.getAttribute('data-draws'));
    expect(draws).toBeGreaterThan(20);
    expect(draws).toBeLessThanOrEqual(65);
    await finishFilm();
    await expect(page.getByTestId('book-signature-page')).toBeVisible({ timeout: 15000 });
    await expect.poll(() => page.evaluate(() => (window as any).webglReleased)).toBe(1);
    await page.getByRole('textbox', { name: 'Votre pseudo' }).fill('Camille');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await page.clock.runFor(2700);
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).seeds),
    ).toBe(1);
    // A returning player is never forced to watch the film again.
    await page.goto(url);
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect(book).toHaveCount(0);
    const signed = await page.evaluate(() => localStorage.getItem('color-world.save'));
    await page.getByRole('button', { name: 'Revoir le prologue' }).click();
    await ready();
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(signed);
    // Check a desktop framing and early cancellation without creating a nickname/account.
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      initial(),
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(url);
    await ready();
    await phase(0.56);
    await page.screenshot({ path: 'test-results/prologue-3d-desktop.png' });
    await finishFilm();
    await expect(page.getByTestId('book-signature-page')).toBeVisible({ timeout: 15000 });
    await expect(book).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as any).webglReleased)).toBe(1);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).started),
    ).toBe(false);
    // Skip at the start of a fresh scene, independent of screenshot readback time.
    await page.goto(url);
    await ready();
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).webglReleased)).toBe(1);
    // Cancelling during texture preparation must never reopen the movie later.
    await page.goto(url);
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await page.clock.fastForward(500);
    await expect(book).toHaveCount(0);
    // Context loss switches to the moving SVG version, never to a blank screen.
    await page.goto(url);
    await ready();
    await book.evaluate((element: HTMLCanvasElement) =>
      element.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(),
    );
    await expect(page.getByTestId('opening-svg-book')).toBeVisible();
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    // No WebGL support still offers a moving, passable book, with no blank frame.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: any,
        ...args: any[]
      ) {
        if (type === 'webgl' || type === 'webgl2') return null;
        return (original as any).call(this, type, ...args);
      } as any;
    });
    await page.goto(url);
    await expect(page.getByTestId('opening-svg-book')).toBeVisible();
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    // Reduced motion goes directly to the signature and allocates no renderer.
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), {
      ...initial(),
      settings: { ...initial().settings, motion: false },
    });
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto(url);
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await expect(book).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    expect(errors).toEqual([]);
    console.log(
      'Prologue passed: real textured WebGL book, curved sheets, vortex and blossoms, mobile/desktop framing, natural completion and early skip release context, direct cabinet return, context-loss fallback, reduced motion and unchanged initial seed/signature.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
