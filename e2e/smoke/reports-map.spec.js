import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installReportsMocks } from '../helpers/fakeReports.js';

test('mapa interativo aparece em Relatórios com eventos localizados', async ({ page }) => {
  await installReportsMocks(page);
  await seedAuth(page);

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  const map = page.getByTestId('brazil-visited-map');
  await expect(map).toBeVisible({ timeout: 15_000 });
  await expect(map.getByText(/mapa interativo/i)).toBeVisible();
  await expect(map.getByText(/suas cidades/i)).toBeVisible();
  await expect(map.getByRole('button', { name: /São Paulo/i })).toBeVisible();
  await expect(map.getByRole('button', { name: /Rio de Janeiro/i })).toBeVisible();
});
