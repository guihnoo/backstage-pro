import { E2E_USER_ID } from './fakeAuth.js';

export function fakeReportEvents() {
  return [
    {
      id: 'e2e-event-sp',
      user_id: E2E_USER_ID,
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

function jsonList(route, rows) {
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(rows),
  });
}

/** Mocks mínimos para a página de Relatórios (eventos com localização para o mapa). */
export async function installReportsMocks(page) {
  const events = fakeReportEvents();

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
      await jsonList(route, []);
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
