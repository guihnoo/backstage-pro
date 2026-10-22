// Ideia #113 — checklist de equipamento por show (o que levar e o que voltou) + "Meu kit".
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed, FAKE_IDS } from '../helpers/fakeDb.js';

test.describe('equipamento', () => {
  test.setTimeout(120_000);

  test('Perfil: adicionar item ao meu kit grava na hora', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    const ajustes = [];
    page.on('request', (r) => {
      if (/\/rest\/v1\/user_settings/.test(r.url()) && ['POST', 'PATCH'].includes(r.method())) ajustes.push(r.postDataJSON());
    });
    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    const kit = page.getByTestId('meu-kit');
    await expect(kit).toBeVisible({ timeout: 60_000 });
    await kit.getByLabel('Novo item do kit').fill('Mesa de luz');
    await kit.getByRole('button', { name: 'Adicionar ao kit' }).click();
    await expect(kit.getByText('Mesa de luz')).toBeVisible();
    await expect.poll(
      () => ajustes.some((a) => Array.isArray(a?.equipment_kit) && a.equipment_kit.some((i) => i.text === 'Mesa de luz')),
      { timeout: 10_000 }
    ).toBe(true);
  });

  test('show: usar meu kit, marcar na mala e marcar que voltou', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    const seed = richSeed();
    seed.user_settings[0].equipment_kit = [{ id: 'k1', text: 'Mesa de luz' }, { id: 'k2', text: 'Cabo XLR 10m' }];
    await installFakeDb(page, seed);
    const gravados = [];
    page.on('request', (r) => {
      if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'PATCH') gravados.push(r.postDataJSON());
    });

    await page.goto(`/calendar?event=${FAKE_IDS.showHoje}`, { waitUntil: 'domcontentloaded' });
    const eq = page.getByTestId('equipment-checklist');
    await expect(eq).toBeVisible({ timeout: 60_000 });
    await eq.getByRole('button', { name: 'Usar meu kit (2)' }).click();
    await expect(eq.getByRole('checkbox', { name: 'Mesa de luz' })).toHaveAttribute('aria-checked', 'false');
    await eq.getByRole('checkbox', { name: 'Mesa de luz' }).click();
    await expect(eq).toContainText('1/2 na mala');

    await eq.getByRole('tab', { name: /volta/i }).click();
    await expect(eq.getByRole('checkbox', { name: 'Cabo XLR 10m' })).toHaveCount(0);
    await eq.getByRole('checkbox', { name: 'Mesa de luz' }).click();
    await expect(eq).toContainText('1/1 voltou');

    const ultimo = gravados.filter((g) => g?.equipment_items).at(-1);
    expect(ultimo.equipment_items).toEqual([
      expect.objectContaining({ text: 'Mesa de luz', packed: true, returned: true }),
      expect.objectContaining({ text: 'Cabo XLR 10m', packed: false, returned: false }),
    ]);
  });

  test('show que já passou avisa o que falta voltar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    const seed = richSeed();
    seed.events.find((e) => e.id === FAKE_IDS.showAReceber).equipment_items = [
      { id: 'e1', text: 'Cabo XLR 10m', packed: true, returned: false },
      { id: 'e2', text: 'Mesa de luz', packed: true, returned: true },
    ];
    await installFakeDb(page, seed);
    await page.goto(`/calendar?event=${FAKE_IDS.showAReceber}`, { waitUntil: 'domcontentloaded' });
    const eq = page.getByTestId('equipment-checklist');
    await expect(eq.getByRole('alert')).toContainText('Falta voltar: Cabo XLR 10m', { timeout: 60_000 });
    await expect(eq.getByRole('tab', { name: /volta/i })).toHaveAttribute('aria-selected', 'true');
  });
});
