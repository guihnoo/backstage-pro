import { test, expect } from '../helpers/test.js';
import { fakeLastMonthShowPaidThisMonth, seedGoalsAuth } from '../helpers/fakeGoals.js';

test('recebido do mês é o mesmo em Home, Relatórios e Metas', async ({ page }) => {
  await seedGoalsAuth(page, fakeLastMonthShowPaidThisMonth());

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(
    page.getByRole('button').filter({ hasText: 'Recebido' }).first()
  ).toContainText('1.800', { timeout: 15_000 });

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByText('RECEBIDO', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1\.800/).first()).toBeVisible();

  await page.goto('/goals', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Histórico Recente' })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/1\.800/).first()).toBeVisible();
});
