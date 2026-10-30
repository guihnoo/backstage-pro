import { test, expect } from '../helpers/test.js';
import { fakeQuickPaidEvents, seedGoalsAuth } from '../helpers/fakeGoals.js';

test('metas exibe streak e projeção de shows com dados mockados', async ({ page }) => {
  await seedGoalsAuth(page);

  await page.goto('/goals', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Progresso do Mês' })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText(/m[eê]s(es)?\s+seguidos?\s+batendo a meta/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/show ainda|shows ainda/i)).toBeVisible({ timeout: 15_000 });
});

test('metas não conta como depósito pago sem valor final', async ({ page }) => {
  await seedGoalsAuth(page, fakeQuickPaidEvents());

  await page.goto('/goals', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Progresso do Mês' })).toBeVisible({ timeout: 15_000 });

  await expect(page.getByText(/m[eê]s(es)?\s+seguidos?\s+batendo a meta/i)).toHaveCount(0);
  await expect(page.getByText(/show ainda|shows ainda/i)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Histórico Recente' })).toHaveCount(0);
  await expect(page.getByText('R$ 0,00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Faltam R$ 10.000,00 para a meta de receita')).toBeVisible();
});
