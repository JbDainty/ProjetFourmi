import { chromium, expect } from '@playwright/test';
import { initial } from '../src/state/model';
import { openCarnet } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 393, height: 851 }, hasTouch: true });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const url = process.env.GAME_TEST_URL || 'http://localhost:8110/';
  await page.addInitScript({
    content: `
    window.audioRuns = [];
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(target, ...args) {
      if (this instanceof AudioBufferSourceNode && target instanceof GainNode) this.testGain = target;
      return connect.call(this, target, ...args);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) {
      const row = { loop: this.loop, duration: this.buffer?.duration, offset: args[1] || 0, gain: this.testGain, ended: false };
      window.audioRuns.push(row);
      this.addEventListener('ended', () => row.ended = true);
      return start.apply(this, args);
    };
  `,
  });
  const runs = () =>
    page.evaluate(
      () =>
        (window as any).audioRuns.map((row: any) => ({
          loop: row.loop,
          ended: row.ended,
          gain: row.gain?.gain.value,
          duration: row.duration,
          offset: row.offset,
        })) as { loop: boolean; ended: boolean; gain: number; duration: number; offset: number }[],
    );
  const background = async (hidden: boolean) =>
    page.evaluate((hidden) => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: hidden ? 'hidden' : 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  const activeLoops = async () => (await runs()).filter((row) => row.loop && !row.ended);
  const activeCues = async () => (await runs()).filter((row) => !row.loop && !row.ended);
  const reset = () => page.getByRole('button', { name: 'Recommencer', exact: true }).click();
  const pour = async () => {
    await page.getByRole('button', { name: /^Flacon 1,/ }).click();
    await page.getByRole('button', { name: /^Flacon 3,/ }).click();
  };
  try {
    const save = { ...initial(), started: true, nickname: 'Camille' };
    save.settings.haptics = false;
    await page.addInitScript((save) => {
      if (!localStorage.getItem('color-world.save'))
        localStorage.setItem('color-world.save', JSON.stringify(save));
    }, save);
    await page.goto(url);
    await openCarnet(page);
    await expect.poll(async () => (await activeLoops()).length).toBe(1);
    for (let cycle = 0; cycle < 6; cycle++) {
      await pour();
      if (cycle % 2 === 0) await expect.poll(async () => (await activeCues()).length).toBe(1);
      // Odd cycles leave before the 450ms pour cue, then return before its timer fires.
      const cueCount = (await runs()).filter((row) => !row.loop).length;
      await background(true);
      await expect.poll(async () => (await activeLoops()).length).toBe(0);
      await expect.poll(async () => (await activeCues()).length).toBe(0);
      await background(false);
      await expect.poll(async () => (await activeLoops()).length).toBe(1);
      await page.waitForTimeout(650);
      expect((await runs()).filter((row) => !row.loop).length).toBe(cueCount);
      expect(await activeCues()).toHaveLength(0);
      await expect(page.getByTestId('liquid-board-pouring')).toHaveCount(0);
      await expect.poll(async () => (await activeLoops())[0]?.gain).toBeCloseTo(0.08, 2);
      expect((await activeLoops())[0].offset).toBeGreaterThan(0);
      await reset();
    }
    // A fresh, audible cue still starts after the repeated returns and restores the mix.
    await pour();
    await expect.poll(async () => (await activeCues()).length).toBe(1);
    await expect.poll(async () => (await activeLoops())[0].gain).toBeCloseTo(0.08 * 0.35, 2);
    await expect.poll(async () => (await activeCues()).length).toBe(0);
    await expect
      .poll(async () => (await activeLoops())[0].gain, { timeout: 6000 })
      .toBeCloseTo(0.08, 2);
    expect(errors).toEqual([]);
    console.log(
      'Audio resume: six real WebAudio exits/returns during active or delayed pours, one resumed music voice, no late cues or stuck duck, and fresh sound/mix recovery without reload passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
