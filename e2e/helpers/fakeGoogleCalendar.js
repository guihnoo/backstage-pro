import { E2E_USER_ID } from './fakeAuth.js';
import { E2E_CLIENT_ID, fakeClient } from './dataMocks.js';

export const E2E_SETTINGS_ID = '00000000-0000-4000-8000-000000000010';

export function fakeGoogleUserSettings() {
  return {
    id: E2E_SETTINGS_ID,
    user_id: E2E_USER_ID,
    google_calendar_connected: true,
    google_account_email: 'e2e-test@gmail.com',
    google_calendar_id: 'primary',
    google_last_sync_at: new Date().toISOString(),
    financial_visibility: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function fakeGoogleEvents() {
  const client = fakeClient();
  const start = new Date().toISOString().split('T')[0];
  const end = start;
  return [
    {
      id: 'e2e-gcal-synced',
      user_id: E2E_USER_ID,
      client_id: client.id,
      title: 'E2E Show Sincronizado',
      start_date: start,
      end_date: end,
      event_date: start,
      google_event_id: 'google-event-1',
      status: 'confirmed',
      payment_status: 'unpaid',
      clients: client,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'e2e-gcal-unsynced',
      user_id: E2E_USER_ID,
      client_id: client.id,
      title: 'E2E Show Pendente Sync',
      start_date: start,
      end_date: end,
      event_date: start,
      status: 'confirmed',
      payment_status: 'unpaid',
      clients: client,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
}

/**
 * Mocks PostgREST + Edge Function google-calendar para smoke do Perfil.
 */
export async function installGoogleCalendarMocks(page, { dedupeRemoved = 2 } = {}) {
  const settings = fakeGoogleUserSettings();
  const events = fakeGoogleEvents();

  await page.route('**/functions/v1/google-calendar', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }

    let action = '';
    try {
      const body = route.request().postDataJSON();
      action = body?.action || '';
    } catch {
      /* ignore */
    }

    if (action === 'list-calendars') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          calendars: [{ summary: 'E2E Principal', primary: true }],
        }),
      });
      return;
    }

    if (action === 'dedupe-events') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, removed_count: dedupeRemoved }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
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

    if (url.includes('/rest/v1/user_settings')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/1' },
        body: JSON.stringify([settings]),
      });
      return;
    }

    if (url.includes('/rest/v1/events')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${events.length - 1}/${events.length}` },
        body: JSON.stringify(events),
      });
      return;
    }

    if (url.includes('/rest/v1/clients')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/1' },
        body: JSON.stringify([fakeClient()]),
      });
      return;
    }

    const emptyTables = ['daily_work', 'expenses', 'google_calendar_connections', 'mei_ledger', 'feedback'];
    for (const table of emptyTables) {
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

export async function seedGoogleCalendarAuth(page, options = {}) {
  const { seedAuth } = await import('./fakeAuth.js');
  await installGoogleCalendarMocks(page, options);
  await seedAuth(page);
}
