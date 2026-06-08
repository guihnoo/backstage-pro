import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

test('calendar nao fica preso em Carregando apos navegacao', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/calendar/, { timeout: 10_000 });

  // Com sessão fake a API pode falhar; o importante é sair do loading e renderizar o shell.
  const calendarShell = page
    .getByRole('link', { name: /agenda/i })
    .or(page.getByRole('heading', { name: /agenda|calendário|erro ao carregar agenda/i }))
    .or(page.getByRole('button', { name: /tentar novamente/i }));

  await expect(calendarShell.first()).toBeVisible({ timeout: 10_000 });
});
