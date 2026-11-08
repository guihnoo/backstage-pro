// Revisão 20 (experiência no celular): vazamento para os lados e alvos de toque pequenos
// em 320 / 375 / 390 px. Relatório em crawl-report/mobile.json. Só com BP_CRAWL=1.
import fs from 'node:fs';
import process from 'node:process';
import { test } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test.skip(!process.env.BP_CRAWL, 'varredura: rode com BP_CRAWL=1');
test.describe.configure({ mode: 'serial' });
test.setTimeout(180_000);

const TELAS = [
  { nome: 'inicio', url: '/' },
  { nome: 'agenda', url: '/calendar' },
  { nome: 'clientes', url: '/clients' },
  { nome: 'cliente-detalhe', url: `/client-detail?id=${FAKE_IDS.empresa}` },
  { nome: 'despesas', url: '/expenses' },
  { nome: 'dinheiro', url: '/reports' },
  { nome: 'metas', url: '/goals' },
  { nome: 'mapa', url: '/mapa' },
  { nome: 'perfil', url: '/profile' },
  { nome: 'mentor', url: '/ai-mentor' },
  { nome: 'janela-trabalho', url: `/calendar?event=${FAKE_IDS.showHoje}` },
  { nome: 'novo-trabalho', url: '/calendar?action=new-event' },
];
const LARGURAS = [320, 375, 390];
const resultado = {};

function medir() {
  const vw = window.innerWidth;
  const scrollaveis = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if ((ox === 'auto' || ox === 'scroll' || ox === 'hidden') && p.scrollWidth > p.clientWidth + 1) return true;
    }
    return false;
  };
  const nome = (el) => (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.tagName).replace(/\s+/g, ' ').trim().slice(0, 50);
  const visivel = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[aria-hidden="true"]'); };

  const main = document.querySelector('main[data-app-scroll]');
  const vazaPagina = document.documentElement.scrollWidth > vw + 1 || (main && main.scrollWidth > main.clientWidth + 1);
  const vazando = [];
  for (const el of document.querySelectorAll('body *')) {
    if (!visivel(el)) continue;
    const b = el.getBoundingClientRect();
    if ((b.right > vw + 1 || b.left < -1) && !scrollaveis(el) && getComputedStyle(el).position !== 'fixed') {
      vazando.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 3).join('.')} (${Math.round(b.left)}→${Math.round(b.right)})`);
    }
  }
  const pequenos = [];
  for (const el of document.querySelectorAll('button, a[href], [role="button"], [role="tab"], [role="checkbox"], [role="switch"], input[type="checkbox"]')) {
    if (!visivel(el) || el.disabled) continue;
    const b = el.getBoundingClientRect();
    if (b.width < 24 || b.height < 24) {
      // Link no meio de um texto é exceção do WCAG 2.5.8
      if (el.tagName === 'A' && el.closest('p')) continue;
      pequenos.push(`${nome(el)} (${Math.round(b.width)}×${Math.round(b.height)})`);
    }
  }
  return { vazaPagina, vazando: [...new Set(vazando)].slice(0, 8), pequenos: [...new Set(pequenos)] };
}

for (const tela of TELAS) {
  test(`celular: ${tela.nome}`, async ({ page }) => {
    await seedAuth(page);
    await installFakeDb(page);
    resultado[tela.nome] = {};
    for (const w of LARGURAS) {
      await page.setViewportSize({ width: w, height: 760 });
      await page.goto(tela.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      await page.waitForTimeout(1000);
      resultado[tela.nome][w] = await page.evaluate(medir);
    }
    fs.mkdirSync('crawl-report', { recursive: true });
    fs.writeFileSync('crawl-report/mobile.json', JSON.stringify(resultado, null, 2));
  });
}
