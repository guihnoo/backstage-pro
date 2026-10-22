import { test, expect } from '../helpers/test.js';
import { seedGoogleCalendarAuth } from '../helpers/fakeGoogleCalendar.js';

test('perfil exibe Google Calendar conectado e alerta de eventos não sincronizados', async ({ page }) => {
  await seedGoogleCalendarAuth(page);

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  const gcalSection = page.getByText('Sincronização com Google Calendar');
  await gcalSection.scrollIntoViewIfNeeded();
  await expect(gcalSection).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Conectado')).toBeVisible();
  await expect(page.getByText('e2e-test@gmail.com')).toBeVisible();
  await expect(page.getByRole('button', { name: /sincronizar agora/i })).toBeVisible();
  await expect(page.getByText(/ainda não enviado/i)).toBeVisible();
});

test('limpar duplicatas dispara confirmação e toast de sucesso', async ({ page }) => {
  await seedGoogleCalendarAuth(page, { dedupeRemoved: 3 });

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  const dedupeBtn = page.getByRole('button', { name: /limpar duplicatas da agenda/i });
  await dedupeBtn.scrollIntoViewIfNeeded();
  await dedupeBtn.click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: /^limpar$/i }).click();

  await expect(page.getByText(/limpeza concluída/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/duplicata.*removida/i)).toBeVisible();
});

test('opções do Google: trazer shows pede a agenda e salva no perfil', async ({ page }) => {
  await seedGoogleCalendarAuth(page);

  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  const importSwitch = page.getByRole('switch', { name: /trazer shows do google/i });
  await importSwitch.scrollIntoViewIfNeeded();
  await expect(page.getByRole('switch', { name: /enviar meus trabalhos/i })).toBeChecked();
  await expect(page.getByRole('switch', { name: /avisar se o dia estiver ocupado/i })).toBeChecked();
  await expect(importSwitch).not.toBeChecked();
  await expect(page.getByText(/última sincronização/i)).toContainText(/há 5 minutos/);

  const patch = page.waitForRequest(
    (req) => req.url().includes('/rest/v1/user_settings') && req.method() === 'PATCH',
  );
  await importSwitch.click();
  expect((await patch).postDataJSON()).toMatchObject({ google_import_enabled: true });

  const showsCalendar = page.getByLabel('Agenda dos shows');
  await expect(showsCalendar).toBeVisible();
  await expect(page.getByText(/escolha a agenda para começar/i)).toBeVisible();
  // Agenda só de leitura (feriados) dá para ler, mas não aparece para receber os trabalhos
  await expect(showsCalendar.locator('option')).toHaveCount(4);
  await expect(page.getByLabel('Agenda que recebe os trabalhos').locator('option')).toHaveCount(2);
});
