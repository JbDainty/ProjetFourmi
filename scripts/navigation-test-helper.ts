import { expect, type Page } from '@playwright/test';

export async function openHome(page: Page) {
  const home = page.getByTestId('home-screen');
  if (!(await home.isVisible()))
    await page.getByRole('button', { name: 'Menu principal', exact: true }).click();
  await expect(home).toBeVisible();
}

export async function openScreen(page: Page, name: string) {
  await openHome(page);
  if (name === 'Accueil') return;
  if (name === 'L’Atelier') return openCarnet(page);
  const label =
    name === 'Le Grand Herbier' ? 'Herbier' : name === 'La Boutique' ? 'Boutique' : name;
  await page.getByRole('link', { name: label, exact: true }).click();
  await expect(page.getByTestId('home-screen')).toHaveCount(0);
}

/** Enter from the cabinet, signing a new carnet and reading its first guide when needed. */
export async function openCarnet(page: Page, nickname = 'Camille') {
  const home = page.getByTestId('home-screen');
  const playing = page.getByTestId('page-folio');
  const guide = page.getByTestId('botanical-guide');
  const skip = page.getByRole('button', { name: 'Passer le prologue', exact: true });
  const signature = page
    .getByTestId('book-signature-page')
    .getByRole('textbox', { name: 'Votre pseudo', exact: true });
  await expect(home.or(playing).or(guide).or(skip).or(signature)).toBeVisible();
  if (!(await home.isVisible()) && !(await playing.isVisible()) && !(await guide.isVisible())) {
    if (await skip.isVisible()) await skip.click();
    await signature.fill(nickname);
    await page.getByRole('button', { name: 'Créer mon carnet', exact: true }).click();
  }
  await expect(page.getByTestId('book-signature-page')).toHaveCount(0);
  if (await home.isVisible())
    await page.getByTestId('home-restore-action').getByRole('button').click();
  await expect(page.getByTestId('botanical-guide').or(playing)).toBeVisible();
  if (await guide.isVisible()) {
    await page.getByRole('button', { name: 'Aller directement au jeu', exact: true }).click();
    await expect(guide).toHaveCount(0);
  }
  await expect(playing).toBeVisible();
}
