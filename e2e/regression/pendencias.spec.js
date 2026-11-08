// Pendências (08/11): faixa no Início, dar baixa em vários de uma vez, saída esquecida.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed, FAKE_IDS } from '../helpers/fakeDb.js';

const localISO = (o) => { const d = new Date(); d.setDate(d.getDate() + o); return d.toLocaleDateString('sv-SE'); };

function seed() {
  const s = richSeed();
  const base = s.events.find((e) => e.id === FAKE_IDS.showAReceber);
  // Trabalho antigo esquecido (40 dias) — a data sugerida é fim + 10 dias, estimada.
  s.events.push({ ...base, id: '00000000-0000-4000-8000-000000000298', title: 'Feira antiga', start_date: localISO(-40), end_date: localISO(-40), event_date: localISO(-40), payment_due_date: null });
  return s;
}

test('Início mostra pendências e a tela dá baixa em vários de uma vez', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  await installFakeDb(page, seed());
  const baixas = [];
  page.on('request', (r) => {
    if (/\/rest\/v1\/events/.test(r.url()) && r.method() === 'PATCH' && r.postDataJSON()?.payment_status === 'paid') baixas.push(r.postDataJSON());
  });

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const banner = page.getByTestId('pendencias-banner');
  await expect(banner).toBeVisible({ timeout: 60_000 });
  await expect(banner).toContainText('para confirmar se recebeu');
  await banner.click();

  await expect(page.getByTestId('pendencias')).toBeVisible({ timeout: 15_000 });
  await page.getByRole('tab', { name: /Recebi?/ }).click();
  const itens = page.getByTestId('pendencia-item');
  await expect(itens).toHaveCount(2);
  await expect(itens.first()).toContainText('Feira antiga');
  await expect(itens.first()).toContainText('(estimada)');

  await page.getByRole('checkbox', { name: 'Selecionar todos' }).check();
  await page.getByRole('button', { name: /Já recebi \(2\)/ }).click();
  await expect.poll(() => baixas.length, { timeout: 15_000 }).toBe(2);
  const antiga = baixas.find((b) => b.paid_date === localISO(-30));
  expect(antiga).toMatchObject({ status: 'completed', paid_date_meta: { source: 'estimated' } });
  expect(baixas.find((b) => b.paid_date === localISO(0))).toMatchObject({ paid_amount: 700, paid_date_meta: { source: 'user_confirmed' } });
});

test('saída esquecida há mais de 12 h aparece e é registrada', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuth(page);
  const s = richSeed();
  s.daily_work.push({ ...s.daily_work[0], id: '00000000-0000-4000-8000-000000000399', event_id: FAKE_IDS.showAReceber, work_date: localISO(-1), date: localISO(-1), entry_time: '06:00', exit_time: null, total_hours: null, daily_cache: null });
  await installFakeDb(page, s);
  let saida = null;
  page.on('request', (r) => { if (/\/rest\/v1\/daily_work/.test(r.url()) && r.method() === 'PATCH') saida = r.postDataJSON(); });

  await page.goto('/pendencias?grupo=saidaAberta', { waitUntil: 'domcontentloaded' });
  const item = page.getByTestId('pendencia-item').first();
  await expect(item).toContainText('sem saída', { timeout: 60_000 });
  await item.getByLabel('Horário de saída').fill('18:00');
  await item.getByRole('button', { name: /Saída às 18:00/ }).click();
  await expect.poll(() => saida, { timeout: 10_000 }).toMatchObject({ exit_time: '18:00', total_hours: 12 });
});
