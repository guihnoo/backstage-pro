// Ideia #107 — modo "só entrada e saída" (bater o ponto) além da ficha completa.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test.describe('modo só entrada e saída', () => {
  test.setTimeout(120_000);

  test('Perfil grava a escolha "Só entrada e saída"', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    const gravacoes = [];
    page.on('request', (r) => {
      if (/\/rest\/v1\/profiles/.test(r.url()) && ['POST', 'PATCH'].includes(r.method())) gravacoes.push(r.postDataJSON());
    });

    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    const opcao = page.getByRole('button', { name: /só entrada e saída/i });
    await expect(opcao).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: /ficha completa/i })).toHaveAttribute('aria-pressed', 'true');
    await opcao.click();
    await expect(opcao).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('region', { name: 'Salvar alterações do perfil' }).getByRole('button', { name: /salvar alterações/i }).click();
    await expect.poll(() => gravacoes.some((g) => g?.work_log_mode === 'ponto'), { timeout: 10_000 }).toBe(true);
  });

  test('com o Perfil em ponto, Registrar horas mostra só ENTRADA e SAÍDA e grava certo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page, { work_log_mode: 'ponto' });
    await installFakeDb(page);
    let horas = null;
    page.on('request', (r) => {
      if (/\/rest\/v1\/daily_work/.test(r.url()) && r.method() === 'POST') horas = r.postDataJSON();
    });

    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    const btnHoras = page.getByRole('button', { name: /^Horas$/ }).first();
    await expect(btnHoras).toBeVisible({ timeout: 60_000 });
    await btnHoras.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByTestId('ponto-fields')).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(/^Extras$/)).toHaveCount(0);
    await expect(dialog.getByLabel('Observações')).toHaveCount(0);

    await dialog.locator('#dw-ponto-entrada').fill('18:00');
    await dialog.locator('#dw-ponto-saida').fill('23:30');
    await expect(dialog.getByText('5,5h')).toBeVisible();
    await dialog.getByRole('button', { name: /^salvar$/i }).click();

    await expect.poll(() => horas, { timeout: 10_000 }).not.toBeNull();
    expect(horas).toMatchObject({ event_id: FAKE_IDS.showHoje, entry_time: '18:00', exit_time: '23:30', status: 'completed' });
    expect(horas.work_date).toBeTruthy();
    expect(horas.daily_cache).toBeGreaterThan(0);
  });

  test('Novo trabalho grava "Só entrada e saída" só neste trabalho', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    let criado = null;
    page.on('request', (r) => {
      if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'POST') criado = r.postDataJSON();
    });

    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /novo trabalho/i }).first().click({ timeout: 60_000 });
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/novo trabalho/i).first()).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: /Palco Norte Produções/ }).first().click();
    await dialog.getByRole('group', { name: 'Escolher dias do trabalho' }).getByRole('button').nth(3).click();
    await dialog.getByRole('button', { name: /mais detalhes/i }).click();
    const ponto = dialog.getByRole('button', { name: /^só entrada e saída$/i });
    await ponto.click();
    await expect(ponto).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.getByText('Só neste trabalho.')).toBeVisible();
    await dialog.getByRole('button', { name: /^salvar$/i }).click();

    await expect.poll(() => criado, { timeout: 10_000 }).not.toBeNull();
    expect(criado).toMatchObject({ client_id: FAKE_IDS.empresa, work_log_mode: 'ponto' });
  });

  test('"Ver ficha completa" abre os campos de sempre só desta vez', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page, { work_log_mode: 'ponto' });
    await installFakeDb(page);
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Horas$/ }).first().click({ timeout: 60_000 });
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /ver ficha completa/i }).click();
    await expect(dialog.getByTestId('ponto-fields')).toHaveCount(0);
    await expect(dialog.getByLabel('Observações')).toBeVisible();
  });
});
