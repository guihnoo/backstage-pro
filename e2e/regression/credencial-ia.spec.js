// Ideia #108 — foto da credencial (e "Ler com IA" da mensagem) preenche o trabalho.
// A IA (Edge Function analyze-job) é simulada; o teste confere o que o app manda e o que faz com a resposta.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

// PNG 2x2 válido
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYGJAQoAAP//AwAVBQH+3S8aOAAAAABJRU5ErkJggg==', 'base64');

function amanhaIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('sv-SE');
}

async function abrirNovoTrabalho(page, iaResponde) {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page);
  const pedidos = [];
  await page.route('**/functions/v1/analyze-job', async (route) => {
    pedidos.push(route.request().postDataJSON());
    const { status, body } = iaResponde();
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto('/calendar', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /novo trabalho/i }).first().click({ timeout: 60_000 });
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(/novo trabalho/i).first()).toBeVisible({ timeout: 10_000 });
  return { dialog, pedidos };
}

const LEITURA = () => ({
  status: 200,
  body: {
    success: true,
    data: {
      title: 'Rock in Rio 2026', client_name: 'Palco Norte', start_date: amanhaIso(), end_date: null,
      start_time: '12:00', end_time: null, location: 'Parque Olímpico', location_city: 'Rio de Janeiro',
      location_state: 'RJ', daily_cache_value: null, function: null, notes: 'Acesso: backstage palco Mundo',
    },
  },
});

test.describe('credencial e Ler com IA', () => {
  test.setTimeout(120_000);

  test('foto da credencial: manda JPEG comprimido e preenche o trabalho', async ({ page }) => {
    const { dialog, pedidos } = await abrirNovoTrabalho(page, LEITURA);
    let criado = null;
    page.on('request', (r) => {
      if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'POST') criado = r.postDataJSON();
    });

    await dialog.getByTestId('credential-input').setInputFiles({ name: 'credencial.png', mimeType: 'image/png', buffer: PNG });
    await expect(dialog.getByTestId('paste-result')).toContainText('Preenchido pela credencial', { timeout: 15_000 });

    expect(pedidos).toHaveLength(1);
    expect(pedidos[0]).toMatchObject({ mode: 'image', mime_type: 'image/jpeg' });
    expect(pedidos[0].image_base64.length).toBeGreaterThan(50);
    expect(pedidos[0].clients).toContain('Palco Norte Produções');

    await expect(dialog.locator('#ef-title')).toHaveValue('Rock in Rio 2026');
    await expect(dialog.getByRole('button', { name: /Palco Norte Produções/ }).first()).toHaveAttribute('aria-pressed', 'true');

    await dialog.getByRole('button', { name: /^salvar$/i }).click();
    await expect.poll(() => criado, { timeout: 10_000 }).not.toBeNull();
    expect(criado).toMatchObject({
      client_id: FAKE_IDS.empresa, title: 'Rock in Rio 2026', start_date: amanhaIso(), start_time: '12:00',
      location: 'Parque Olímpico', location_city: 'Rio de Janeiro', location_state: 'RJ',
    });
    expect(criado.observacoes_md).toContain('backstage palco Mundo');
  });

  test('"Ler com IA" na mensagem colada', async ({ page }) => {
    const { dialog, pedidos } = await abrirNovoTrabalho(page, LEITURA);
    await dialog.getByRole('button', { name: /colar mensagem do whatsapp/i }).click();
    await dialog.getByLabel('MENSAGEM DO WHATSAPP').fill('vc topa o rock in rio? amanhã, chega meio dia no parque olímpico, quem paga é a palco norte');
    await dialog.getByRole('button', { name: /ler com ia/i }).click();
    await expect(dialog.getByTestId('paste-result')).toContainText('Preenchido pela mensagem', { timeout: 15_000 });
    expect(pedidos[0]).toMatchObject({ mode: 'text' });
    expect(pedidos[0].text).toContain('rock in rio');
    await expect(dialog.locator('#ef-title')).toHaveValue('Rock in Rio 2026');
  });

  test('IA fora do ar: avisa e não muda nada', async ({ page }) => {
    const { dialog } = await abrirNovoTrabalho(page, () => ({ status: 500, body: { error: 'Gemini 503' } }));
    await dialog.getByTestId('credential-input').setInputFiles({ name: 'credencial.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByText(/não deu para ler a credencial agora/i)).toBeVisible({ timeout: 15_000 });
    await expect(dialog.locator('#ef-title')).toHaveValue('');
    await expect(dialog.getByRole('button', { name: /foto da credencial/i })).toBeVisible();
  });
});
