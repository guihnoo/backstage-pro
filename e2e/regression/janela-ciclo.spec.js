// Janela do trabalho (08/11): a linha Agendado → Realizado → Horas → Pago é tocável; no celular é gaveta.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test.describe('linha do ciclo na janela do trabalho', () => {
  test.setTimeout(120_000);

  test('Horas abre o registro e Pago abre a confirmação', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    await page.goto(`/calendar?event=${FAKE_IDS.showAReceber}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByTestId('gaveta-puxador')).toBeVisible({ timeout: 60_000 });

    await page.getByTestId('ciclo-horas').click();
    await expect(page.getByRole('heading', { name: /registrar horas/i })).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /registrar horas/i })).toBeHidden({ timeout: 10_000 });

    await page.getByTestId('ciclo-pago').click();
    await expect(page.getByText(/confirmar recebimento/i).last()).toBeVisible({ timeout: 10_000 });
  });
});
