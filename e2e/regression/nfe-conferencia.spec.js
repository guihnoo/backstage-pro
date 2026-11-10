// Conferência da nota fiscal (07/11): empresa pelo CNPJ/razão social e escolha do valor.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed, FAKE_IDS } from '../helpers/fakeDb.js';

function seedComNota() {
  const seed = richSeed();
  const ev = seed.events.find((e) => e.id === FAKE_IDS.showPago);
  Object.assign(ev, {
    payment_status: 'unpaid', paid: false, paid_amount: null, paid_date: null,
    nfe_numero: '777', nfe_arquivo_url: 'https://example.com/nota.pdf', nfe_arquivo_nome: 'nota.pdf',
    nfe_analise: {
      nfe_numero: '777', nfe_valor: 1234.56,
      nfe_tomador_nome: 'PNP EVENTOS E ESPETACULOS LTDA', nfe_tomador_cnpj: '12345678000190',
      cliente_reconhecido: false, valor_confere: false, divergencias: [],
    },
  });
  seed.companies = [];
  return seed;
}

test('nota com nome e valor diferentes: guardar CNPJ e usar o valor da nota', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page, seedComNota());
  const patches = [];
  page.on('request', (r) => {
    if (['PATCH', 'POST'].includes(r.method()) && /\/rest\/v1\/(events|clients|companies)/.test(r.url())) {
      patches.push({ url: r.url(), body: r.postDataJSON() });
    }
  });

  await page.goto(`/calendar?event=${FAKE_IDS.showPago}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('tab', { name: /^Dinheiro/ }).click({ timeout: 60_000 });
  const conf = dialog.getByTestId('nfe-conferencia');
  await expect(conf).toBeVisible({ timeout: 10_000 });
  await expect(conf).toContainText('O nome na nota é diferente do cadastro');
  await expect(conf).toContainText('Valor diferente');
  await expect(conf).toContainText('1.234,56');

  await conf.getByRole('button', { name: /Usar valor da nota/ }).click();
  await expect.poll(() => patches.find((p) => /events/.test(p.url) && p.body?.nfe_analise?.escolha_valor === 'nota'), { timeout: 10_000 }).toBeTruthy();
  await expect(conf.getByRole('button', { name: /Usar valor da nota/ })).toHaveAttribute('aria-pressed', 'true');

  await conf.getByRole('button', { name: /É a mesma empresa/ }).click();
  await expect.poll(() => patches.find((p) => /clients/.test(p.url) && p.body?.company_id), { timeout: 10_000 }).toBeTruthy();
  await expect(conf).toContainText('Empresa confere pelo CNPJ');
  await expect(conf).toContainText('Nota conferida');
});

// 10/11: a baixa travava — a janela apagava o valor digitado a cada recarga do trabalho.
test('confirmar recebimento com o valor da nota grava a baixa', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  const seed = seedComNota();
  seed.events.find((e) => e.id === FAKE_IDS.showPago).nfe_analise.escolha_valor = 'nota';
  await installFakeDb(page, seed);
  const patches = [];
  page.on('request', (r) => {
    if (r.method() === 'PATCH' && /\/rest\/v1\/events/.test(r.url())) patches.push(r.postDataJSON());
  });

  await page.goto(`/calendar?event=${FAKE_IDS.showPago}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Confirmar Recebimento', exact: true }).first().click({ timeout: 60_000 });
  const pay = page.getByRole('dialog', { name: 'Confirmar Recebimento' });
  await expect(pay).toBeVisible();
  const atalhos = pay.getByTestId('pagamento-atalhos');
  await expect(atalhos).toContainText('Valor da nota');
  await expect(atalhos).toContainText('Valor do app');
  await atalhos.getByRole('button', { name: /Valor da nota/ }).click();
  await expect(pay.getByLabel('Valor Real Recebido em Conta (R$)')).toHaveValue('1234,56');
  await pay.getByRole('button', { name: 'Recebi hoje', exact: true }).click();
  const ack = pay.getByRole('checkbox');
  if (await ack.count()) await ack.check();
  await pay.getByRole('button', { name: 'Confirmar Pagamento', exact: true }).click();
  await expect.poll(() => patches.find((b) => b?.payment_status === 'paid'), { timeout: 10_000 })
    .toMatchObject({ payment_status: 'paid', paid_amount: 1234.56 });
});
