import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';

test('perfil carrega com secoes editaveis', async ({ page }) => {
  await seedAuth(page);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/profile/, { timeout: 10_000 });

  // Visual All Access (21/10): crew pass + secoes renomeadas.
  await expect(page.getByText(/crew pass/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Minhas funções e cachês')).toBeVisible(); // ideia #109 (22/10)
  await expect(page.getByText('Como você registra o trabalho')).toBeVisible(); // ideia #107
  await expect(page.getByText('Meu kit de equipamento')).toBeVisible(); // ideia #113
  await expect(page.getByRole('heading', { name: 'Meus dados' })).toBeVisible();
  await expect(page.getByText('Minha meta do mês')).toBeVisible();
  await expect(page.getByLabel('Diárias')).toBeVisible();
});
