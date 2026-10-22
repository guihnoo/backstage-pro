import { test, expect } from '../helpers/test.js';
import { seedGoogleCalendarAuth } from '../helpers/fakeGoogleCalendar.js';

test('Novo trabalho avisa compromisso do Google no dia escolhido', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await seedGoogleCalendarAuth(page);

  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await page.getByRole('button', { name: /novo trabalho/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(/novo trabalho/i).first()).toBeVisible({ timeout: 10_000 });

  const busyCall = page.waitForRequest((req) => {
    if (!req.url().includes('/functions/v1/google-calendar') || req.method() !== 'POST') return false;
    return req.postDataJSON()?.action === 'busy-days';
  });
  await dialog.getByRole('group', { name: 'Escolher dias do trabalho' }).getByRole('button').nth(10).click();
  const body = (await busyCall).postDataJSON();
  expect(body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  await expect(dialog.getByText('Dia ocupado no Google')).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByText(/E2E Dentista/)).toContainText('14:00–15:00');
});
