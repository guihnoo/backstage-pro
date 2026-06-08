import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

test('perfil carrega com secoes editaveis', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });

  await expect(page.getByText('Dados Pessoais')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Área de Atuação')).toBeVisible();
  await expect(page.getByText('Metas & Precificação')).toBeVisible();
});
