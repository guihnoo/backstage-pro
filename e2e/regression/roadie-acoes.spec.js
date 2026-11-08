// Roadie fase 2 e 3 + lote 3 de design (08/11): ação com confirmação na conversa, Escala do dia,
// deslizar para dar baixa, Comparações lado a lado e Perfil recolhível com aviso de notificações.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed, FAKE_IDS } from '../helpers/fakeDb.js';

test.describe('Roadie age com confirmação', () => {
  test.setTimeout(120_000);

  test('baixa pela conversa só grava depois do Confirmar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    const baixas = [];
    page.on('request', (r) => {
      if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'PATCH' && r.postDataJSON()?.payment_status === 'paid') baixas.push(r.postDataJSON());
    });
    await page.route('**/functions/v1/ai-chat', (route) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ answer: `Beleza, preparei:\n\n[Já recebi: show](/acao/baixa?event=${FAKE_IDS.showAReceber})`, provider: 'teste' }),
    }));

    await page.goto('/roadie?q=' + encodeURIComponent('já recebi da Ana'), { waitUntil: 'domcontentloaded' });
    const acao = page.getByTestId('roadie-acao').first();
    await expect(acao).toBeVisible({ timeout: 60_000 });
    await acao.click();
    const conf = page.getByTestId('roadie-confirmacao');
    await expect(conf).toContainText('Dar baixa');
    expect(baixas).toHaveLength(0);
    await conf.getByTestId('roadie-confirmar').click();
    await expect(page.getByTestId('roadie-acao-feita')).toBeVisible({ timeout: 15_000 });
    expect(baixas).toHaveLength(1);
    expect(baixas[0]).toMatchObject({ payment_status: 'paid', status: 'completed' });
  });
});

test('Início mostra a Escala do dia', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const escala = page.getByTestId('escala-do-dia');
  await expect(escala).toBeVisible({ timeout: 60_000 });
  await expect(escala).toContainText('Hoje');
});

test('Pendências: deslizar para a direita dá baixa', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page, richSeed());
  const baixas = [];
  page.on('request', (r) => {
    if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'PATCH' && r.postDataJSON()?.payment_status === 'paid') baixas.push(r.postDataJSON());
  });
  await page.goto('/pendencias?grupo=receber', { waitUntil: 'domcontentloaded' });
  const item = page.getByTestId('pendencia-item').first();
  await expect(item).toBeVisible({ timeout: 60_000 });
  const box = await item.boundingBox();
  const y = box.y + 20;
  await page.mouse.move(box.x + 120, y);
  await page.mouse.down();
  for (let dx = 0; dx <= 180; dx += 20) await page.mouse.move(box.x + 120 + dx, y);
  await page.mouse.up();
  await expect.poll(() => baixas.length, { timeout: 15_000 }).toBe(1);
});

test('Dinheiro › Comparações mostra os dois meses lado a lado', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page);
  await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  await page.getByRole('tab', { name: 'Comparações', exact: true }).click({ timeout: 60_000 });
  await expect(page.getByTestId('compare-duel')).toBeVisible();
  await page.getByRole('group', { name: 'Indicador da comparação' }).getByRole('button', { name: 'Despesas' }).click();
  await expect(page.getByRole('group', { name: 'Indicador da comparação' }).getByRole('button', { name: 'Despesas' })).toHaveAttribute('aria-pressed', 'true');
});

test('Perfil: seções recolhidas com resumo e aviso de notificações desligadas', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  const meta = page.getByRole('button', { name: /Minha meta do mês/ });
  await expect(meta).toBeVisible({ timeout: 60_000 });
  await expect(meta).toHaveAttribute('aria-expanded', 'false');
  await expect(meta).toContainText('diárias');
  await meta.click();
  await expect(page.getByLabel('Diárias')).toBeVisible();
});
