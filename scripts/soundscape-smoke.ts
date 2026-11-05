import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';
import { openCarnet, openScreen } from './navigation-test-helper';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8104/ProjetFourmi/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const w = window as any;
    w.voices = [];
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (this: AudioNode, target: any, ...args: any[]) {
      if (this instanceof AudioBufferSourceNode && target instanceof GainNode)
        (this as any).testGain = target;
      return (connect as any).call(this, target, ...args);
    } as any;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args: any[]) {
      const item = {
        node: this,
        gain: (this as any).testGain,
        loop: this.loop,
        duration: this.buffer?.duration,
        channels: this.buffer?.numberOfChannels,
        start: performance.now(),
        offset: args[1] || 0,
        ended: false,
      };
      w.voices.push(item);
      this.addEventListener('ended', () => (item.ended = true));
      return (start as any).apply(this, args);
    };
  });
  const voices = () =>
    page.evaluate(() =>
      (window as any).voices.map((v: any) => ({
        loop: v.loop,
        duration: v.duration,
        channels: v.channels,
        start: v.start,
        offset: v.offset,
        ended: v.ended,
        gain: v.gain?.gain.value,
      })),
    );
  const loops = async () => (await voices()).filter((v: any) => v.loop && !v.ended);
  const cueCount = async (duration: number) =>
    (await voices()).filter((v: any) => !v.loop && Math.abs(v.duration - duration) < 0.02).length;
  const seed = async (save: Save) => {
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText(
      `PAGE ${String(save.current).padStart(2, '0')}`,
    );
  };
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
  const transfer = async (from: number, to: number) => {
    await tube(from).click();
    await tube(to).click();
  };
  try {
    await page.goto(url);
    await openCarnet(page);
    const first = { ...initial(), started: true };
    await seed(first);
    // Entry gesture starts music before the first puzzle interaction.
    await expect.poll(async () => (await loops()).length).toBe(1);
    expect(await cueCount(0.72)).toBe(0);
    await tube(0).click();
    await expect.poll(async () => (await loops()).length).toBe(1);
    await expect.poll(async () => (await loops())[0]?.gain).toBeCloseTo(0.08, 2);
    expect((await loops())[0].channels).toBe(2);
    const tapped = await page.evaluate(() => performance.now());
    await tube(2).click();
    await expect
      .poll(async () => (await voices()).filter((v: any) => !v.loop && v.duration < 1.5).length)
      .toBe(1);
    const pour = (await voices()).find((v: any) => !v.loop && v.duration < 1.5)!;
    expect(pour.start - tapped).toBeGreaterThanOrEqual(400);
    expect(pour.duration).toBeCloseTo(0.97, 2);
    expect(pour.gain).toBeCloseTo(0.26, 2);
    await expect.poll(async () => (await loops())[0]?.gain).toBeCloseTo(0.08 * 0.35, 2);
    await expect.poll(async () => (await loops())[0]?.gain, { timeout: 6000 }).toBeCloseTo(0.08, 2);
    expect(await cueCount(0.72)).toBe(0); // Partial pours must not ring.
    // Complete a colour before victory, checking a growing decorative stem.
    await transfer(1, 2);
    await transfer(0, 1);
    await expect(page.getByTestId('completed-vial-bloom')).toBeAttached();
    await expect.poll(() => cueCount(0.72)).toBe(1);
    const glass = (await voices()).find((v: any) => Math.abs(v.duration - 0.72) < 0.01)!;
    expect(glass.gain).toBeCloseTo(0.14, 2);
    const stem = page.getByTestId('vial-bloom-stem');
    const dash = await stem.getAttribute('stroke-dashoffset');
    await expect.poll(() => stem.getAttribute('stroke-dashoffset')).not.toBe(dash);
    await expect
      .poll(async () => Number(await stem.getAttribute('stroke-dashoffset')), { intervals: [40] })
      .toBeLessThan(30);
    mkdirSync('test-results', { recursive: true });
    await page.screenshot({ path: 'test-results/completed-vial-bloom.png' });
    await expect(page.getByTestId('completed-vial-bloom')).toHaveCount(0);
    await expect(tube(0)).toBeEnabled();
    await transfer(0, 2);
    await expect(page.getByTestId('victory-living-paper')).toBeVisible();
    await expect.poll(() => cueCount(0.72)).toBe(2);
    expect(await cueCount(3.2)).toBe(0);
    await page.getByRole('button', { name: 'Révéler la couleur' }).click();
    await expect.poll(() => cueCount(3.2)).toBe(1);
    expect((await voices()).find((v: any) => Math.abs(v.duration - 3.2) < 0.01)!.channels).toBe(2);
    await expect.poll(async () => (await loops())[0]?.gain).toBeCloseTo(0.08 * 0.16, 3);
    await expect.poll(async () => (await loops())[0]?.gain, { timeout: 7000 }).toBeCloseTo(0.08, 2);
    expect(await cueCount(3.2)).toBe(1);
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 02');
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Sons de l’atelier', exact: true }).click();
    await expect.poll(async () => (await loops()).length).toBe(1);
    await page.getByRole('switch', { name: 'Musique du livre', exact: true }).click();
    await expect.poll(async () => (await loops()).length).toBe(0);
    await expect
      .poll(() =>
        page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!).settings.music),
      )
      .toBe(false);
    await page.reload();
    await openCarnet(page);
    await expect(
      page.getByRole('switch', { name: 'Musique du livre', exact: true }),
    ).not.toBeChecked();
    await page.getByRole('switch', { name: 'Musique du livre', exact: true }).click();
    await expect.poll(async () => (await loops()).length).toBe(1);
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('color-world.save')!).settings.sound,
      ),
    ).toBe(false);
    // Backgrounding pauses immediately and resumes the same track at its saved position.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await loops()).length).toBe(0);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await loops()).length).toBe(1);
    expect((await loops())[0].offset).toBeGreaterThan(0);
    // All five unlocked ecosystems choose distinct original recordings, with no accumulating loops.
    let atlas = { ...initial(), started: true };
    for (const level of levels.slice(0, 80)) {
      atlas = loadLevel(atlas, level.id);
      for (const m of level.solution) atlas = move(atlas, m.from, m.to);
    }
    atlas = loadLevel(atlas, 1);
    atlas.settings = {
      ...atlas.settings,
      sound: false,
      music: true,
      motion: false,
      haptics: false,
    };
    await seed(atlas);
    const durations = new Set<number>();
    for (const id of [1, 21, 41, 61, 81, 1]) {
      await openScreen(page, 'Écosystèmes');
      await page.getByRole('button', { name: `Page ${id}`, exact: true }).click();
      await expect(page.getByTestId('page-folio')).toHaveText(
        `PAGE ${String(id).padStart(2, '0')}`,
      );
      const expectedDuration = [64, 69, 60, 66, 62][Math.floor((id - 1) / 20)];
      await expect
        .poll(
          async () => (await loops()).some((v: any) => Math.round(v.duration) === expectedDuration),
          { timeout: 6000 },
        )
        .toBe(true);
      await expect.poll(async () => (await loops()).length, { timeout: 6000 }).toBe(1);
      await expect.poll(async () => (await loops())[0]?.gain).toBeCloseTo(0.08, 2);
      durations.add(Math.round((await loops())[0].duration));
      expect((await voices()).filter((v: any) => v.loop && !v.ended).length).toBeLessThanOrEqual(2);
    }
    expect(durations.size).toBe(5);
    // Reverse an ecosystem change before its fade finishes; no stale pending voice may remain.
    for (const id of [21, 1]) {
      await openScreen(page, 'Écosystèmes');
      await page.getByRole('button', { name: `Page ${id}`, exact: true }).click();
    }
    await expect.poll(async () => (await loops()).length, { timeout: 6000 }).toBe(1);
    await expect
      .poll(async () => Math.round((await loops())[0]?.duration), { timeout: 6000 })
      .toBe(64);
    // Reduced motion still rewards a completed vial, without moving particles or audio.
    const calm = { ...initial(), started: true };
    calm.settings = { ...calm.settings, motion: false, music: false, sound: false, haptics: false };
    await seed(calm);
    await transfer(0, 2);
    await transfer(1, 2);
    await transfer(0, 1);
    await expect(page.getByTestId('completed-vial-seal')).toBeAttached();
    expect(await voices()).toEqual([]);
    // Sound is independent of animations, and moving a full vial must not ring again.
    calm.settings.sound = true;
    await seed(calm);
    await transfer(0, 2);
    await transfer(1, 2);
    await transfer(0, 1);
    await expect.poll(() => cueCount(0.72)).toBe(1);
    await transfer(1, 3);
    await expect(tube(3)).toHaveAttribute(
      'aria-label',
      /vert sauge, vert sauge, vert sauge, vert sauge/,
    );
    expect(await cueCount(0.72)).toBe(1);
    // A hidden game immediately stops a currently ringing vial.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect.poll(async () => (await voices()).filter((v: any) => !v.ended).length).toBe(0);
    expect(errors).toEqual([]);
    console.log(
      'Soundscape passed: gesture-only music, five ecosystems, independent persistent settings, foreground pause/resume, quiet mix/duck/release, flow-timed recorded water, stereo chamber cues, quiet glass exactly once per completed colour (mute/reduced motion/full relocation), growing vial bloom and reduced-motion seal.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
