import { chromium, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { initial, move } from '../src/state/model';
import levels from '../src/data/levels.json';
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
  const tube = (n: number) => page.getByRole('button', { name: new RegExp(`^Flacon ${n + 1},`) });
  const observe = async (selector: string) =>
    page.evaluate((selector) => {
      (window as any).geometryChanges = 0;
      (window as any).effectObserver?.disconnect();
      const observer = new MutationObserver((records) => {
        (window as any).geometryChanges += records.filter(
          (record) => record.target instanceof SVGElement,
        ).length;
      });
      (window as any).effectObserver = observer;
      observer.observe(document.querySelector(selector)!, { subtree: true, attributes: true });
    }, selector);
  try {
    mkdirSync('test-results', { recursive: true });
    let save = { ...initial(), started: true, nickname: 'Camille' };
    for (const step of levels[0].solution.slice(0, 2)) save = move(save, step.from, step.to);
    save.settings = { ...save.settings, music: false, sound: false, haptics: false };
    await page.addInitScript(
      (save) => localStorage.setItem('color-world.save', JSON.stringify(save)),
      save,
    );
    await page.goto(url);
    await openCarnet(page);
    // Complete a first vial, then immediately begin the final pour while its bloom is alive.
    await tube(0).click();
    await tube(1).click();
    await expect(page.getByTestId('completed-vial-bloom')).toBeVisible();
    await expect(page.getByTestId('liquid-board-pouring')).toHaveCount(0);
    await page.getByRole('button', { name: 'Faire fleurir le titre', exact: true }).click();
    await tube(0).click();
    await tube(2).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(page.getByTestId('completed-vial-bloom')).toBeVisible();
    await observe('[data-testid="completed-vial-bloom"]');
    const bloom = page.getByTestId('vial-bloom-growth');
    const first = await bloom.evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(220);
    expect(await page.evaluate(() => (window as any).geometryChanges)).toBe(0);
    expect(await bloom.evaluate((node) => getComputedStyle(node).transform)).not.toBe(first);
    const jet = await page.locator('#pouring-vessel').getAttribute('transform');
    await page.waitForTimeout(100);
    expect(await page.locator('#pouring-vessel').getAttribute('transform')).not.toBe(jet);
    await page.screenshot({ path: 'test-results/overlap-pour-bloom.png' });
    // The result covers play: no hidden vial animation keeps rendering behind its stars.
    await expect(page.getByTestId('victory-living-paper')).toBeVisible();
    await expect(page.getByTestId('completed-vial-bloom')).toHaveCount(0);
    await expect(page.getByTestId('reward-stars-animating')).toBeAttached();
    await expect(page.getByTestId('victory-vines-growing')).toBeAttached();
    await observe('[data-testid="victory-living-paper"]');
    const vine = page.getByTestId('victory-vine-growth').first();
    const vineStart = await vine.evaluate((node) => getComputedStyle(node).transform);
    await page.waitForTimeout(450);
    expect(await page.evaluate(() => (window as any).geometryChanges)).toBe(0);
    expect(await vine.evaluate((node) => getComputedStyle(node).transform)).not.toBe(vineStart);
    await page.screenshot({ path: 'test-results/overlap-stars-vines.png' });
    await expect(page.getByTestId('reward-stars-settled')).toBeAttached();
    await expect(page.getByTestId('victory-vines-settled')).toBeAttached();
    const result = await page.evaluate(() => JSON.parse(localStorage.getItem('color-world.save')!));
    expect(result.moves).toBe(4);
    expect(result.completed['1'].stars).toBe(3);
    expect(result.seeds).toBe(save.seeds + 1);
    await page.getByRole('button', { name: 'Passer l’animation', exact: true }).click();
    await page.getByRole('button', { name: 'Poursuivre la restauration', exact: true }).click();
    await expect(page.getByTestId('page-folio')).toHaveText('PAGE 02');
    await expect(page.getByTestId('book-page-turn')).toHaveCount(0);
    const next = levels[1].solution[0];
    await tube(next.from).click();
    await tube(next.to).click();
    await expect(page.getByTestId('liquid-board-pouring')).toBeVisible();
    await expect(page.getByTestId('liquid-board-pouring')).toHaveCount(0);
    expect(errors).toEqual([]);
    console.log(
      'Overlap passed: live bloom + title + moving liquid, then live stars + vines without SVG attribute updates; covered bloom is removed, one reward/seed, page transition and controls still work.',
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
