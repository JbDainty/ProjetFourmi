import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial } from '../src/state/model';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader',
      '--use-gl=angle',
    ],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8120/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const seed = async (motion = true, started = false) => {
    const save = {
      ...initial(),
      started,
      nickname: started ? 'Camille' : '',
      settings: { ...initial().settings, motion, music: false, sound: false, haptics: false },
    };
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
  };
  const video = () => page.getByTestId('opening-cinematic-video').locator('video');
  const visibility = (hidden: boolean) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: hidden ? 'hidden' : 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await seed();
    await expect
      .poll(() => video().evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 })
      .toBeGreaterThan(0.35);
    expect(
      await video().evaluate((v: HTMLVideoElement) => ({
        muted: v.muted,
        controls: v.controls,
        inline: v.playsInline,
        width: v.videoWidth,
        height: v.videoHeight,
      })),
    ).toEqual({ muted: true, controls: false, inline: true, width: 720, height: 1280 });
    await expect(page.getByTestId('opening-cinematic-poster')).toHaveCount(0);
    await expect(page.getByTestId('opening-webgl-book')).toHaveCount(0);
    await page.screenshot({ path: 'test-results/cinematic-film-playing.png' });
    await visibility(true);
    await expect.poll(() => video().evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
    const held = await video().evaluate((v: HTMLVideoElement) => v.currentTime);
    await page.waitForTimeout(400);
    expect(await video().evaluate((v: HTMLVideoElement) => v.currentTime)).toBeCloseTo(held, 1);
    await visibility(false);
    await expect
      .poll(() => video().evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(held + 0.2);
    const src = await video().evaluate((v: HTMLVideoElement) => v.currentSrc);
    // Cached movie byte ranges remain usable in an offline browser, including Safari-style suffixes.
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    await page.context().setOffline(true);
    const range = await page.evaluate(async (src) => {
      const r = await fetch(src, { headers: { Range: 'bytes=10-49' } });
      return {
        status: r.status,
        bytes: (await r.arrayBuffer()).byteLength,
        header: r.headers.get('Content-Range'),
      };
    }, src);
    expect(range.status).toBe(206);
    expect(range.bytes).toBe(40);
    expect(range.header).toMatch(/^bytes 10-49\//);
    await expect(page.getByTestId('book-signature-page')).toBeVisible({ timeout: 20000 });
    await expect(page.getByTestId('opening-cinematic-video')).toHaveCount(0);
    await page.getByRole('textbox', { name: 'Votre pseudo' }).fill('Camille');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 01');
    await page.context().setOffline(false);
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Rouvrir mon herbier', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('opening-cinematic-video')).toHaveCount(0);
    const saved = await page.evaluate(() => localStorage.getItem('color-world.save'));
    await page.getByRole('button', { name: 'Revoir le prologue' }).click();
    await expect
      .poll(() => video().evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 15000 })
      .toBeGreaterThan(0.2);
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saved);
    await seed(false);
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await expect(page.locator('video')).toHaveCount(0);
    // A failed media load uses the previous real-time scene rather than blocking the signature.
    const failed = await browser.newContext({
      serviceWorkers: 'block',
      viewport: { width: 320, height: 568 },
    });
    await failed.route('**/*.mp4', (r) => r.abort());
    const fallback = await failed.newPage();
    fallback.on('pageerror', (e) => errors.push(e.message));
    await fallback.goto(url);
    await expect(fallback.getByTestId('opening-webgl-book')).toBeAttached({ timeout: 20000 });
    await fallback.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(fallback.getByTestId('book-signature-page')).toBeVisible();
    await failed.close();
    expect(errors).toEqual([]);
    console.log(
      'Cinematic passed: actual inline muted 720×1280 video, no GL on the normal path, background pause/resume, offline cached byte ranges, natural ending/signature, replay with preserved save, skip, reduced motion and failed-media fallback.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
