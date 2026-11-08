import { chromium, expect } from '@playwright/test';
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
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    serviceWorkers: 'block',
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8110/';
  await page.addInitScript(() => {
    const state = window as any;
    state.scoreVoices = [];
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (target: any, ...rest: any[]) {
      if (this instanceof AudioBufferSourceNode && target instanceof GainNode)
        (this as any).scoreGain = target;
      return (connect as any).call(this, target, ...rest);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: any[]) {
      const row = {
        duration: this.buffer?.duration,
        gain: (this as any).scoreGain?.gain.value,
        offset: args[1] || 0,
        loop: this.loop,
        stopped: false,
      };
      (this as any).scoreRow = row;
      state.scoreVoices.push(row);
      return (start as any).apply(this, args);
    };
    const stop = AudioBufferSourceNode.prototype.stop;
    AudioBufferSourceNode.prototype.stop = function (...args: any[]) {
      if ((this as any).scoreRow) (this as any).scoreRow.stopped = true;
      return (stop as any).apply(this, args);
    };
  });
  const scores = () =>
    page.evaluate(() =>
      (window as any).scoreVoices.filter(
        (voice: any) => voice.duration > 14.7 && voice.duration < 15,
      ),
    );
  const seed = async (music: boolean, motion = true) => {
    await page.evaluate((save) => localStorage.setItem('color-world.save', JSON.stringify(save)), {
      ...initial(),
      settings: { ...initial().settings, music, motion, sound: false },
    });
    await page.goto(url);
  };
  try {
    await page.goto(url);
    await seed(true);
    await expect
      .poll(
        () =>
          page
            .getByTestId('opening-cinematic-video')
            .locator('video')
            .evaluate((v: HTMLVideoElement) => v.readyState),
        { timeout: 15000 },
      )
      .toBeGreaterThanOrEqual(2);
    await page.waitForTimeout(150);
    const wake = page.getByRole('button', { name: 'Éveiller la musique de l’introduction' });
    if (await wake.isVisible()) await wake.click();
    await expect.poll(async () => (await scores()).length).toBe(1);
    expect((await scores())[0].gain).toBeCloseTo(0.2);
    expect((await scores())[0].loop).toBe(false);
    await page.getByRole('button', { name: 'Couper la musique de l’introduction' }).click();
    await expect.poll(async () => (await scores())[0].stopped).toBe(true);
    await page.waitForTimeout(250);
    await page.getByRole('button', { name: 'Activer la musique de l’introduction' }).click();
    await expect.poll(async () => (await scores()).length).toBe(2);
    expect((await scores())[1].offset).toBeGreaterThan((await scores())[0].offset);

    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await scores()).every((voice: any) => voice.stopped)).toBe(true);
    const held = await page
      .getByTestId('opening-cinematic-video')
      .locator('video')
      .evaluate((v: HTMLVideoElement) => v.currentTime / 14.8);
    await page.waitForTimeout(250);
    expect(
      await page
        .getByTestId('opening-cinematic-video')
        .locator('video')
        .evaluate((v: HTMLVideoElement) => v.currentTime / 14.8),
    ).toBeCloseTo(held, 2);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    // A decoder may buffer after returning, legitimately pausing/restarting audio.
    // Verify exclusivity and the resume position instead of counting buffer events.
    await expect
      .poll(async () => (await scores()).filter((voice: any) => !voice.stopped).length)
      .toBe(1);
    const resumed = await scores();
    expect(resumed.length).toBeGreaterThanOrEqual(3);
    expect(resumed.slice(0, -1).every((voice: any) => voice.stopped)).toBe(true);
    expect(Math.abs(resumed[2].offset - held * 14.8)).toBeLessThan(0.4);
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await expect.poll(async () => (await scores()).every((voice: any) => voice.stopped)).toBe(true);
    await page.getByRole('textbox', { name: 'Votre pseudo' }).fill('Camille');
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).scoreVoices.filter((voice: any) => voice.loop && !voice.stopped).length,
        ),
      )
      .toBe(1);
    await page.getByTestId('home-restore-action').getByRole('button').click();
    await expect(page.getByTestId('botanical-guide')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).scoreVoices.filter((voice: any) => voice.loop && !voice.stopped).length,
        ),
      )
      .toBe(0);
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as any).scoreVoices.filter((voice: any) => voice.loop && !voice.stopped).length,
        ),
      )
      .toBe(1);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).moves),
    ).toBe(0);

    await page.goto(url);
    await expect(page.getByTestId('home-screen')).toBeVisible();
    expect(await scores()).toEqual([]);
    const saved = await page.evaluate(() => localStorage.getItem('color-world.save'));
    await page.getByRole('button', { name: 'Revoir le prologue' }).click();
    await expect.poll(async () => (await scores()).length, { timeout: 20000 }).toBe(1);
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(saved);

    await seed(false);
    await expect
      .poll(
        () =>
          page
            .getByTestId('opening-cinematic-video')
            .locator('video')
            .evaluate((v: HTMLVideoElement) => v.readyState),
        { timeout: 15000 },
      )
      .toBeGreaterThanOrEqual(2);
    await page.waitForTimeout(250);
    expect(await scores()).toEqual([]);
    await page.getByRole('button', { name: 'Passer le prologue' }).click();
    await seed(true, false);
    await expect(page.getByTestId('book-signature-page')).toBeVisible();
    await expect(page.getByTestId('book-opening-film')).toHaveCount(0);
    expect(await scores()).toEqual([]);
    expect(errors).toEqual([]);
    console.log(
      'Intro score: actual 14.8s decoded playback, music independent of sound, low volume, mute/unmute seeks, background pause/resume, skip, returning replay, unchanged save, transition to ecosystem music and reduced motion passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
