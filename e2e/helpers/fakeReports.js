import { E2E_USER_ID } from './fakeAuth.js';

export const E2E_CLIENT_SP_ID = 'e2e-client-sp';
export const E2E_CLIENT_RJ_ID = 'e2e-client-rj';

export function fakeReportClients() {
  return [
    {
      id: E2E_CLIENT_SP_ID,
      user_id: E2E_USER_ID,
      name: 'Produtora E2E SP',
      company: 'Produtora E2E SP',
      phone: '5511999990001',
    },
    {
      id: E2E_CLIENT_RJ_ID,
      user_id: E2E_USER_ID,
      name: 'Eventos E2E Rio',
      company: 'Eventos E2E Rio',
      phone: '5521999990002',
    },
  ];
}

export function fakeReportEvents() {
  return [
    {
      id: 'e2e-event-sp',
      user_id: E2E_USER_ID,
      client_id: E2E_CLIENT_SP_ID,
      title: 'Show E2E São Paulo',
      start_date: '2026-05-10',
      end_date: '2026-05-10',
      status: 'confirmed',
      payment_status: 'paid',
      paid_amount: 1200,
      paid_date: '2026-05-12',
      location: 'Allianz Parque, São Paulo, SP',
      location_city: 'São Paulo',
      location_state: 'SP',
      location_lat: -23.5275,
      location_lng: -46.6785,
    },
    {
      id: 'e2e-event-rj',
      user_id: E2E_USER_ID,
      client_id: E2E_CLIENT_RJ_ID,
      title: 'Show E2E Rio',
      start_date: '2026-04-20',
      end_date: '2026-04-20',
      status: 'confirmed',
      payment_status: 'pending',
      location: 'Jeunesse Arena, Rio de Janeiro, RJ',
      location_city: 'Rio de Janeiro',
      location_state: 'RJ',
      location_lat: -22.9752,
      location_lng: -43.3926,
    },
    {
      id: 'e2e-event-cancelled-mg',
      user_id: E2E_USER_ID,
      title: 'Show cancelado BH',
      start_date: '2026-03-01',
      end_date: '2026-03-01',
      status: 'cancelled',
      payment_status: 'pending',
      location: 'Mineirão, Belo Horizonte, MG',
      location_city: 'Belo Horizonte',
      location_state: 'MG',
      location_lat: -19.8658,
      location_lng: -43.9711,
    },
  ];
}

export function fakeReportEventsCancelledOnly() {
  return fakeReportEvents().filter((e) => e.status === 'cancelled');
}

function jsonList(route, rows) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(rows),
  });
}

/** Mocks mínimos para a página de Relatórios (eventos com localização para o mapa). */
export async function installReportsMocks(page, events = fakeReportEvents(), clients = fakeReportClients()) {

  await page.route(/\/rest\/v1\/events(\?|$)/, async (route) => {
    const method = route.request().method();
    if (method === 'GET' || method === 'HEAD') {
      await jsonList(route, events);
      return;
    }
    if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(events[0]),
      });
      return;
    }
    await route.continue();
  });

  await page.route(/\/rest\/v1\/clients(\?|$)/, async (route) => {
    if (route.request().method() === 'GET') {
      await jsonList(route, clients);
      return;
    }
    await route.continue();
  });

  await page.route(/\/rest\/v1\/daily_work(\?|$)/, async (route) => {
    if (route.request().method() === 'GET') {
      await jsonList(route, []);
      return;
    }
    await route.continue();
  });

  await page.route(/\/rest\/v1\/expenses(\?|$)/, async (route) => {
    if (route.request().method() === 'GET') {
      await jsonList(route, []);
      return;
    }
    await route.continue();
  });
}
