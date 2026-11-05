import { openScreen } from './navigation-test-helper';
import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import levels from '../src/data/levels.json';
import { initial, loadLevel, move, Save } from '../src/state/model';
import { solve } from '../src/engine/puzzle';
const testUrl = (process.env.GAME_TEST_URL || 'http://localhost:8081/').replace(/\/?$/, '/');
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    proxy: process.env.GAME_TEST_PROXY ? { server: process.env.GAME_TEST_PROXY } : undefined,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(testUrl);
    await page.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(page.getByRole('button', { name: 'Commencer la restauration' })).not.toBeVisible();
    await page.screenshot({ path: 'test-results/atelier-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Indice', exact: true }).click();
    await expect(page.getByTestId('hint-writing-text')).toHaveText(
      `Versez le flacon ${levels[0].solution[0].from + 1} dans le flacon ${levels[0].solution[0].to + 1}.`,
    );
    for (const [step, m] of levels[0].solution.entries()) {
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
      await page.waitForTimeout(550);
      if (step === levels[0].solution.length - 2) {
        await expect(page.getByTestId('liquid-board-idle')).toBeVisible();
        const partial = await page.evaluate(() =>
          JSON.parse(localStorage.getItem('color-world.save')!),
        );
        expect(partial.board.every((tube: number[]) => tube.every((c) => c === tube[0]))).toBe(
          true,
        );
        expect(partial.board.some((tube: number[]) => tube.length > 0 && tube.length < 4)).toBe(
          true,
        );
        expect(partial.completed['1']).toBeUndefined();
        expect(partial.pigments).toHaveLength(0);
        await expect(page.getByText('VOTRE HERBIER REPREND VIE')).not.toBeVisible();
        await page.getByRole('button', { name: 'Indice', exact: true }).click();
        const consolidation = solve(partial.board)![0];
        await expect(page.getByTestId('hint-writing-text')).toHaveText(
          `Versez le flacon ${consolidation.from + 1} dans le flacon ${consolidation.to + 1}.`,
        );
      }
    }
    await expect(page.getByText('VOTRE HERBIER REPREND VIE')).toBeVisible();
    await expect(page.getByTestId('page-result-moves')).toContainText(
      `${levels[0].solution.length} mouvements`,
    );
    await page.getByRole('button', { name: /Révéler la couleur/ }).click();
    await page.waitForTimeout(1450);
    await page.screenshot({ path: 'test-results/pigment.png', fullPage: true });
    await page.getByRole('button', { name: /Poursuivre la restauration/ }).click();
    await expect(page.getByText('PAGE 02')).toBeVisible();
    await page.reload();
    await expect(page.getByText('PAGE 02')).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    expect(saved.pigments.length).toBe(1);
    expect(saved.completed['1'].stars).toBe(3);
    await openScreen(page, 'Le Grand Herbier');
    await page.getByRole('button', { name: 'Observer Coquelicot', exact: true }).click();
    await expect(page.getByText('PLANCHE 01 · Papaveraceae', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/herbier.png', fullPage: true });
    await page.getByRole('button', { name: 'Fermer la planche', exact: true }).click();
    await openScreen(page, 'Paramètres');
    await page.getByRole('switch', { name: 'Symboles dans les liquides' }).click();
    await openScreen(page, 'L’Atelier');
    await expect(page.getByText('✦', { exact: true }).first()).toBeVisible();
    // Seed the result of legitimately solving levels 1–99, then play the final level through the UI.
    let end: Save = {
      ...initial(),
      started: true,
      settings: { sound: false, haptics: false, patterns: false, motion: false },
    };
    for (const level of levels.slice(0, 99)) {
      end = loadLevel(end, level.id);
      for (const m of level.solution) end = move(end, m.from, m.to);
    }
    end = loadLevel(end, 100);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), end);
    await page.reload();
    for (const m of levels[99].solution) {
      const visible = await page.getByText('L’HERBIER RETROUVE SES COULEURS').isVisible();
      if (visible) break;
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.from + 1},`) }).click();
      await page.getByRole('button', { name: new RegExp(`^Flacon ${m.to + 1},`) }).click();
      await page.waitForTimeout(30);
    }
    await expect(page.getByText('Votre collection est complète.')).toBeVisible();
    await page.getByRole('button', { name: 'Passer l’animation' }).click();
    await page.getByRole('button', { name: 'Contempler mon herbier' }).click();
    await expect(page.getByText('20 / 20 PLANCHES RESTAURÉES')).toBeVisible();
    await page.reload();
    await openScreen(page, 'Le Grand Herbier');
    await expect(page.getByText('20 / 20 PLANCHES RESTAURÉES')).toBeVisible();
    // The service worker caches a complete installed export, not just the visited screen.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await context.setOffline(true);
    await page.goto(testUrl);
    await expect(page.getByText('PAGE 100')).toBeVisible();
    await context.setOffline(false);
    const mobile = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      }),
      mp = await mobile.newPage();
    mp.on('pageerror', (e) => errors.push(e.message));
    await mp.goto(testUrl);
    await mp.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(mp.getByRole('button', { name: 'Commencer la restauration' })).not.toBeVisible();
    await expect(mp.getByRole('button', { name: 'Indice', exact: true })).toBeInViewport();
    await mp.screenshot({ path: 'test-results/atelier-mobile.png', fullPage: true });
    expect(await mp.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await openScreen(mp, 'La Boutique');
    await mp.getByRole('button', { name: 'Recueillir les graines' }).click();
    await expect(mp.getByRole('button', { name: 'À demain' })).toBeDisabled();
    expect(errors).toEqual([]);
    console.log(
      'Browser: tutorial, valid hint, pour, reward, persistence, herbarium, accessibility, level 100, offline, mobile and daily reward passed.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
