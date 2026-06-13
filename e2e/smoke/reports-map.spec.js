import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installReportsMocks, fakeReportEventsCancelledOnly } from '../helpers/fakeReports.js';

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
  await expect(map.getByRole('button', { name: /Belo Horizonte/i })).toHaveCount(0);
});

test('botão Como usar abre o tour do mapa', async ({ page }) => {
  await installReportsMocks(page);
  await seedAuth(page);

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  const map = page.getByTestId('brazil-visited-map');
  await expect(map).toBeVisible({ timeout: 15_000 });
  await map.getByRole('button', { name: /como usar o mapa interativo/i }).click();

  await expect(page.locator('.backstage-tour-popover')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Seu histórico geográfico')).toBeVisible();
});

test('mapa vazio quando só há eventos cancelados', async ({ page }) => {
  await installReportsMocks(page, fakeReportEventsCancelledOnly());
  await seedAuth(page);

  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  const map = page.getByTestId('brazil-visited-map');
  await expect(map.getByText(/nenhum evento ativo no mapa/i)).toBeVisible();
  await expect(map.getByRole('link', { name: /ir para agenda/i })).toBeVisible();
});
