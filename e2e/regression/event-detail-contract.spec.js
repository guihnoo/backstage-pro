// Rede de seguranca para juntar as duas janelas de detalhe do evento (missao 5d404).
// Tem que continuar passando antes e depois da troca.
import { test, expect } from '@playwright/test';
import { seedAuthWithData } from '../helpers/dataMocks.js';

async function abrirEventoNaAgenda(page) {
  const escritas = [];
  page.on('request', (req) => {
    const m = req.method();
    if (req.url().includes('/rest/v1/') && (m === 'PATCH' || m === 'POST' || m === 'DELETE')) {
      escritas.push(`${m} ${req.url()}`);
    }
  });
  await seedAuthWithData(page);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await page.getByRole('button', { name: /E2E Cliente Demo E2E Show Demo/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return { dialog, escritas };
}

test.describe('detalhe do evento (contrato)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('mostra titulo e as abas Resumo, Trabalho e Fiscal', async ({ page }) => {
    const { dialog } = await abrirEventoNaAgenda(page);
    await expect(dialog.getByText('E2E Show Demo').first()).toBeVisible();
    for (const aba of [/resumo/i, /trabalho/i, /fiscal/i]) {
      await expect(dialog.getByRole('tab', { name: aba })).toBeVisible();
    }
  });

  test('abrir, trocar de aba e fechar nao grava nada', async ({ page }) => {
    const { dialog, escritas } = await abrirEventoNaAgenda(page);
    await dialog.getByRole('tab', { name: /trabalho/i }).click();
    await dialog.getByRole('tab', { name: /fiscal/i }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    expect(escritas).toEqual([]);
  });
});
