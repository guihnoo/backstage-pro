import { E2E_USER_ID } from './fakeAuth.js';

export const E2E_CLIENT_ID = '00000000-0000-4000-8000-000000000002';
export const E2E_EVENT_ID = '00000000-0000-4000-8000-000000000003';
export const E2E_GLOBAL_COMPANY_ID = '22222222-2222-4222-8222-222222222222';

function isoDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

export function fakeClient() {
  return {
    id: E2E_CLIENT_ID,
    user_id: E2E_USER_ID,
    name: 'E2E Cliente Demo',
    email: 'cliente@demo.local',
    phone: '11999999999',
    city: 'São Paulo',
    state: 'SP',
    default_daily_cache: 800,
    profile_complete: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function fakeGlobalCompany() {
  return {
    id: E2E_GLOBAL_COMPANY_ID,
    name: 'R1 Audiovisual LTDA',
    trading_name: 'R1 Audiovisual',
    logo_url: 'https://example.com/r1-logo.png',
    city: 'São Paulo',
    state: 'SP',
    verified: true,
    source: 'manual',
  };
}

export function fakeEvent(clientId = E2E_CLIENT_ID) {
  const start = isoDate();
  const end = isoDate(new Date(Date.now() + 86400000));
  return {
    id: E2E_EVENT_ID,
    user_id: E2E_USER_ID,
    client_id: clientId,
    title: 'E2E Show Demo',
    start_date: start,
    end_date: end,
    event_date: start,
    daily_cache_value: 700,
    status: 'confirmed',
    payment_status: 'unpaid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

const EMPTY_TABLES = [
  'daily_work',
  'expenses',
  'google_calendar_connections',
  'user_settings',
  'mei_ledger',
];

/**
 * Intercepta GETs do PostgREST para popular calendário/clientes nos E2E.
 * Deve ser chamado após installProfileMock (profiles continua no fakeAuth).
 */
export async function installDataMocks(page) {
  const client = fakeClient();
  const event = fakeEvent(client.id);

  const tableData = {
    events: [event],
    clients: [client],
    companies: [fakeGlobalCompany()],
  };

  await page.route('**/functions/v1/search-company', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/profiles')) {
      await route.continue();
      return;
    }

    if (method === 'PATCH' || method === 'POST' || method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(method === 'DELETE' ? null : []),
      });
      return;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      await route.continue();
      return;
    }

    for (const [table, rows] of Object.entries(tableData)) {
      if (url.includes(`/rest/v1/${table}`)) {
        const body = JSON.stringify(rows);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
          },
          body,
        });
        return;
      }
    }

    for (const table of EMPTY_TABLES) {
      if (url.includes(`/rest/v1/${table}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-0/0' },
          body: '[]',
        });
        return;
      }
    }

    await route.continue();
  });
}

export async function seedAuthWithData(page) {
  const { seedAuth } = await import('./fakeAuth.js');
  await seedAuth(page);
  await installDataMocks(page);
}
