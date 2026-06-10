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

function wantsSingleObject(headers) {
  const accept = headers.accept || headers.Accept || '';
  return accept.includes('application/vnd.pgrst.object+json');
}

function mergeProfileUpdate(profile, payload) {
  if (!payload || typeof payload !== 'object') return profile;
  const row = Array.isArray(payload) ? payload[0] : payload;
  if (!row || typeof row !== 'object') return profile;
  return { ...profile, ...row, updated_at: new Date().toISOString() };
}

export async function installProfileMock(page) {
  let profileState = fakeProfile();

  await page.route(/\/rest\/v1\/profiles(\?|$)/, async (route) => {
    const method = route.request().method();
    const headers = route.request().headers();

    if (method === 'GET' || method === 'HEAD') {
      const body = wantsSingleObject(headers) ? profileState : [profileState];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }

    if (method === 'POST' || method === 'PATCH') {
      try {
        const payload = route.request().postDataJSON();
        profileState = mergeProfileUpdate(profileState, payload);
      } catch {
        // ignore malformed body in mock
      }

      const body = wantsSingleObject(headers) ? profileState : [profileState];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
      return;
    }

    await route.continue();
  });
}

/** Evita que o Workbox (NetworkFirst supabase.co) contorne os mocks do Playwright. */
export async function disableServiceWorkerForE2E(page) {
  await page.addInitScript(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      const sw = navigator.serviceWorker;
      sw.register = () =>
        Promise.resolve({
          unregister: () => Promise.resolve(true),
          update: () => Promise.resolve(),
        });
    }
    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
    }
  });
}

export async function seedAuth(page) {
  await installProfileMock(page);
  await disableServiceWorkerForE2E(page);
  // goto /login primeiro para que o Supabase inicialize sem sessão;
  // depois setamos localStorage via evaluate — evita a validação de token
  // que ocorre quando Supabase encontra a sessão já presente no boot.
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ({ key, session }) => {
      localStorage.setItem(key, JSON.stringify(session));
    },
    { key: AUTH_KEY, session: fakeSession() }
  );
}
