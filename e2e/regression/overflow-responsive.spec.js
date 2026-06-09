import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';
import {
  MOBILE_VIEWPORTS,
  APP_ROUTES,
  auditPageOverflow,
  scrollMainContainer,
} from '../helpers/scrollAudit.js';

async function gotoAppRoute(page, { path, viaHome }) {
  await seedAuth(page);

  if (viaHome) {
    await page.goto('/', { waitUntil: 'load' });
    await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
    await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  }

  const currentPath = new URL(page.url()).pathname;
  if (currentPath === path) {
    await page.reload({ waitUntil: 'load' });
  } else {
    await page.goto(path, { waitUntil: 'load' });
  }

  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await page.waitForTimeout(400);
}

test.describe('overflow horizontal (mobile)', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    for (const route of APP_ROUTES) {
      test(`${route.path} @ ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await gotoAppRoute(page, route);

        const audit = await auditPageOverflow(page);

        if (audit.docHorizontal || audit.bodyHorizontal || audit.offenders.length > 0) {
          console.log(`[overflow] ${route.path} @ ${viewport.name}`, JSON.stringify(audit, null, 2));
        }

        expect(audit.docHorizontal, `document overflow em ${route.path}`).toBe(false);
        expect(audit.bodyHorizontal, `body overflow em ${route.path}`).toBe(false);

        if (audit.main) {
          expect(audit.main.horizontal, `[data-app-scroll] overflow em ${route.path}`).toBe(false);
        }

        if (audit.offenders.length > 0) {
          const worst = audit.offenders[0];
          console.warn(
            `[overflow:warn] ${route.path} @ ${viewport.name}: ${worst.selector} (+${worst.delta}px)`
          );
        }
      });
    }
  }
});

test.describe('scroll vertical do container principal', () => {
  const longPages = [
    { path: '/', viaHome: false },
    { path: '/profile', viaHome: false },
    { path: '/goals', viaHome: false },
  ];

  for (const route of longPages) {
    test(`${route.path} rola em mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await gotoAppRoute(page, route);

      const scroll = await scrollMainContainer(page);
      expect(scroll.ok, 'main[data-app-scroll] deve existir no AppLayout').toBe(true);

      if (scroll.canScroll) {
        expect(scroll.moved, `conteúdo em ${route.path} deve rolar`).toBeGreaterThan(0);
      }
    });
  }
});
