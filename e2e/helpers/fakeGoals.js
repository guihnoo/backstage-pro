import { E2E_USER_ID } from './fakeAuth.js';
import { E2E_CLIENT_ID, fakeClient } from './dataMocks.js';
import { monthKeyFromOffset } from '../../src/lib/goalMetrics.js';

function isoInMonth(monthsBack, day = 15) {
  const [year, month] = monthKeyFromOffset(monthsBack).split('-').map(Number);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function baseEvent(overrides) {
  const start = isoInMonth(0);
  const end = isoInMonth(0, 16);
  return {
    id: 'e2e-goal-event',
    user_id: E2E_USER_ID,
    client_id: E2E_CLIENT_ID,
    title: 'E2E Goal Show',
    start_date: start,
    end_date: end,
    event_date: start,
    daily_cache_value: 5000,
    status: 'completed',
    payment_status: 'paid',
    paid_amount: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function applyEventQueryFilters(events, url) {
  let result = [...events];
  const params = new URL(url).searchParams;

  for (const [key, raw] of params.entries()) {
    if (raw.startsWith('lte.')) {
      const max = raw.slice(4);
      result = result.filter((e) => (e[key] || '') <= max);
    }
    if (raw.startsWith('gte.')) {
      const min = raw.slice(4);
      result = result.filter((e) => (e[key] || '') >= min);
    }
    if (raw.startsWith('eq.')) {
      const val = raw.slice(3);
      result = result.filter((e) => String(e[key]) === val);
    }
    if (raw.startsWith('in.')) {
      const vals = raw
        .slice(3)
        .replace(/[()]/g, '')
        .split(',')
        .map((v) => v.trim());
      result = result.filter((e) => vals.includes(String(e[key])));
    }
    if (raw.startsWith('neq.')) {
      const val = raw.slice(4);
      result = result.filter((e) => String(e[key]) !== val);
    }
  }

  return result;
}

/** Eventos pagos: mês anterior bate meta; mês atual parcial → streak + projeção. */
export function fakeGoalEvents() {
  const prevMonth = isoInMonth(1);
  const currMonth = isoInMonth(0);
  return [
    baseEvent({
      id: 'e2e-goal-prev',
      start_date: prevMonth,
      end_date: prevMonth,
      event_date: prevMonth,
      paid_amount: 12_000,
    }),
    baseEvent({
      id: 'e2e-goal-curr',
      start_date: currMonth,
      end_date: currMonth,
      event_date: currMonth,
      paid_amount: 3_000,
    }),
    baseEvent({
      id: 'e2e-goal-avg-2',
      start_date: isoInMonth(2),
      end_date: isoInMonth(2),
      event_date: isoInMonth(2),
      paid_amount: 5_000,
    }),
  ];
}

export async function installGoalMocks(page) {
  const client = fakeClient();
  const events = fakeGoalEvents();

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

    if (url.includes('/rest/v1/events')) {
      const filtered = applyEventQueryFilters(events, url);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'content-range': `0-${Math.max(filtered.length - 1, 0)}/${filtered.length}`,
        },
        body: JSON.stringify(filtered),
      });
      return;
    }

    if (url.includes('/rest/v1/clients')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/1' },
        body: JSON.stringify([client]),
      });
      return;
    }

    const emptyTables = ['daily_work', 'expenses', 'google_calendar_connections', 'user_settings', 'mei_ledger'];
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

export async function seedGoalsAuth(page) {
  const { seedAuth } = await import('./fakeAuth.js');
  await installGoalMocks(page);
  await seedAuth(page, { monthly_goal_revenue: 10_000, monthly_goal_events: 10 });
}
