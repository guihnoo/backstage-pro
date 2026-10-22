import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import {
  installReportsMocks,
  fakeReportClients,
  fakeReportEvents,
  E2E_CLIENT_RJ_ID,
} from '../helpers/fakeReports.js';

// PENDENTE: a lista de NFs por evento (NfTracker) está sem uso no visual All Access; restaurar e reativar.
test.fixme('aba Fiscal exibe nome da empresa nos eventos (não Sem empresa)', async ({ page }) => {
  await installReportsMocks(page);
  await seedAuth(page);

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await page.getByRole('tab', { name: /fiscal/i }).click();

  await expect(page.getByText('Produtora E2E SP')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Sem empresa')).toHaveCount(0);
});

test('inadimplência na visão geral mostra empresa do cliente', async ({ page }) => {
  const clients = fakeReportClients();
  const events = [
    ...fakeReportEvents(),
    {
      id: 'e2e-event-overdue',
      user_id: 'e2e-user',
      client_id: E2E_CLIENT_RJ_ID,
      title: 'Show em aberto E2E',
      start_date: '2026-01-15',
      end_date: '2026-01-15',
      status: 'completed',
      payment_status: 'pending',
      estimated_revenue: 800,
      location_city: 'Rio de Janeiro',
      location_state: 'RJ',
    },
  ];

  await installReportsMocks(page, events, clients);
  await seedAuth(page);

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await page.getByRole('tab', { name: /a receber/i }).click();

  const agingPanel = page.locator('section').filter({ hasText: /atraso/i }).first();
  await expect(agingPanel.getByText('Show em aberto E2E')).toBeVisible({ timeout: 10_000 });
  await expect(agingPanel.getByText('Eventos E2E Rio').first()).toBeVisible();
  await expect(agingPanel.getByText('Sem empresa')).toHaveCount(0);
});
