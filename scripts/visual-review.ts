import { openScreen } from './navigation-test-helper';
import { chromium, expect } from '@playwright/test';
import { initial, loadLevel, move, type Save } from '../src/state/model';
import levels from '../src/data/levels.json';
import { mkdirSync } from 'node:fs';
async function main() {
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const url = process.env.GAME_TEST_URL || 'http://localhost:8084/ProjetFourmi/';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  mkdirSync('test-results', { recursive: true });
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Commencer la restauration' }).click();
    await expect(page.getByRole('button', { name: 'Commencer la restauration' })).not.toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/herbarium-unrestored.png', fullPage: true });
    let save: Save = {
      ...initial(),
      started: true,
      settings: { sound: false, haptics: false, patterns: false, motion: false },
    };
    for (const level of levels) {
      save = loadLevel(save, level.id);
      for (const m of level.solution) save = move(save, m.from, m.to);
    }
    save = loadLevel(save, 1);
    await page.evaluate((s) => localStorage.setItem('color-world.save', JSON.stringify(s)), save);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/herbarium-restored.png', fullPage: true });
    await openScreen(page, 'Le Grand Herbier');
    await page.setViewportSize({ width: 1440, height: 3900 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/herbarium-all-20.png', fullPage: true });
    await page
      .getByRole('button', { name: 'Observer Muguet', exact: true })
      .screenshot({ path: 'test-results/plate-muguet.png' });
    await page
      .getByRole('button', { name: 'Observer Gentiane acaule', exact: true })
      .screenshot({ path: 'test-results/plate-gentiane.png' });
    await page
      .getByRole('button', { name: 'Observer Arbousier', exact: true })
      .screenshot({ path: 'test-results/plate-arbousier.png' });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Observer Coquelicot', exact: true }).click();
    await page.getByRole('button', { name: 'Agrandir l’illustration' }).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: 'test-results/herbarium-detail.png', fullPage: true });
    await page.getByRole('button', { name: 'Fermer la planche', exact: true }).click();
    await openScreen(page, 'Écosystèmes');
    await page.getByText(/CHAPITRE 01 · PAGES/).waitFor();
    await page.waitForTimeout(250);
    await page.screenshot({ path: 'test-results/botanical-chapter-frame.png', fullPage: true });
    expect(errors).toEqual([]);
    console.log(
      'Visual review: original and restored plate, twenty species, enlarged detail rendered without browser errors.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
