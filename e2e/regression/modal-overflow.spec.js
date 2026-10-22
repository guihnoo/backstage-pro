import { test, expect } from '../helpers/test.js';
import { abrirEventoDemo } from '../helpers/abrirEvento.js';
import { seedAuthWithData } from '../helpers/dataMocks.js';
import { auditOverlayOverflow, scrollModalBody } from '../helpers/scrollAudit.js';

async function gotoAuthed(page, path) {
  await seedAuthWithData(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });
  await page.waitForTimeout(400);
}

test.describe('overflow em modais e sheets (mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('card do cliente abre a pagina de detalhe sem overflow (celular)', async ({ page }) => {
    await gotoAuthed(page, '/clients');
    await page.getByText('E2E Cliente Demo').first().click();
    await expect(page).toHaveURL(/\/client-detail\?id=/, { timeout: 15_000 });
    await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);
  });

  test('goals badge sheet sem overflow horizontal', async ({ page }) => {
    await gotoAuthed(page, '/goals');
    await page.getByText('Primeira Diária').click();
    await expect(page.getByText('Faça seu primeiro show')).toBeVisible({
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
    await abrirEventoDemo(page);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);
    if (audit.modalScroll) {
      expect(audit.modalScroll.horizontal).toBe(false);
    }
  });

  test('card do cliente abre a pagina de detalhe (computador)', async ({ page }) => {
    await gotoAuthed(page, '/clients');
    await page.getByText('E2E Cliente Demo').first().click();
    await expect(page).toHaveURL(/\/client-detail\?id=/, { timeout: 15_000 });
    await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

    const audit = await auditOverlayOverflow(page);
    expect(audit.docHorizontal).toBe(false);
    expect(audit.bodyHorizontal).toBe(false);
  });

  test('menu ... do cliente abre Editar sem sair da lista', async ({ page }) => {
    await gotoAuthed(page, '/clients');
    await page.getByRole('button', { name: /ações do cliente/i }).first().click();
    await page.getByRole('menuitem', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/\/clients/);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
  });
});
