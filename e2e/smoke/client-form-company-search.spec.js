import { test, expect } from '@playwright/test';
import { seedAuthWithData } from '../helpers/dataMocks.js';

async function openNewClientForm(page) {
  await seedAuthWithData(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/clients', { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  await page.getByRole('button', { name: /novo cliente/i }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Novo Cliente' })).toBeVisible({
    timeout: 10_000,
  });
}

test('CompanySearchInput lista empresa global e preenche o formulário', async ({ page }) => {
  await openNewClientForm(page);

  const dialog = page.getByRole('dialog');
  await dialog.getByPlaceholder('Nome da empresa…').fill('R1');
  await dialog.getByPlaceholder('Nome da empresa…').press('Enter');

  await expect(dialog.getByText('Já cadastradas no Backstage Pro')).toBeVisible({ timeout: 10_000 });
  await dialog.getByText('R1 Audiovisual', { exact: true }).first().click();

  await expect(dialog.getByText('R1 Audiovisual').first()).toBeVisible();
  await expect(dialog.locator('#name')).toHaveValue('R1 Audiovisual');
});
