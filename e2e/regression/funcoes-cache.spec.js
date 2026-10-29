// Ideia #109 — várias funções com cachê diferente (Iluminação R$ 850, Vídeo R$ 950…).
import { test, expect } from '../helpers/test.js';
import { seedAuth, E2E_USER_ID } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed, FAKE_IDS } from '../helpers/fakeDb.js';

const PERFIL_DUAS_FUNCOES = { category: 'lighting', daily_rate: 850, role_rates: [{ category: 'video', daily_rate: 950 }] };

test.describe('várias funções com cachê diferente', () => {
  test.setTimeout(120_000);

  test('Perfil adiciona outra função com o cachê dela', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page, { category: 'lighting', daily_rate: 850 });
    await installFakeDb(page);
    const gravacoes = [];
    page.on('request', (r) => {
      if (/\/rest\/v1\/profiles/.test(r.url()) && ['POST', 'PATCH'].includes(r.method())) gravacoes.push(r.postDataJSON());
    });

    await page.goto('/profile', { waitUntil: 'domcontentloaded' });
    const bloco = page.getByTestId('outras-funcoes');
    await expect(bloco).toBeVisible({ timeout: 60_000 });
    await bloco.getByRole('button', { name: '+ Vídeo' }).click();
    await bloco.getByLabel('Cachê de Vídeo').fill('950');
    await page.getByRole('region', { name: 'Salvar alterações do perfil' }).getByRole('button', { name: /salvar alterações/i }).click();
    await expect.poll(
      () => gravacoes.some((g) => JSON.stringify(g?.role_rates) === JSON.stringify([{ category: 'video', daily_rate: 950 }])),
      { timeout: 10_000 }
    ).toBe(true);
  });

  test('Novo trabalho: escolher a função troca o cachê e grava a função', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page, PERFIL_DUAS_FUNCOES);
    await installFakeDb(page);
    let criado = null;
    page.on('request', (r) => {
      if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'POST') criado = r.postDataJSON();
    });

    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /novo trabalho/i }).first().click({ timeout: 60_000 });
    const dialog = page.getByRole('dialog');
    const funcoes = dialog.getByRole('group', { name: 'Função neste trabalho' });
    await expect(funcoes).toBeVisible({ timeout: 10_000 });
    await expect(funcoes.getByRole('button', { name: /Iluminação/ })).toHaveAttribute('aria-pressed', 'true');
    await funcoes.getByRole('button', { name: /Vídeo/ }).click();
    await expect(dialog.locator('#ef-cache')).toHaveValue(/950/);

    await dialog.getByRole('button', { name: /Palco Norte Produções/ }).first().click();
    await dialog.getByRole('group', { name: 'Escolher dias do trabalho' }).getByRole('button').nth(3).click();
    await expect(dialog.locator('#ef-cache')).toHaveValue(/950/);
    await dialog.getByRole('button', { name: /^salvar$/i }).click();

    await expect.poll(() => criado, { timeout: 10_000 }).not.toBeNull();
    expect(criado).toMatchObject({ category: 'video', daily_cache_value: 950 });
    expect(criado.category_label).toMatch(/Vídeo/);
  });

  test('Dinheiro › Análise mostra "Por função" para trabalhos encerrados com duas funções', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page, PERFIL_DUAS_FUNCOES);
    const seed = richSeed();
    const hoje = new Date().toLocaleDateString('sv-SE');
    // O faturamento só inclui encerrados. O exemplo fecha manualmente o show de hoje.
    const showEncerrado = seed.events.find((e) => e.id === FAKE_IDS.showHoje);
    showEncerrado.category = 'video';
    showEncerrado.status = 'completed';
    seed.events.push({
      ...seed.events.find((e) => e.id === FAKE_IDS.showHoje),
      id: '00000000-0000-4000-8000-000000000299',
      user_id: E2E_USER_ID,
      title: 'Luz no teatro',
      category: null,
      start_date: hoje,
      end_date: hoje,
      event_date: hoje,
      daily_cache_value: 850,
    });
    await installFakeDb(page, seed);

    await page.goto('/reports?aba=analise', { waitUntil: 'domcontentloaded' });
    const quadro = page.getByTestId('por-funcao');
    await expect(quadro).toBeVisible({ timeout: 60_000 });
    await expect(quadro).toContainText('Iluminação');
    await expect(quadro).toContainText('Vídeo');
    await expect(quadro).toContainText('900,00');
  });
});
