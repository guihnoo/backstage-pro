import { test, expect } from '@playwright/test';
import { seedGoalsAuth } from '../helpers/fakeGoals.js';

test('metas exibe streak e projeção de shows com dados mockados', async ({ page }) => {
  await seedGoalsAuth(page);

  await page.goto('/goals', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Progresso do Mês' })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText(/m[eê]s(es)?\s+seguidos?\s+batendo a meta/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/show ainda|shows ainda/i)).toBeVisible({ timeout: 15_000 });
});
