// Ideia #106 — colar a mensagem do WhatsApp e o app preencher o trabalho.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return {
    ddmm: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    iso: d.toLocaleDateString('sv-SE'),
  };
}

async function abrirNovoTrabalho(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page);
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /novo trabalho/i }).first().click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(/novo trabalho/i).first()).toBeVisible({ timeout: 10_000 });
  return dialog;
}

test.describe('colar mensagem do WhatsApp', () => {
  test.setTimeout(120_000);

  test('preenche data, horários, local, cliente e cachê e grava', async ({ page }) => {
    const dialog = await abrirNovoTrabalho(page);
    let criado = null;
    page.on('request', (r) => {
      if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'POST') criado = r.postDataJSON();
    });
    const { ddmm, iso } = amanha();

    await dialog.getByRole('button', { name: /colar mensagem do whatsapp/i }).click();
    await dialog.getByLabel('MENSAGEM DO WHATSAPP').fill(
      `Fala! Tudo certo?\n*Show do Jorge & Mateus*\nDia ${ddmm}\nChegada 14h, show das 21h às 23h30\nLocal: Allianz Parque - São Paulo/SP\nCachê R$ 1.100,00\nProdutora: Palco Norte`
    );
    await dialog.getByRole('button', { name: /^preencher$/i }).click();

    const resumo = dialog.getByTestId('paste-result');
    await expect(resumo).toContainText('data');
    await expect(resumo).toContainText('cachê');
    await expect(dialog.getByRole('button', { name: /Palco Norte Produções/ }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(dialog.locator('#ef-title')).toHaveValue('Show do Jorge & Mateus');
    await expect(dialog.locator('#ef-cache')).toHaveValue(/1100/);

    await dialog.getByRole('button', { name: /^salvar$/i }).click();
    await expect.poll(() => criado, { timeout: 10_000 }).not.toBeNull();
    expect(criado).toMatchObject({
      client_id: FAKE_IDS.empresa,
      title: 'Show do Jorge & Mateus',
      start_date: iso,
      start_time: '14:00',
      end_time: '23:30',
      location: 'Allianz Parque - São Paulo/SP',
      location_city: 'São Paulo',
      location_state: 'SP',
      daily_cache_value: 1100,
    });
    expect(criado.observacoes_md).toContain('Produtora: Palco Norte');
  });

  test('"Desfazer" volta o formulário como estava', async ({ page }) => {
    const dialog = await abrirNovoTrabalho(page);
    await dialog.getByRole('button', { name: /colar mensagem do whatsapp/i }).click();
    await dialog.getByLabel('MENSAGEM DO WHATSAPP').fill('Festival de Verão 30/12 das 20h às 2h, cachê 800');
    await dialog.getByRole('button', { name: /^preencher$/i }).click();
    await expect(dialog.locator('#ef-title')).toHaveValue(/Festival de Verão/);
    await dialog.getByRole('button', { name: /desfazer/i }).click();
    await expect(dialog.locator('#ef-title')).toHaveValue('');
    await expect(dialog.getByRole('button', { name: /colar mensagem do whatsapp/i })).toBeVisible();
  });

  test('mensagem sem nada útil avisa e não muda nada', async ({ page }) => {
    const dialog = await abrirNovoTrabalho(page);
    await dialog.getByRole('button', { name: /colar mensagem do whatsapp/i }).click();
    await dialog.getByLabel('MENSAGEM DO WHATSAPP').fill('Oi, tudo bem?');
    await dialog.getByRole('button', { name: /^preencher$/i }).click();
    await expect(page.getByText(/não achei data, horário ou valor/i)).toBeVisible();
    await expect(dialog.getByTestId('paste-panel')).toBeVisible();
    await expect(dialog.locator('#ef-title')).toHaveValue('');
  });
});
