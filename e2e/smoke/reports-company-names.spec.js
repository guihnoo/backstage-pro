import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';
import {
  installReportsMocks,
  fakeReportClients,
  fakeReportEvents,
  E2E_CLIENT_RJ_ID,
} from '../helpers/fakeReports.js';

test('aba Fiscal exibe nome da empresa nos eventos (não Sem empresa)', async ({ page }) => {
  await installReportsMocks(page);
  await seedAuth(page);

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await page.getByRole('button', { name: /fiscal/i }).click();

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

  await page.getByRole('button', { name: /pagamento.*em aberto/i }).click();

  const agingPanel = page.locator('.border-red-500\\/30').filter({ hasText: /em aberto/i });
  await expect(agingPanel.getByText('Show em aberto E2E')).toBeVisible({ timeout: 10_000 });
  await expect(agingPanel.getByText('Eventos E2E Rio').first()).toBeVisible();
  await expect(agingPanel.getByText('Sem empresa')).toHaveCount(0);
});
