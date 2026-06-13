import { test, expect } from '@playwright/test';
import { seedGoogleCalendarAuth } from '../helpers/fakeGoogleCalendar.js';

test('perfil exibe Google Calendar conectado e alerta de eventos não sincronizados', async ({ page }) => {
  await seedGoogleCalendarAuth(page);

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await expect(page.getByText('Sincronização com Google Calendar')).toBeVisible();
  await expect(page.getByText('Conectado')).toBeVisible();
  await expect(page.getByText('e2e-test@gmail.com')).toBeVisible();
  await expect(page.getByRole('button', { name: /sincronizar agora/i })).toBeVisible();
  await expect(page.getByText(/ainda não enviado/i)).toBeVisible();
});

test('limpar duplicatas dispara confirmação e toast de sucesso', async ({ page }) => {
  await seedGoogleCalendarAuth(page, { dedupeRemoved: 3 });

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await page.getByRole('button', { name: /limpar duplicatas da agenda/i }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: /^limpar$/i }).click();

  await expect(page.getByText(/limpeza concluída/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/duplicata.*removida/i)).toBeVisible();
});
