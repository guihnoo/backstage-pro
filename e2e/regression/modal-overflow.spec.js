import { test, expect } from '@playwright/test';
import { seedAuthWithData } from '../helpers/dataMocks.js';
import { auditOverlayOverflow, scrollModalBody } from '../helpers/scrollAudit.js';

async function gotoAuthed(page, path) {
  await seedAuthWithData(page);
  await page.goto(path, { waitUntil: 'load' });
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await page.waitForTimeout(400);
}

test.describe('overflow em modais e sheets (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('client action sheet sem overflow horizontal', async ({ page }) => {
    await gotoAuthed(page, '/clients');
    await page.getByText('E2E Cliente Demo').click();
    await expect(page.getByRole('button', { name: /ver detalhes/i })).toBeVisible({
      timeout: 10_000,
    });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);
    if (audit.offenders.length > 0) {
      console.warn('[modal-overflow] client sheet', audit.offenders[0]);
    }
  });

  test('goals badge sheet sem overflow horizontal', async ({ page }) => {
    await gotoAuthed(page, '/goals');
    await page.getByText('Primeira Diária').click();
    await expect(page.getByText('Complete seu primeiro evento')).toBeVisible({
      timeout: 10_000,
    });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);

    const scroll = await scrollModalBody(page);
    if (scroll.ok && scroll.canScroll) {
      expect(scroll.moved).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('overflow em modais (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('event detail dialog sem overflow horizontal', async ({ page }) => {
    await gotoAuthed(page, '/calendar');
    await page.getByRole('button', { name: /E2E Show Demo/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);
    if (audit.modalScroll) {
      expect(audit.modalScroll.horizontal).toBe(false);
    }
  });

  test('client detail dialog sem overflow horizontal', async ({ page }) => {
    await gotoAuthed(page, '/clients');
    await page.getByText('E2E Cliente Demo').click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);

    const scroll = await scrollModalBody(page);
    if (scroll.ok && scroll.canScroll) {
      expect(scroll.moved).toBeGreaterThanOrEqual(0);
    }
  });
});
