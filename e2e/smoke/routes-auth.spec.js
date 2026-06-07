import { test, expect } from '@playwright/test';

const protectedRoutes = ['/', '/calendar', '/clients', '/expenses', '/reports', '/profile'];

async function assertRouteGuarded(page, route) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
}

for (const route of protectedRoutes) {
  test(`rota ${route} exige autenticacao`, async ({ page }) => {
    await assertRouteGuarded(page, route);
  });
}
