export const AUTH_KEY = 'sb-cwtallnetgodoacuoaow-auth-token';
export const E2E_USER_ID = '00000000-0000-4000-8000-000000000001';

export function fakeSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: 'fake-access-token-for-e2e',
    refresh_token: 'fake-refresh-token',
    expires_at: expiresAt,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: E2E_USER_ID,
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

export function fakeProfile() {
  return {
    id: E2E_USER_ID,
    name: 'E2E Test',
    email: 'e2e-test@backstage.local',
    category: 'lighting',
    onboarding_complete: true,
    phone: '',
    city: 'São Paulo',
    state: 'SP',
    years_experience: 5,
    daily_rate: 500,
    monthly_goal_revenue: 10000,
    monthly_goal_events: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function installProfileMock(page) {
  await page.route('**/rest/v1/profiles**', async (route) => {
    const method = route.request().method();
    if (method === 'GET' || method === 'PATCH' || method === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fakeProfile()),
      });
      return;
    }
    await route.continue();
  });
}

export async function seedAuth(page) {
  await installProfileMock(page);
  await page.addInitScript(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: AUTH_KEY, session: fakeSession() }
  );
}
