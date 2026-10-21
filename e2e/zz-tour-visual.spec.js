// TEMPORARIO (Claude, 21/10): fotos de todas as telas para o inventario do visual All Access. Apagar depois.
import { test } from '@playwright/test';
import { seedAuthWithData, E2E_CLIENT_ID } from './helpers/dataMocks.js';
import { abrirEventoDemo } from './helpers/abrirEvento.js';

const OUT = process.env.TOUR_OUT || 'test-results/tour';
const W = 390;
const H = 1800;

async function go(page, path) {
  await seedAuthWithData(page);
  await page.setViewportSize({ width: W, height: H });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByText('Carregando...').waitFor({ state: 'hidden', timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const conquista = page.getByText('Conquista desbloqueada!').first();
  if (await conquista.isVisible().catch(() => false)) {
    await page.mouse.click(8, 300);
    await page.waitForTimeout(500);
  }
}

async function shot(page, name) {
  await page.waitForTimeout(2000);
  const conquista = page.getByText('Conquista desbloqueada!').first();
  if (await conquista.isVisible().catch(() => false)) {
    await page.mouse.click(8, 300);
    await page.waitForTimeout(800);
  }
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

const PAGES = [
  ['01-inicio', '/'],
  ['02-agenda', '/calendar'],
  ['03-clientes', '/clients'],
  ['04-cliente-ficha', `/client-detail?id=${E2E_CLIENT_ID}`],
  ['05-despesas', '/expenses'],
  ['06-dinheiro', '/reports'],
  ['07-metas', '/goals'],
  ['08-perfil', '/profile'],
  ['09-mentor', '/ai-mentor'],
  ['10-ajuda', '/help'],
  ['11-privacidade', '/privacidade'],
];

test.describe('tour visual', () => {
  test.setTimeout(240_000);

  for (const [name, path] of PAGES) {
    test(name, async ({ page }) => {
      await go(page, path);
      await shot(page, name);
    });
  }

  test('janelas da agenda', async ({ page }) => {
    await go(page, '/calendar');
    await abrirEventoDemo(page).catch(() => {});
    await shot(page, '20-janela-evento');
    for (const aba of [/horas/i, /dinheiro/i]) {
      await page.getByRole('tab', { name: aba }).first().click({ timeout: 6000 }).catch(() => {});
      await shot(page, `21-janela-evento-${String(aba).replace(/\W/g, '')}`);
    }
    await go(page, '/calendar?action=new-event');
    await shot(page, '22-novo-trabalho');
    await go(page, '/calendar');
    await page.getByRole('button', { name: /^Dia \d+: E2E Cliente Demo/i }).first().click({ timeout: 6000 }).catch(() => {});
    await page.getByRole('button', { name: /^Horas$/ }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '23-registrar-horas');
    await go(page, '/calendar');
    await page.getByRole('button', { name: /^Dia \d+: E2E Cliente Demo/i }).first().click({ timeout: 6000 }).catch(() => {});
    await page.getByRole('button', { name: /^Despesa$/ }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '24-nova-despesa');
  });

  test('outras janelas', async ({ page }) => {
    await go(page, '/clients');
    await page.getByRole('button', { name: /novo/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '30-novo-cliente');
    await go(page, '/');
    await page.getByRole('button', { name: /mais/i }).last().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '31-gaveta-mais');
    await go(page, '/');
    await page.getByRole('button', { name: /buscar|pesquisar|busca/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '32-busca');
    await go(page, '/');
    await page.getByRole('button', { name: /avisos|notifica/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '33-avisos');
    await go(page, '/reports');
    await page.getByRole('tab', { name: /a receber/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '34-dinheiro-a-receber');
    await page.getByRole('button', { name: /^recebi/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '35-confirmar-recebimento');
    await go(page, '/reports');
    await page.getByRole('tab', { name: /fiscal/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '36-dinheiro-fiscal');
    await go(page, '/reports');
    await page.getByRole('tab', { name: /an[aá]lise/i }).first().click({ timeout: 6000 }).catch(() => {});
    await shot(page, '37-dinheiro-analise');
  });
});
