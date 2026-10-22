import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';

// Bug 22/10: o SALVAR do Perfil era "sticky" e andava pela tela ao rolar.
// Agora é uma barra presa em cima do menu de baixo, só quando há alteração.
test('perfil: barra de salvar só aparece com alteração e fica presa ao rolar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  const bar = page.getByRole('region', { name: 'Salvar alterações do perfil' });
  const goal = page.getByLabel('Diárias');
  await expect(goal).toBeVisible({ timeout: 10_000 });
  await expect(bar).toHaveCount(0);
  const original = await goal.inputValue();

  await goal.fill(original === '17' ? '18' : '17');
  await expect(bar).toBeVisible();
  await expect(bar.getByRole('button', { name: /salvar alterações/i })).toBeEnabled();

  const navTop = (await page.getByRole('navigation', { name: 'Navegação principal' }).boundingBox()).y;
  const before = await bar.boundingBox();
  expect(Math.round(before.y + before.height)).toBeLessThanOrEqual(Math.round(navTop) + 1);

  // Rola até o fim e volta: a barra não sai do lugar
  await page.locator('main[data-app-scroll]').evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForTimeout(300);
  const atBottom = await bar.boundingBox();
  await page.locator('main[data-app-scroll]').evaluate((el) => el.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const atTop = await bar.boundingBox();
  expect(Math.round(atBottom.y)).toBe(Math.round(before.y));
  expect(Math.round(atTop.y)).toBe(Math.round(before.y));

  // Voltando ao valor gravado, a barra some
  await goal.fill(original);
  await expect(bar).toHaveCount(0);
});
