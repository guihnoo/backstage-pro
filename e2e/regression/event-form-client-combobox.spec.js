import { test, expect } from '@playwright/test';
import { seedAuth, E2E_USER_ID } from '../helpers/fakeAuth.js';

const MOCK_CLIENT = {
  id: '11111111-1111-4111-8111-111111111111',
  user_id: E2E_USER_ID,
  name: 'E2E Cliente Demo',
  client_type: 'empresa',
  brand_color: '#A64AFF',
  profile_complete: true,
};

test.describe('EventForm — combobox de cliente', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);

    await page.route(/\/rest\/v1\/clients(\?|$)/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_CLIENT]),
        });
        return;
      }
      await route.continue();
    });

    await page.route(/\/rest\/v1\/events(\?|$)/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        return;
      }
      await route.continue();
    });
  });

  test('seleciona cliente no combobox dentro do modal de novo evento', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

    await page.getByRole('button', { name: /^evento$/i }).click();
    await expect(page.getByRole('dialog').getByText('Novo Evento')).toBeVisible({ timeout: 10_000 });

    const clientCombobox = page.getByRole('combobox').filter({ hasText: 'Buscar cliente ou criar novo' });
    await clientCombobox.click();
    await page.getByRole('option', { name: /E2E Cliente Demo/i }).click();

    await expect(page.getByRole('dialog').getByRole('combobox').first()).toContainText('E2E Cliente Demo');
  });
});
