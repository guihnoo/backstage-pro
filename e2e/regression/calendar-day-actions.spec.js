// Botoes do cartao do dia na Agenda (Horas / Despesa / Abrir).
// 21/10: "Horas" derrubava a Agenda ("Oops! Algo deu errado") porque mandava o evento no lugar da data.
import { test, expect } from '@playwright/test';
import { seedAuthWithData } from '../helpers/dataMocks.js';

async function tocarNoDiaDoEvento(page) {
  await seedAuthWithData(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 60_000 });
  await page.getByRole('button', { name: /^Dia \d+: E2E Cliente Demo/i }).first().click();
}

test.describe('cartao do dia na Agenda', () => {
  test.setTimeout(120_000);

  test('Horas abre o registro de trabalho sem derrubar a tela', async ({ page }) => {
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await tocarNoDiaDoEvento(page);
    await page.getByRole('button', { name: /^Horas$/ }).first().click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: /registrar horas/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
    expect(erros).toEqual([]);
  });
});
