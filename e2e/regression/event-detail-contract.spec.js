// Rede de seguranca para juntar as duas janelas de detalhe do evento (missao 5d404).
// Tem que continuar passando antes e depois da troca.
import { test, expect } from '../helpers/test.js';
import { abrirEventoDemo } from '../helpers/abrirEvento.js';
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
  await abrirEventoDemo(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return { dialog, escritas };
}

test.describe('detalhe do evento (contrato)', () => {
  // Agenda e pesada no primeiro carregamento (PC lento): mais tempo para nao dar falso erro.
  test.setTimeout(120_000);

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('mostra titulo e as abas Resumo, Horas e Dinheiro', async ({ page }) => {
    const { dialog } = await abrirEventoNaAgenda(page);
    await expect(dialog.getByText('E2E Show Demo').first()).toBeVisible();
    for (const aba of [/resumo/i, /horas/i, /dinheiro/i]) {
      await expect(dialog.getByRole('tab', { name: aba })).toBeVisible();
    }
  });

  test('abrir, trocar de aba e fechar nao grava nada', async ({ page }) => {
    const { dialog, escritas } = await abrirEventoNaAgenda(page);
    await dialog.getByRole('tab', { name: /horas/i }).click();
    await dialog.getByRole('tab', { name: /dinheiro/i }).click();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 10_000 });
    expect(escritas).toEqual([]);
  });
});
