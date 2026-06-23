import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

async function clickNavAndWait(page, label, urlPattern) {
  await page.getByRole('link', { name: label }).click();
  await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
}

async function openMaisAndNavigate(page, label, urlPattern) {
  await page.getByRole('button', { name: /mais opções/i }).click();
  await page.getByRole('button', { name: label }).first().click();
  await expect(page).toHaveURL(urlPattern, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
}

async function expectPageShell(page, shell) {
  await expect(shell(page).first()).toBeVisible({ timeout: 15_000 });
}

test('bottom nav troca pagina sem precisar de refresh', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/', { waitUntil: 'load' });
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page.getByRole('navigation').getByRole('link', { name: /^home$/i })).toBeVisible({
    timeout: 20_000,
  });
  await expectPageShell(page, (p) => p.getByRole('heading', { name: /(bom dia|boa tarde|boa noite)/i }));

  await clickNavAndWait(page, /^agenda$/i, /\/calendar/);
  await expectPageShell(page, (p) =>
    p.getByRole('heading', { name: /^agenda$/i }).or(p.getByText(/erro ao carregar agenda/i)),
  );

  await openMaisAndNavigate(page, /^metas$/i, /\/goals/);
  await expectPageShell(page, (p) =>
    p.getByRole('heading', { name: /metas & conquistas/i }).or(p.getByText(/progresso do mês/i)),
  );

  await openMaisAndNavigate(page, /^clientes$/i, /\/clients/);
  await expectPageShell(page, (p) =>
    p.getByRole('heading', { name: /clientes|erro ao carregar clientes/i }).or(
      p.getByRole('link', { name: /clientes/i }),
    ),
  );

  await clickNavAndWait(page, /^home$/i, /\/$/);
  await expectPageShell(page, (p) => p.getByRole('heading', { name: /(bom dia|boa tarde|boa noite)/i }));
});

test('apos FAB novo evento, nav continua funcionando sem refresh', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/calendar?action=new-event', { waitUntil: 'load' });
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await openMaisAndNavigate(page, /^clientes$/i, /\/clients/);
  await expectPageShell(page, (p) =>
    p.getByRole('heading', { name: /clientes|erro ao carregar clientes/i }).or(
      p.getByRole('link', { name: /clientes/i }),
    ),
  );
});
