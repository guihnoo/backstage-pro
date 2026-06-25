/**
 * Dados e mocks PostgREST para capturas de marketing (screenshots/vídeo reais).
 */
import { E2E_USER_ID } from '../../e2e/helpers/fakeAuth.js';

const USER_ID = E2E_USER_ID;

function iso(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

function monthStart() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export const MARKETING_CLIENTS = [
  {
    id: 'mkt-client-live-nation',
    user_id: USER_ID,
    name: 'Live Nation Brasil',
    company: 'Live Nation Brasil',
    client_type: 'company',
    email: 'producao@livenation.com.br',
    phone: '5511999887766',
    city: 'São Paulo',
    state: 'SP',
    default_daily_cache: 3200,
    brand_color: '#A64AFF',
    profile_complete: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mkt-client-festival',
    user_id: USER_ID,
    name: 'Festival Summer Lights',
    company: 'Summer Lights Produções',
    client_type: 'company',
    email: 'ops@summerlights.com',
    phone: '5511988776655',
    city: 'São Paulo',
    state: 'SP',
    default_daily_cache: 2800,
    brand_color: '#FFB700',
    profile_complete: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mkt-client-producao',
    user_id: USER_ID,
    name: 'Produção XYZ',
    company: 'Produção XYZ Eventos',
    client_type: 'company',
    email: 'financeiro@produxyz.com.br',
    phone: '5511977665544',
    city: 'São Paulo',
    state: 'SP',
    default_daily_cache: 1800,
    brand_color: '#00D9FF',
    profile_complete: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mkt-client-dj',
    user_id: USER_ID,
    name: 'DJ Marco Silva',
    client_type: 'person',
    email: 'marco@dj.com',
    phone: '5511966554433',
    city: 'São Paulo',
    state: 'SP',
    default_daily_cache: 1500,
    brand_color: '#34d399',
    profile_complete: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function eventBase(overrides) {
  const start = overrides.start_date || iso(0);
  const end = overrides.end_date || start;
  return {
    user_id: USER_ID,
    title: 'Show',
    start_date: start,
    end_date: end,
    event_date: start,
    status: 'confirmed',
    payment_status: 'unpaid',
    daily_cache_value: 2000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export const MARKETING_EVENTS = [
  eventBase({
    id: 'mkt-event-hoje',
    client_id: 'mkt-client-festival',
    title: 'Festival Summer Lights',
    start_date: iso(0),
    end_date: iso(0),
    start_time: '19:00:00',
    status: 'confirmed',
    payment_status: 'unpaid',
    daily_cache_value: 3200,
    location: 'Allianz Parque, São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
    location_lat: -23.5275,
    location_lng: -46.6785,
  }),
  eventBase({
    id: 'mkt-event-prox',
    client_id: 'mkt-client-live-nation',
    title: 'Corporate Live SP',
    start_date: iso(4),
    end_date: iso(4),
    start_time: '20:00:00',
    daily_cache_value: 2800,
    payment_status: 'unpaid',
    location: 'Audio Club, São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
  }),
  eventBase({
    id: 'mkt-event-paid-1',
    client_id: 'mkt-client-live-nation',
    title: 'Arena Tour — Noite 1',
    start_date: iso(-8),
    end_date: iso(-8),
    status: 'completed',
    payment_status: 'paid',
    paid_amount: 4500,
    paid_date: iso(-5),
    daily_cache_value: 4500,
    location: 'Allianz Parque, São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
    location_lat: -23.5275,
    location_lng: -46.6785,
  }),
  eventBase({
    id: 'mkt-event-paid-2',
    client_id: 'mkt-client-dj',
    title: 'Club Night — Marco Silva',
    start_date: iso(-3),
    end_date: iso(-3),
    status: 'completed',
    payment_status: 'paid',
    paid_amount: 2800,
    paid_date: iso(-1),
    daily_cache_value: 2800,
    location: 'Villa Mix, São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
  }),
  eventBase({
    id: 'mkt-event-overdue',
    client_id: 'mkt-client-producao',
    title: 'Formatura USP',
    start_date: iso(-12),
    end_date: iso(-12),
    status: 'completed',
    payment_status: 'unpaid',
    daily_cache_value: 1800,
    payment_due_date: iso(-5),
    location: 'Campus USP, São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
  }),
  eventBase({
    id: 'mkt-event-mes-1',
    client_id: 'mkt-client-festival',
    title: 'Ensaio Geral Summer',
    start_date: iso(-15),
    end_date: iso(-15),
    status: 'completed',
    payment_status: 'paid',
    paid_amount: 1200,
    paid_date: iso(-14),
    daily_cache_value: 1200,
  }),
  eventBase({
    id: 'mkt-event-future',
    client_id: 'mkt-client-dj',
    title: 'Wedding Lights',
    start_date: iso(18),
    end_date: iso(18),
    daily_cache_value: 2200,
    payment_status: 'unpaid',
    location: 'Espaço Villa Lobos, São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
  }),
  eventBase({
    id: 'mkt-event-rj',
    client_id: 'mkt-client-live-nation',
    title: 'Rock in Rio — Prep',
    start_date: iso(25),
    end_date: iso(27),
    daily_cache_value: 3500,
    payment_status: 'unpaid',
    location: 'Cidade do Rock, Rio de Janeiro, RJ',
    location_city: 'Rio de Janeiro',
    location_state: 'RJ',
    location_lat: -22.9752,
    location_lng: -43.3926,
  }),
];

export const MARKETING_EXPENSES = [
  {
    id: 'mkt-exp-1',
    user_id: USER_ID,
    title: 'Uber — Allianz Parque',
    amount: 45,
    expense_date: iso(-3),
    date: iso(-3),
    category: 'transport',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mkt-exp-2',
    user_id: USER_ID,
    title: 'Alimentação no show',
    amount: 38,
    expense_date: iso(-3),
    date: iso(-3),
    category: 'food',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mkt-exp-3',
    user_id: USER_ID,
    title: 'Cabos e adaptadores',
    amount: 120,
    expense_date: iso(-8),
    date: iso(-8),
    category: 'equipment',
    event_id: 'mkt-event-paid-1',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mkt-exp-4',
    user_id: USER_ID,
    title: 'Estacionamento',
    amount: 35,
    expense_date: iso(0),
    date: iso(0),
    category: 'transport',
    created_at: new Date().toISOString(),
  },
];

export const MARKETING_DAILY_WORK = [
  {
    id: 'mkt-work-1',
    user_id: USER_ID,
    event_id: 'mkt-event-paid-1',
    work_date: iso(-8),
    date: iso(-8),
    total_hours: 12,
    hours: 12,
    daily_cache: 4500,
    created_at: new Date().toISOString(),
  },
  {
    id: 'mkt-work-2',
    user_id: USER_ID,
    event_id: 'mkt-event-paid-2',
    work_date: iso(-3),
    date: iso(-3),
    total_hours: 8,
    hours: 8,
    daily_cache: 2800,
    created_at: new Date().toISOString(),
  },
];

export const MARKETING_USER_SETTINGS = {
  id: 'mkt-settings-1',
  user_id: USER_ID,
  google_calendar_connected: true,
  financial_visible: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const EMPTY_TABLES = [
  'google_calendar_connections',
  'mei_ledger',
  'push_subscriptions',
  'feedback',
  'companies',
  'ai_chat_history',
  'chat_messages',
];

function wantsSingleObject(headers) {
  const accept = headers.accept || headers.Accept || '';
  return accept.includes('application/vnd.pgrst.object+json');
}

function embedClients(events) {
  const byId = Object.fromEntries(MARKETING_CLIENTS.map((c) => [c.id, c]));
  return events.map((e) => {
    if (!e.client_id) return e;
    const client = byId[e.client_id];
    if (!client) return e;
    return {
      ...e,
      clients: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
      },
    };
  });
}

function fulfillJson(route, rows, headers = route.request().headers()) {
  const body = wantsSingleObject(headers)
    ? rows[0] ?? null
    : rows;
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: {
      'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Instala mocks ricos para captura de marketing. Chamar após installProfileMock.
 */
export async function installMarketingMocks(page) {
  const tableData = {
    events: MARKETING_EVENTS,
    clients: MARKETING_CLIENTS,
    expenses: MARKETING_EXPENSES,
    daily_work: MARKETING_DAILY_WORK,
    user_settings: [MARKETING_USER_SETTINGS],
  };

  await page.route('**/functions/v1/search-company', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    });
  });

  await page.route('**/functions/v1/google-calendar**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ connected: true, events: [] }),
    });
  });

  await page.route('**/rest/v1/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const headers = route.request().headers();

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
        let payload = rows;
        if (table === 'events' && url.includes('clients')) {
          payload = embedClients(rows);
        }
        if (table === 'user_settings') {
          const single = wantsSingleObject(headers);
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(single ? MARKETING_USER_SETTINGS : [MARKETING_USER_SETTINGS]),
          });
          return;
        }
        await fulfillJson(route, payload, headers);
        return;
      }
    }

    for (const table of EMPTY_TABLES) {
      if (url.includes(`/rest/v1/${table}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': '0-0/0' },
          body: wantsSingleObject(headers) ? 'null' : '[]',
        });
        return;
      }
    }

    await route.continue();
  });
}

export async function seedMarketingSession(page) {
  const { seedAuth } = await import('../../e2e/helpers/fakeAuth.js');
  await seedAuth(page, {
    name: 'Ricardo Silva',
    category: 'lighting',
    monthly_goal_revenue: 12000,
    monthly_goal_events: 10,
    city: 'São Paulo',
    state: 'SP',
    daily_rate: 800,
    years_experience: 8,
    onboarding_complete: true,
  });
  await installMarketingMocks(page);
}

export const MARKETING_PROFILE = {
  name: 'Ricardo Silva',
  monthly_goal_revenue: 12000,
};
