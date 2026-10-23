import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

// Auditoria 22/10: servidor que não responde deixava a tela só com blocos cinza, sem aviso.
test('tela que fica só carregando por 12 s avisa e oferece tentar de novo', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await page.route('**/rest/v1/**', (route) => { if (route.request().url().includes('/profiles')) return route.fallback(); /* nunca responde */ });
  await page.goto('/clients', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/está demorando mais que o normal/i)).toBeVisible({ timeout: 40_000 });
  await expect(page.getByRole('button', { name: /tentar de novo/i }).first()).toBeVisible();
});
