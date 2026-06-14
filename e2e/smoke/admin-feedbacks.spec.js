import { test, expect } from '@playwright/test';
import { seedOwnerAuth } from '../helpers/fakeAuth.js';
import { installFeedbackMocks } from '../helpers/fakeFeedback.js';

test('owner acessa inbox de feedback no Perfil e na rota admin', async ({ page }) => {
  await installFeedbackMocks(page);
  await seedOwnerAuth(page);

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('main').getByRole('link', { name: /inbox de feedback/i })).toBeVisible();

  await page.goto('/admin/feedbacks', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /inbox de feedback/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/botão de salvar não responde/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/modo escuro automático/i)).toBeVisible({ timeout: 15_000 });
});

test('usuário comum não vê inbox de feedback', async ({ page }) => {
  const { seedAuth } = await import('../helpers/fakeAuth.js');
  await seedAuth(page);

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await expect(page.getByRole('link', { name: /inbox de feedback/i })).toHaveCount(0);

  await page.goto('/admin/feedbacks', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/(\?.*)?$/, { timeout: 10_000 });
});
