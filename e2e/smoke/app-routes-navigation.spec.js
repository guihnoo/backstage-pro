import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

async function expectRouteShell(page, { path, shell, viaHome = false }) {
  await seedAuth(page);

  if (viaHome) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
    await page.goto(path, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto(path, { waitUntil: 'load' });
  }

  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });
  await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 10_000 });
  await expect(shell(page).first()).toBeVisible({ timeout: 10_000 });
}

test('expenses nao fica preso em Carregando', async ({ page }) => {
  await expectRouteShell(page, {
    path: '/expenses',
    shell: (p) =>
      p.getByRole('heading', { name: /gerenciador de despesas|erro ao carregar despesas/i }).or(
        p.getByRole('link', { name: /despesas/i }),
      ),
  });
});

test('goals nao fica preso em Carregando', async ({ page }) => {
  await expectRouteShell(page, {
    path: '/goals',
    shell: (p) =>
      p.getByRole('heading', { name: /metas & conquistas/i }).or(
        p.getByText(/progresso do mês/i),
      ),
  });
});

test('clients nao fica preso em Carregando', async ({ page }) => {
  await expectRouteShell(page, {
    path: '/clients',
    viaHome: true,
    shell: (p) =>
      p.getByRole('heading', { name: /clientes|erro ao carregar clientes/i }).or(
        p.getByRole('link', { name: /clientes/i }),
      ),
  });
});

test('ai-mentor nao fica preso em Carregando', async ({ page }) => {
  await expectRouteShell(page, {
    path: '/ai-mentor',
    shell: (p) =>
      p.getByRole('heading', { name: /ai mentor/i }).or(
        p.getByText(/olá,/i),
      ),
  });
});

test('reports nao fica preso em Carregando', async ({ page }) => {
  await expectRouteShell(page, {
    path: '/reports',
    shell: (p) =>
      p.getByRole('heading', { name: /relatórios|erro ao carregar dados/i }).or(
        p.getByRole('link', { name: /relatório/i }),
      ),
  });
});
