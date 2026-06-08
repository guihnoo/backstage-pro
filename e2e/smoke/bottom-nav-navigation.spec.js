import { test, expect } from '@playwright/test';

const AUTH_KEY = 'sb-cwtallnetgodoacuoaow-auth-token';

function fakeSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: 'fake-access-token-for-e2e',
    refresh_token: 'fake-refresh-token',
    expires_at: expiresAt,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: '00000000-0000-4000-8000-000000000001',
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e-test@backstage.local',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: { name: 'E2E Test' },
      created_at: new Date().toISOString(),
    },
  };
}

async function seedAuth(page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: AUTH_KEY, session: fakeSession() }
  );
}

test('bottom nav troca pagina sem precisar de refresh', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  await page.getByRole('link', { name: /agenda/i }).click();
  await expect(page).toHaveURL(/\/calendar/);
  await expect(page.getByRole('heading', { name: /agenda/i })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: /clientes/i }).click();
  await expect(page).toHaveURL(/\/clients/);
  await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible({ timeout: 10_000 });

  await page.getByRole('link', { name: /^home$/i }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('apos FAB novo evento, nav continua funcionando sem refresh', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/calendar?action=new-event', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  await page.getByRole('link', { name: /clientes/i }).click();
  await expect(page).toHaveURL(/\/clients/);
  await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible({ timeout: 10_000 });
});
