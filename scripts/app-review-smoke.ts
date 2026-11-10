import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, type Save } from '../src/state/model';
import { discoverPigment } from '../src/state/pigments';
import { mechanicIds } from '../src/engine/mechanics';
import { openScreen } from './navigation-test-helper';
import music from './expansion-music-manifest.json';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    serviceWorkers: 'block',
  });
  const base = process.env.GAME_TEST_URL || 'http://localhost:8162/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript({
    content: `window.reviewAudio = []; window.reviewMusicFiles = new Set();
    const fetchOriginal = window.fetch; window.fetch = function(...args) {
      const url = String(args[0]); if (url.includes('.mp3')) window.reviewMusicFiles.add(url);
      return fetchOriginal.apply(this,args);
    };
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function(...args) {
      const row={loop:this.loop,duration:this.buffer?.duration,ended:false};window.reviewAudio.push(row);
      this.addEventListener('ended',()=>row.ended=true); return start.apply(this,args);
    };`,
  });
  const save: Save = {
    ...initial(),
    started: true,
    guideSeen: true,
    nickname: 'Camille',
    seeds: 130,
    seenMechanics: [...mechanicIds],
  };
  save.settings = { ...save.settings, motion: false, sound: false, music: false, haptics: false };
  for (let id = 1; id <= 1000; id++) {
    save.completed[id] = { stars: 3, date: '2026-11-10T12:00:00Z' };
    save.pigments.push(discoverPigment(id, '2026-11-10T12:00:00Z'));
  }
  const stored = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!) as Save);
  const rootFits = async (width: number) =>
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(base);
    await page.evaluate(() =>
      localStorage.setItem('color-world.save', 'unreadable save — keep original'),
    );
    await page.reload();
    await expect(page.getByRole('alert')).toContainText('Vos données n’ont pas été remplacées');
    await page.getByRole('button', { name: 'Réessayer l’ouverture du carnet' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('color-world.save'))).toBe(
      'unreadable save — keep original',
    );
    // Repair the simulated failing storage; retry must read it, never write initial state over it.
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.getByRole('button', { name: 'Réessayer l’ouverture du carnet' }).click();
    await expect(page.getByTestId('home-screen')).toBeVisible();
    expect(await stored()).toEqual(save);
    expect(errors).toEqual([]);
    for (const [width, height] of [
      [320, 400],
      [412, 915],
      [768, 1024],
      [932, 430],
    ]) {
      await page.setViewportSize({ width, height });
      for (const [route, test] of [
        ['', 'home-screen'],
        ['atelier', 'workshop-screen'],
        ['carte', 'ecosystems-screen'],
        ['herbier', 'herbarium-shelf'],
        ['parametres', 'test-page-tools'],
        ['aide', 'botanical-guide'],
      ]) {
        await page.goto(base + route);
        await expect(page.getByTestId(test)).toBeVisible();
        await rootFits(width);
        if (['home-screen', 'workshop-screen', 'ecosystems-screen'].includes(test))
          expect(
            await page.evaluate(() => document.documentElement.scrollHeight),
          ).toBeLessThanOrEqual(height + 1);
        if (width === 412)
          await page.screenshot({ path: `test-results/review-${route || 'home'}.png` });
      }
      await page.goto(base + 'boutique');
      await expect(page.getByText('La Boutique', { exact: true })).toBeVisible();
      await rootFits(width);
      await page.goto(base + 'carte');
      await page.getByTestId('journey-page-1').click();
      await expect(page.getByTestId('journey-page-dialog')).toBeVisible();
      await expect(page.locator('[aria-label^="Planche de Coquelicot"]')).toHaveAttribute(
        'aria-label',
        /estampillée/,
      );
      const box = (await page.getByTestId('journey-page-dialog').boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(height + 1);
    }
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto(base + 'boutique');
    await page.getByRole('button', { name: 'Acquérir ce papier', exact: true }).first().click();
    expect((await stored()).theme).toBe('sauge');
    expect((await stored()).seeds).toBe(30);
    await page.reload();
    expect((await stored()).owned).toContain('sauge');
    await page.goto(base + 'parametres');
    await page
      .getByRole('textbox', { name: 'Votre pseudo', exact: true })
      .fill('Camille du jardin');
    await page.getByRole('button', { name: 'Modifier ma signature', exact: true }).click();
    expect((await stored()).nickname).toBe('Camille du jardin');
    await page.getByRole('button', { name: 'Connexion Google, bientôt disponible' }).click();
    await expect(page.getByTestId('account-connection-status')).toContainText(
      'ne crée pas de compte en ligne',
    );
    await page.getByRole('switch', { name: 'Musique du livre', exact: true }).click();
    const real = await stored();
    const loops = () =>
      page.evaluate(
        () =>
          (window as any).reviewAudio.filter((r: any) => r.loop && !r.ended) as {
            duration: number;
          }[],
      );
    for (let eco = 0; eco < 20; eco++) {
      if (eco) await openScreen(page, 'Paramètres');
      const id = eco < 5 ? eco * 20 + 1 : 251 + (eco - 5) * 50;
      const startedBefore = await page.evaluate(
        () => (window as any).reviewAudio.filter((r: any) => r.loop).length,
      );
      await page.getByRole('textbox', { name: 'Numéro de la page à tester' }).fill(String(id));
      await page.getByRole('button', { name: 'Tester cette page', exact: true }).click();
      await expect(page.getByTestId('page-folio')).toHaveText(
        `PAGE ${String(id).padStart(2, '0')}`,
      );
      if (eco > 0)
        await expect
          .poll(
            () =>
              page.evaluate(() => (window as any).reviewAudio.filter((r: any) => r.loop).length),
            { timeout: 10000 },
          )
          .toBeGreaterThan(startedBefore);
      const seconds =
        eco < 5 ? [64, 69, 60, 66, 62][eco] : music.find((m) => m.ecosystem === eco)!.seconds;
      await expect.poll(async () => (await loops()).length, { timeout: 10000 }).toBe(1);
      await expect
        .poll(async () => Math.round((await loops())[0]?.duration || 0), { timeout: 10000 })
        .toBe(Math.round(seconds));
    }
    expect(await page.evaluate(() => (window as any).reviewMusicFiles.size)).toBeGreaterThanOrEqual(
      20,
    );
    await openScreen(page, 'Paramètres');
    await page
      .getByRole('button', { name: 'Quitter l’essai et retrouver ma partie', exact: true })
      .click();
    expect(await stored()).toEqual(real);
    expect(errors).toEqual([]);
    console.log(
      'App review passed: recoverable storage read without data loss, seven routes × four formats, complete collection, sealed map thumbnail, theme purchase/reload, nickname, account status, all 20 music recordings and isolated test return.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
