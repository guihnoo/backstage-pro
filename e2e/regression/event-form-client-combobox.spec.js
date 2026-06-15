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

const MOCK_GLOBAL_COMPANY = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'R1 Audiovisual LTDA',
  trading_name: 'R1 Audiovisual',
  logo_url: 'https://example.com/r1-logo.png',
  city: 'São Paulo',
  state: 'SP',
  verified: true,
  source: 'manual',
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
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: '33333333-3333-4333-8333-333333333333',
            user_id: E2E_USER_ID,
            client_type: 'empresa',
            profile_complete: true,
            brand_color: '#EAB308',
            ...body,
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.route(/\/rest\/v1\/companies(\?|$)/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([MOCK_GLOBAL_COMPANY]),
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

  test('vincula empresa global do Backstage ao digitar no combobox', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

    await page.getByRole('button', { name: /^evento$/i }).click();
    await expect(page.getByRole('dialog').getByText('Novo Evento')).toBeVisible({ timeout: 10_000 });

    const clientCombobox = page.getByRole('combobox').filter({ hasText: 'Buscar cliente ou criar novo' });
    await clientCombobox.click();
    await page.getByPlaceholder('Digite o nome para buscar ou criar...').fill('R1');

    await expect(page.getByText('Empresas no Backstage Pro')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('option', { name: /R1 Audiovisual/i }).click();

    await expect(page.getByRole('dialog').getByRole('combobox').first()).toContainText('R1 Audiovisual');
  });
});
