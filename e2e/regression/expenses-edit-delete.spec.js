import { test, expect } from '@playwright/test';
import { seedAuthWithData, E2E_EVENT_ID } from '../helpers/dataMocks.js';
import { E2E_USER_ID } from '../helpers/fakeAuth.js';

// Revisão 22/10: a tela nova de Despesas não tinha como excluir nem marcar reembolso recebido.
const today = new Date();
const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const EXPENSE = {
  id: 'e2e-expense-1',
  user_id: E2E_USER_ID,
  event_id: E2E_EVENT_ID,
  title: 'Uber E2E',
  amount: 42.5,
  category: 'transporte',
  expense_date: iso,
  is_reimbursable: true,
  reimbursed: false,
  created_at: new Date().toISOString(),
};

async function mockExpenses(page, calls) {
  await page.route(/\/rest\/v1\/expenses/, async (route) => {
    const method = route.request().method();
    if (method === 'GET' || method === 'HEAD') {
      await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'content-range': '0-0/1' }, body: JSON.stringify([EXPENSE]) });
      return;
    }
    calls.push({ method, url: route.request().url(), body: route.request().postData() });
    const body = method === 'DELETE' ? 'null' : JSON.stringify({ ...EXPENSE, ...(route.request().postDataJSON() || {}) });
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
}

test.describe('Despesas — editar, reembolso e excluir', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('marca reembolso recebido ao editar', async ({ page }) => {
    const calls = [];
    await seedAuthWithData(page);
    await mockExpenses(page, calls);
    await page.goto('/expenses', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /editar despesa uber e2e/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Editar Despesa')).toBeVisible({ timeout: 10_000 });

    await dialog.getByRole('button', { name: /já recebi o reembolso/i }).click();
    await dialog.getByRole('button', { name: /^salvar$/i }).click();

    await expect.poll(() => calls.find((c) => c.method === 'PATCH')?.body || '').toContain('"reimbursed":true');
  });

  test('exclui a despesa com confirmação', async ({ page }) => {
    const calls = [];
    await seedAuthWithData(page);
    await mockExpenses(page, calls);
    await page.goto('/expenses', { waitUntil: 'domcontentloaded' });

    await page.getByRole('button', { name: /editar despesa uber e2e/i }).click();
    await page.getByRole('dialog').getByRole('button', { name: /excluir despesa/i }).click();

    const confirm = page.getByRole('alertdialog');
    await expect(confirm.getByText('Excluir despesa?')).toBeVisible();
    await confirm.getByRole('button', { name: /^excluir$/i }).click();

    await expect.poll(() => calls.some((c) => c.method === 'DELETE' && c.url.includes('e2e-expense-1'))).toBe(true);
    await expect(page.getByText('Despesa excluída.')).toBeVisible();
  });
});
