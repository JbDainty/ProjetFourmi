import type { Page } from '@playwright/test';

/** Legacy gameplay checks explicitly accept the new seed-cost confirmation. */
export async function requestHint(page: Page) {
  await page.getByRole('button', { name: 'Indice', exact: true }).click();
  if (await page.getByTestId('workshop-confirm').isVisible())
    await page.getByRole('button', { name: 'Utiliser une graine', exact: true }).click();
}
