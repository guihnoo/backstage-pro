import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';
import { seedAuthWithData } from '../helpers/dataMocks.js';

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

test('vista semanal exibe colunas dos 7 dias e eventos mockados', async ({ page }) => {
  await seedAuthWithData(page);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  await page.getByTitle('Vista semanal').click();
  const weekGrid = page.locator('.grid.grid-cols-7');
  await expect(weekGrid).toBeVisible({ timeout: 10_000 });
  const eventBtn = weekGrid.getByRole('button', { name: 'E2E Show Demo' });
  await eventBtn.scrollIntoViewIfNeeded();
  await expect(eventBtn).toBeVisible({ timeout: 10_000 });
});

test('vista semanal persiste após recarregar a página', async ({ page }) => {
  await seedAuthWithData(page);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  await page.getByTitle('Vista semanal').click();
  await expect(page.locator('.grid.grid-cols-7')).toBeVisible({ timeout: 10_000 });

  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await expect(page.locator('.grid.grid-cols-7')).toBeVisible({ timeout: 10_000 });
});
