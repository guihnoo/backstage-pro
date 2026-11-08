// Varredura visual (07/11): foto da tela inteira a 390 px + erros de console + tempo até sair do esqueleto.
// Só com BP_CRAWL=1. Fotos em crawl-report/fotos/.
import fs from 'node:fs';
import process from 'node:process';
import { test } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test.skip(!process.env.BP_CRAWL, 'varredura: rode com BP_CRAWL=1');
test.setTimeout(120_000);

const TELAS = [
  ['inicio', '/'],
  ['agenda', '/calendar'],
  ['clientes', '/clients'],
  ['cliente-detalhe', `/client-detail?id=${FAKE_IDS.empresa}`],
  ['despesas', '/expenses'],
  ['dinheiro', '/reports'],
  ['dinheiro-receber', '/reports?aba=receber'],
  ['dinheiro-fiscal', '/reports?aba=fiscal'],
  ['dinheiro-analise', '/reports?aba=analise'],
  ['metas', '/goals'],
  ['mapa', '/mapa'],
  ['perfil', '/profile'],
  ['mentor', '/ai-mentor'],
  ['ajuda', '/help'],
  ['trabalho-hoje', `/calendar?event=${FAKE_IDS.showHoje}`],
  ['trabalho-a-receber', `/calendar?event=${FAKE_IDS.showAReceber}`],
  ['trabalho-pago', `/calendar?event=${FAKE_IDS.showPago}`],
  ['novo-trabalho', '/calendar?action=new-event'],
];

fs.mkdirSync('crawl-report/fotos', { recursive: true });

for (const [nome, url] of TELAS) {
  test(`foto ${nome}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    const erros = [];
    page.on('pageerror', (e) => erros.push('JS: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 200)); });
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('[class*="skeleton"], [class*="animate-pulse"]') && !/Carregando\.\.\./.test(document.body.innerText), null, { timeout: 30_000 }).catch(() => erros.push('ainda carregando após 30 s'));
    const ms = Date.now() - t0;
    await page.waitForTimeout(1500);
    // O app rola dentro de main[data-app-scroll]: solta a altura para a foto pegar a tela toda.
    await page.addStyleTag({ content: 'html,body,#root{height:auto!important;overflow:visible!important} main[data-app-scroll]{height:auto!important;max-height:none!important;overflow:visible!important} [role="dialog"] .bp-modal-scroll,[role="dialog"] [data-radix-scroll-area-viewport]{max-height:none!important;overflow:visible!important} [role="dialog"]{max-height:none!important;position:absolute!important}' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `crawl-report/fotos/${nome}.png`, fullPage: true });
    const texto = await page.evaluate(() => document.body.innerText);
    const suspeitos = [...new Set((texto.match(/undefined|NaN|null|\[object Object\]|Invalid Date|R\$\s*-?NaN|TODO|lorem/gi) || []))];
    fs.writeFileSync(`crawl-report/fotos/${nome}.json`, JSON.stringify({ url, ms, erros, suspeitos }, null, 2));
  });
}
