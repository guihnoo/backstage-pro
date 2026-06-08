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

test('calendar nao fica preso em Carregando apos navegacao', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: AUTH_KEY, session: fakeSession() }
  );

  await page.goto('/calendar?action=new-event', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  const hasCalendarUi =
    (await page.getByRole('heading', { name: /agenda|calendário/i }).count()) > 0 ||
    (await page.locator('[class*="calendar"], [data-testid="calendar-page"]').count()) > 0 ||
    (await page.getByText(/eventos|junho|janeiro/i).count()) > 0;

  expect(hasCalendarUi).toBeTruthy();
});
