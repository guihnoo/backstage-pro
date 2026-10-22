// Ideia #112 — deslocamento por km virando despesa (km × valor por km, ida e volta).
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb } from '../helpers/fakeDb.js';

test.describe('quilometragem', () => {
  test.setTimeout(120_000);

  test('despesa de km calcula o valor e lembra o valor por km', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    let despesa = null;
    const ajustes = [];
    page.on('request', (r) => {
      if (!['POST', 'PATCH'].includes(r.method())) return;
      if (/\/rest\/v1\/expenses/.test(r.url())) despesa = r.postDataJSON();
      if (/\/rest\/v1\/user_settings/.test(r.url())) ajustes.push(r.postDataJSON());
    });

    await page.goto('/expenses', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Nova despesa (digitar)' }).click({ timeout: 60_000 });
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Quilometragem (km)' }).click();

    const km = dialog.getByTestId('km-fields');
    await expect(km).toBeVisible();
    await expect(dialog.locator('#exp-km-rate')).toHaveValue('1,20');
    await dialog.locator('#exp-km').fill('45');
    await dialog.locator('#exp-km-rate').fill('1,30');
    await expect(km.getByText('90 km × R$ 1,30 = R$ 117,00')).toBeVisible();
    await expect(dialog.locator('#exp-amount')).toHaveValue('117,00');

    await km.getByRole('button', { name: /ida e volta/i }).click();
    await expect(km.getByText('45 km × R$ 1,30 = R$ 58,50')).toBeVisible();
    await km.getByRole('button', { name: /só ida/i }).click();

    await dialog.getByRole('button', { name: /^salvar$/i }).click();
    await expect.poll(() => despesa, { timeout: 10_000 }).not.toBeNull();
    expect(despesa).toMatchObject({
      category: 'quilometragem',
      title: 'Deslocamento',
      amount: 117,
      distance_km: 90,
      description: '2 × 45 km (ida e volta) × R$ 1,30/km',
    });
    await expect.poll(() => ajustes.some((a) => Number(a?.km_rate) === 1.3), { timeout: 10_000 }).toBe(true);
  });
});
