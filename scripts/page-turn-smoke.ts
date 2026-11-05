import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, loadLevel, move } from '../src/state/model';
import levels from '../src/data/levels.json';
import { species } from '../src/data/botany';
import { openCarnet, openScreen } from './navigation-test-helper';

function beforeWin(id: number, motion: boolean, sound: boolean) {
  let save = { ...initial(), started: true };
  for (const level of levels.slice(0, id - 1)) {
    save = loadLevel(save, level.id);
    for (const m of level.solution) save = move(save, m.from, m.to);
  }
  save = loadLevel(save, id);
  for (const m of levels[id - 1].solution.slice(0, -1)) save = move(save, m.from, m.to);
  save.settings = { ...save.settings, motion, sound, music: false, haptics: false };
  return save;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8081/';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  mkdirSync('test-results', { recursive: true });
  await page.addInitScript({
    content: `
    window.pageCues = [];
    const connect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function(target, ...args) {
      if (this instanceof AudioBufferSourceNode && target instanceof GainNode) this.cueGain = target;
      return connect.call(this, target, ...args);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) {
      window.pageCues.push({ duration: this.buffer?.duration, gain: this.cueGain?.gain.value });
      return start.apply(this, args);
    };
  `,
  });
  const cues = () =>
    page.evaluate(() =>
      (window as unknown as { pageCues: { duration: number; gain: number }[] }).pageCues.filter(
        (cue) => Math.abs(cue.duration - 1.15) < 0.01 || Math.abs(cue.duration - 1.85) < 0.01,
      ),
    );
  const seed = async (id: number, motion: boolean, sound: boolean) => {
    await page.evaluate(
      (s) => localStorage.setItem('color-world.save', JSON.stringify(s)),
      beforeWin(id, motion, sound),
    );
    await page.goto(url);
    await openCarnet(page);
    await expect(page.getByTestId('page-folio')).toHaveText(`PAGE ${String(id).padStart(2, '0')}`);
  };
  const finish = async (id: number) => {
    const last = levels[id - 1].solution.at(-1)!;
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.from + 1},`) }).click();
    await page.getByRole('button', { name: new RegExp(`^Flacon ${last.to + 1},`) }).click();
    await expect(page.getByTestId('victory-living-paper')).toBeVisible();
    expect(await cues()).toEqual([]);
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
  };
  const scenario = async (id: number, motion: boolean, sound: boolean) => {
    await seed(id, motion, sound);
    await finish(id);
    const before = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    const multiple = id % 5 === 0;
    await page.getByRole('button', { name: 'Poursuivre la restauration' }).click();
    if (motion) {
      await expect(
        page.getByTestId(multiple ? 'book-species-riffle' : 'book-single-turn'),
      ).toBeVisible();
      await expect(page.getByTestId('book-turning-sheet')).toHaveCount(multiple ? 5 : 1);
      if (multiple) {
        const target = species[Math.floor(id / 5)];
        await expect(page.getByTestId('book-destination-species')).toHaveText(target.name);
        await expect
          .poll(() =>
            page
              .getByTestId('book-page-curl')
              .evaluateAll((nodes) => new Set(nodes.map((n) => n.getAttribute('d'))).size),
          )
          .toBeGreaterThan(2);
        await page.screenshot({ path: `test-results/riffle-page-${id}-in-flight.png` });
        await expect
          .poll(
            () =>
              page
                .getByTestId('book-turning-sheet')
                .evaluateAll(
                  (nodes) =>
                    nodes.length === 5 && nodes.every((n) => getComputedStyle(n).opacity === '0'),
                ),
            { intervals: [40], timeout: 3000 },
          )
          .toBe(true);
        await expect(page.getByTestId('book-source-plate')).not.toBeInViewport();
        await page.screenshot({ path: `test-results/riffle-page-${id}-destination.png` });
      } else {
        await expect(page.getByTestId('book-destination-species')).toHaveCount(0);
        await expect(page.getByTestId('book-source-species')).toHaveText(
          species[Math.floor((id - 1) / 5)].name,
        );
        await page.screenshot({ path: 'test-results/single-page-paper.png' });
      }
      await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    } else await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    await expect(page.getByTestId('page-folio')).toHaveText(
      `PAGE ${String(id + 1).padStart(2, '0')}`,
    );
    await expect(page.getByTestId('current-species-heading')).toHaveText(
      species[Math.floor(id / 5)].name,
    );
    const after = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    expect(after.current).toBe(id + 1);
    expect(after.moves).toBe(0);
    expect(after.history).toEqual([]);
    expect(after.board).toEqual(levels[id].board);
    expect(after.completed).toEqual(before.completed);
    expect(after.seeds).toBe(before.seeds);
    expect(after.pigments).toEqual(before.pigments);
    if (sound) {
      await expect.poll(async () => (await cues()).length).toBe(1);
      const cue = (await cues())[0];
      expect(cue.duration).toBeCloseTo(multiple ? 1.85 : 1.15, 2);
      expect(cue.gain).toBeCloseTo(0.2, 2);
    } else expect(await cues()).toEqual([]);
  };
  try {
    await page.goto(url);
    await openCarnet(page);
    await scenario(4, true, true); // Same specimen: one sheet and one quiet cue.
    await scenario(5, true, true); // Coquelicot -> Bleuet, uncoloured destination.
    await page.setViewportSize({ width: 320, height: 740 });
    await scenario(20, true, true); // Chapter boundary: a different atlas and specimen.
    await scenario(5, true, false); // Visual riffle is independent of mute.
    await scenario(5, false, true); // Instant transition still uses the multi-page sound.
    await scenario(4, false, true); // Instant transition still uses the single-page sound.
    // Returning to an already restored specimen also lands on its correct plate.
    await seed(6, true, true);
    await openScreen(page, 'Écosystèmes');
    await page.getByRole('button', { name: 'Page 2', exact: true }).click();
    await expect(page.getByTestId('book-species-riffle')).toBeVisible();
    await expect(page.getByTestId('book-destination-species')).toHaveText('Coquelicot');
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 02');
    await expect.poll(async () => (await cues()).length).toBe(1);
    expect((await cues())[0].duration).toBeCloseTo(1.85, 2);
    expect(errors).toEqual([]);
    console.log(
      'Page turns passed: one sheet within a plant, five staggered sheets on new species/chapter and restored map jumps; correct destination name/plate, one atomic level load, original 1.15s/1.85s quiet WebAudio cues, mute and independent reduced motion, 320px layout and unchanged rewards.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
