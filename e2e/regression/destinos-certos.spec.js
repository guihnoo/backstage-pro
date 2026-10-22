// Botões que levavam à tela certa, mas ao lugar errado dela (varredura de 22/10):
// - "Clientes em aberto › Ver todos" (Início) abria Dinheiro na aba Mês, não em "A receber";
// - "Novo job" no cliente abria o formulário sem o cliente escolhido (prop com nome errado).
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test.describe('destinos certos', () => {
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
  });

  test('/reports?aba=receber abre direto na aba A receber', async ({ page }) => {
    await page.goto('/reports?aba=receber', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('tab', { name: 'A receber' })).toHaveAttribute('aria-selected', 'true', { timeout: 60_000 });
    await expect(page.getByRole('tab', { name: 'Mês' })).toHaveAttribute('aria-selected', 'false');
  });

  test('Clientes em aberto › Ver todos leva para Dinheiro › A receber', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const verTodos = page.getByRole('button', { name: /^ver todos$/i }).first();
    await expect(verTodos).toBeVisible({ timeout: 60_000 });
    await verTodos.click();
    await expect(page).toHaveURL(/\/reports\?aba=receber$/);
    await expect(page.getByRole('tab', { name: 'A receber' })).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 });
  });

  test('Novo job no cliente já vem com o cliente escolhido', async ({ page }) => {
    await page.goto(`/client-detail?id=${FAKE_IDS.empresa}`, { waitUntil: 'domcontentloaded' });
    const novoJob = page.getByRole('button', { name: /novo job/i });
    await expect(novoJob).toBeVisible({ timeout: 60_000 });
    await novoJob.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: /Palco Norte Produções/ })).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
  });
});
