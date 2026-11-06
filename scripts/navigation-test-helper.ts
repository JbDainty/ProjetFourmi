import { expect, type Page } from '@playwright/test';

export async function openScreen(page: Page, name: string) {
  await page.getByRole('button', { name: 'Ouvrir le carnet', exact: true }).click();
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByTestId('game-carnet-menu')).toHaveCount(0);
}

/** Enter through the real book gate, keeping audio activation separate from puzzle moves. */
export async function openCarnet(page: Page, nickname = 'Camille') {
  const returning = page.getByRole('button', { name: 'Rouvrir mon herbier', exact: true });
  const skip = page.getByRole('button', { name: 'Passer le prologue', exact: true });
  const signature = page
    .getByTestId('book-signature-page')
    .getByRole('textbox', { name: 'Votre pseudo', exact: true });
  await expect(returning.or(skip).or(signature)).toBeVisible();
  if (await returning.isVisible()) await returning.click();
  else {
    if (await skip.isVisible()) await skip.click();
    await signature.fill(nickname);
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
  }
  await expect(page.getByTestId('book-signature-page')).toHaveCount(0);
  const guide = page.getByTestId('botanical-guide');
  if (await guide.isVisible()) {
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(guide).toHaveCount(0);
  }
}
