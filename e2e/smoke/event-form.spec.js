import { test, expect } from '@playwright/test';

async function assertRouteGuarded(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const redirectedToLogin = /\/login/.test(page.url());
  if (!redirectedToLogin) {
    await expect(page.getByText(/login|entrar|google/i).first()).toBeVisible();
  }
}

test('event-form nao abre sem autenticacao', async ({ page }) => {
  await assertRouteGuarded(page, '/calendar?action=new-event');
});
