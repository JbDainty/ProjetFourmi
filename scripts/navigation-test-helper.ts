import { expect, type Page } from '@playwright/test';

export async function openScreen(page: Page, name: string) {
  await page.getByRole('button', { name: 'Ouvrir le carnet', exact: true }).click();
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByTestId('game-carnet-menu')).toHaveCount(0);
}
