// CONSOLE LIMPO (19/10/2026): abre cada tela (e a janela do evento) e reprova se o React
// reclamar de algo que costuma esconder bug: chave duplicada em lista, janela sem titulo,
// NaN na tela, troca de componente controlado/nao controlado.
import { test, expect } from '../helpers/test.js';
import { abrirEventoDemo } from '../helpers/abrirEvento.js';
import { seedAuthWithData } from '../helpers/dataMocks.js';
import { APP_ROUTES } from '../helpers/scrollAudit.js';

const PADROES = [
  /same key/i,
  /DialogContent.*requires a .?DialogTitle/i,
  /Missing .?Description.? or .?aria-describedby/i,
  /Received NaN/i,
  /changing an? (un)?controlled input/i,
  /Each child in a list should have a unique "key"/i,
  /Cannot update a component .* while rendering a different component/i,
];

function coletar(page) {
  const achados = [];
  page.on('console', (msg) => {
    if (!['error', 'warning'].includes(msg.type())) return;
    const txt = msg.text();
    if (PADROES.some((re) => re.test(txt))) achados.push(txt.slice(0, 400));
  });
  page.on('pageerror', (err) => achados.push('ERRO DE PAGINA: ' + String(err.message).slice(0, 400)));
  return achados;
}

async function abrir(page, path) {
  await seedAuthWithData(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 60_000 });
  await page.waitForSelector('[data-app-scroll]', { timeout: 30_000 });
  await page.waitForTimeout(1_500);
}

test.describe('console limpo (sem avisos do React)', () => {
  test.setTimeout(120_000);

  for (const route of APP_ROUTES) {
    test(`tela ${route.path}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const achados = coletar(page);
      await abrir(page, route.path);
      expect(achados, achados.join('\n---\n')).toEqual([]);
    });
  }

  test('janela do evento (Agenda)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const achados = coletar(page);
    await abrir(page, '/calendar');
    await abrirEventoDemo(page);
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(1_000);
    expect(achados, achados.join('\n---\n')).toEqual([]);
  });
});
