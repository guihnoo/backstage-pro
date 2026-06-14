import { E2E_USER_ID } from './fakeAuth.js';

export function fakeFeedbackRows() {
  return [
    {
      id: 'e2e-feedback-1',
      user_id: E2E_USER_ID,
      user_email: 'beta.user@example.com',
      type: 'bug',
      message: 'O botão de salvar não responde na Agenda.',
      rating: 3,
      status: 'new',
      page_path: '/calendar',
      app_version: 'e2e',
      screenshot_url: null,
      owner_notes: null,
      created_at: '2026-06-12T18:00:00.000Z',
      updated_at: '2026-06-12T18:00:00.000Z',
    },
    {
      id: 'e2e-feedback-2',
      user_id: E2E_USER_ID,
      user_email: 'beta.user@example.com',
      type: 'suggestion',
      message: 'Seria ótimo ter modo escuro automático.',
      rating: 5,
      status: 'in_review',
      page_path: '/profile',
      app_version: 'e2e',
      screenshot_url: null,
      owner_notes: 'Analisar no próximo sprint',
      created_at: '2026-06-10T12:00:00.000Z',
      updated_at: '2026-06-11T09:00:00.000Z',
    },
  ];
}

/** Mock da tabela feedback para inbox do owner. */
export async function installFeedbackMocks(page, rows = fakeFeedbackRows()) {
  await page.route(/\/rest\/v1\/feedback/, async (route) => {
    const method = route.request().method();

    if (method === 'GET' || method === 'HEAD') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${Math.max(rows.length - 1, 0)}/${rows.length}` },
        body: JSON.stringify(rows),
      });
      return;
    }

    if (method === 'PATCH') {
      const body = route.request().postDataJSON();
      const id = rows[0]?.id;
      const updated = { ...rows[0], ...body, id };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(updated),
      });
      return;
    }

    await route.continue();
  });
}
