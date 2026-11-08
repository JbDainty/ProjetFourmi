import { expect, type Page } from '@playwright/test';

export async function openScreen(page: Page, name: string) {
  await page.getByRole('button', { name: 'Ouvrir le carnet', exact: true }).click();
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByTestId('game-carnet-menu')).toHaveCount(0);
}

/** Enter from the cabinet, signing a new carnet and reading its first guide when needed. */
export async function openCarnet(page: Page, nickname = 'Camille') {
  const home = page.getByTestId('home-screen');
  const playing = page.getByTestId('page-folio');
  const skip = page.getByRole('button', { name: 'Passer le prologue', exact: true });
  const signature = page
    .getByTestId('book-signature-page')
    .getByRole('textbox', { name: 'Votre pseudo', exact: true });
  await expect(home.or(playing).or(skip).or(signature)).toBeVisible();
  if (!(await home.isVisible()) && !(await playing.isVisible())) {
    if (await skip.isVisible()) await skip.click();
    await signature.fill(nickname);
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
  }
  await expect(page.getByTestId('book-signature-page')).toHaveCount(0);
  if (await home.isVisible())
    await page.getByTestId('home-restore-action').getByRole('button').click();
  await expect(page.getByTestId('botanical-guide').or(playing)).toBeVisible();
  const guide = page.getByTestId('botanical-guide');
  if (await guide.isVisible()) {
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(guide).toHaveCount(0);
  }
  await expect(playing).toBeVisible();
}
