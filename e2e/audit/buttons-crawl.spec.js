// Varredura de botões: abre cada tela (celular 390px, banco falso completo), aperta
// cada botão/link/aba, um por vez, e anota o que aconteceu. Depois aperta também o que
// apareceu com o clique (janela, aba, seção aberta) — 2º nível.
// Detecta: tela que quebra, erro de JavaScript, gravação que o banco recusaria (trava
// do helpers/test.js), rota inexistente, botão sem nome e botão que não faz nada.
// Lento: só roda com BP_CRAWL=1.
//   BP_CRAWL=1 npx playwright test e2e/audit --retries=0 --workers=3
// Relatório: crawl-report/<tela>.json (fora do git)
import fs from 'node:fs';
import process from 'node:process';
import path from 'node:path';
import { test, expect } from '../helpers/test.js';
import { seedAuth, AUTH_KEY } from '../helpers/fakeAuth.js';
import { installFakeDb, resetFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test.skip(!process.env.BP_CRAWL, 'varredura longa: rode com BP_CRAWL=1');
test.describe.configure({ mode: 'parallel' });

const ROTAS_VALIDAS = ['/', '/calendar', '/clients', '/expenses', '/reports', '/client-detail', '/goals', '/mapa', '/profile', '/help', '/ai-mentor', '/admin/feedbacks', '/admin/empresas', '/login', '/onboarding', '/privacidade', '/termos', '/fechamento'];

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
  { nome: 'ajuda', url: '/help' },
  { nome: 'mentor', url: '/ai-mentor' },
];

const CLICAVEIS = 'button, [role="button"], a[href], [role="tab"], [role="menuitem"], [role="menuitemradio"], [role="switch"], [role="checkbox"], [role="radio"], [role="option"], [role="gridcell"][tabindex], input[type="checkbox"], summary';
const IGNORAR = /^(fechar|close|cancelar|voltar|x|×|sair|dispensar)$/i;
const NAO_ABRIR_FILHOS = /^(sair|excluir minha conta)$/i;
const MAX_FILHOS = 20;

async function preparar(page, efeitos) {
  await page.addInitScript(() => {
    window.__efeitos = [];
    const anota = (tipo, valor) => window.__efeitos.push(`${tipo}: ${String(valor).slice(0, 110)}`);
    window.open = (u) => { anota('abriu fora', u); return null; };
    try { navigator.share = (d) => { anota('compartilhar', d?.url || d?.title || d?.text || ''); return Promise.resolve(); }; } catch { /* sem share */ }
    try { navigator.clipboard.writeText = (t) => { anota('copiou', t); return Promise.resolve(); }; } catch { /* sem clipboard */ }
    try { navigator.vibrate = () => true; } catch { /* sem vibrar */ }
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download || /^(blob:|data:)/.test(this.href)) { anota('baixou', this.download || this.href); return; }
      return origClick.call(this);
    };
    document.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href]');
      if (a && /^(tel:|mailto:|sms:|https?:\/\/)/i.test(a.href) && !a.href.startsWith(location.origin)) { e.preventDefault(); anota('link externo', a.href); }
    }, true);
  });
  page.on('filechooser', (fc) => efeitos.push(`abriu câmera/galeria (${fc.isMultiple() ? 'vários' : 'um arquivo'})`));
  page.on('download', (d) => efeitos.push(`baixou ${d.suggestedFilename()}`));
  page.on('dialog', (d) => { efeitos.push(`caixa do navegador: ${d.message().slice(0, 80)}`); d.dismiss().catch(() => {}); });
  await seedAuth(page);
  return installFakeDb(page);
}

// Cada visita começa do zero: banco falso e memória do aparelho (avisos dispensados etc.).
let bancoAtual = null;
async function abrir(page, url) {
  if (bancoAtual) resetFakeDb(bancoAtual);
  await page.evaluate((key) => {
    for (const k of Object.keys(localStorage)) if (k !== key) localStorage.removeItem(k);
    sessionStorage.clear();
  }, AUTH_KEY).catch(() => {});
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
  await expect(page.getByText(/^Carregando\.\.\.$/)).toHaveCount(0, { timeout: 30_000 }).catch(() => {});
  // Rola até o fim e volta: partes que só aparecem ao rolar entram na lista.
  await page.evaluate(async () => {
    const box = document.querySelector('main[data-app-scroll]') || document.scrollingElement;
    for (let y = 0; y <= box.scrollHeight; y += 450) { box.scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
    box.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
}

// ---- no navegador: listar, marcar e fotografar ----
function listarNoNavegador({ sel, escopo }) {
  const raizes = escopo ? [...document.querySelectorAll(escopo)] : [document];
  const els = [...new Set(raizes.flatMap((r) => [...r.querySelectorAll(sel)]))];
  const visivel = (el) => {
    const b = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
      && !el.closest('[aria-hidden="true"], [inert]') && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
  };
  const nome = (el) => {
    const t = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.value || '').replace(/\s+/g, ' ').trim();
    return t ? t.slice(0, 70) : `SEM NOME <${el.outerHTML.replace(/\s+/g, ' ').slice(0, 110)}>`;
  };
  return els.filter(visivel).map(nome);
}

function marcarNoNavegador({ sel, escopo, alvo, ordem }) {
  document.querySelectorAll('[data-crawl]').forEach((e) => e.removeAttribute('data-crawl'));
  const raizes = escopo ? [...document.querySelectorAll(escopo)] : [document];
  const els = [...new Set(raizes.flatMap((r) => [...r.querySelectorAll(sel)]))];
  const nome = (el) => {
    const t = (el.getAttribute('aria-label') || el.innerText || el.getAttribute('title') || el.value || '').replace(/\s+/g, ' ').trim();
    return t ? t.slice(0, 70) : `SEM NOME <${el.outerHTML.replace(/\s+/g, ' ').slice(0, 110)}>`;
  };
  const achados = els.filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && nome(el) === alvo; });
  const el = achados[ordem] || achados[0];
  if (!el) return false;
  el.setAttribute('data-crawl', '1');
  return true;
}

function fotoNoNavegador() {
  const all = document.getElementsByTagName('*');
  let classes = 0;
  for (const el of all) classes += (el.getAttribute('class') || '').length + (el.getAttribute('style') || '').length;
  return {
    url: location.pathname + location.search,
    texto: document.body.innerText.length,
    nos: all.length,
    classes,
    estados: document.querySelectorAll('[aria-pressed="true"], [aria-selected="true"], [aria-expanded="true"], [aria-checked="true"], [data-state="open"], [data-state="active"], [data-state="checked"]').length,
    janelas: document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]').length,
    efeitos: (window.__efeitos || []).length,
  };
}

async function listar(page, escopo) {
  const nomes = await page.evaluate(listarNoNavegador, { sel: CLICAVEIS, escopo });
  const vistos = new Map();
  const itens = [];
  for (const n of nomes) {
    const chave = n.replace(/\d+/g, '#').toLowerCase();
    if (vistos.has(chave)) continue;
    vistos.set(chave, true);
    itens.push(n);
  }
  return itens;
}

async function clicar(page, escopo, alvo) {
  const ok = await page.evaluate(marcarNoNavegador, { sel: CLICAVEIS, escopo, alvo, ordem: 0 });
  if (!ok) return 'sumiu da tela';
  return page.locator('[data-crawl="1"]').click({ timeout: 4000 }).then(() => null).catch((e) => e.message.split('\n')[0].slice(0, 70));
}

async function apertar(page, escopo, alvo, efeitosExternos) {
  const antes = await page.evaluate(fotoNoNavegador);
  const nExternos = efeitosExternos.length;
  const pedidos = [];
  const onReq = (r) => { if (/\/(rest|functions|storage)\/v1\//.test(r.url()) && r.method() !== 'GET' && r.method() !== 'HEAD') pedidos.push(`${r.method()} ${new URL(r.url()).pathname.replace(/.*\/v1\//, '')}`); };
  page.on('request', onReq);
  const erroClique = await clicar(page, escopo, alvo);
  await page.waitForTimeout(900);
  let depois = await page.evaluate(fotoNoNavegador);
  if (!erroClique && depois.url === antes.url && depois.texto === antes.texto && depois.nos === antes.nos && depois.classes === antes.classes) {
    // Tela seguinte carregando devagar (máquina ocupada): espera mais um pouco antes de dizer "nada".
    await page.waitForTimeout(2500);
    depois = await page.evaluate(fotoNoNavegador);
  }
  page.off('request', onReq);
  const efeitos = [...(await page.evaluate((n) => (window.__efeitos || []).slice(n), antes.efeitos)), ...efeitosExternos.slice(nExternos)];
  const quebrou = await page.getByText(/algo deu errado|oops!/i).count();

  let resultado;
  if (quebrou) resultado = 'QUEBROU A TELA';
  else if (erroClique) resultado = `não deu para clicar (${erroClique})`;
  else if (depois.url !== antes.url) {
    const rota = depois.url.split('?')[0];
    resultado = ROTAS_VALIDAS.includes(rota) ? `foi para ${depois.url}` : `ROTA INEXISTENTE ${depois.url}`;
  } else if (efeitos.length) resultado = efeitos.join(' | ');
  else if (depois.janelas > antes.janelas) resultado = 'abriu janela';
  else if (depois.janelas < antes.janelas) resultado = 'fechou janela';
  else if (depois.texto !== antes.texto || depois.nos !== antes.nos) resultado = 'mudou a tela';
  else if (depois.estados !== antes.estados || depois.classes !== antes.classes) resultado = 'mudou a seleção/aparência';
  else if (pedidos.length) resultado = 'só gravou no servidor';
  else resultado = 'NADA ACONTECEU';
  const ficou = depois.url === antes.url && !quebrou && !erroClique;
  return { resultado, gravou: [...new Set(pedidos)].slice(0, 4), ficouNaTela: ficou };
}

for (const tela of TELAS) {
  test(`varredura: ${tela.nome}`, async ({ page }) => {
    test.setTimeout(60 * 60_000);
    const errosPagina = [];
    const efeitosExternos = [];
    page.on('pageerror', (e) => errosPagina.push(e.message.slice(0, 200)));
    await page.setViewportSize({ width: 390, height: 844 });
    bancoAtual = await preparar(page, efeitosExternos);
    await abrir(page, tela.url);

    // Menu de baixo e topo só na primeira tela (são iguais em todas).
    const escopo = tela.nome === 'inicio' ? null : 'main';
    const nivel1 = await listar(page, escopo);
    const relatorio = [];
    const registra = (botao, r) => {
      relatorio.push({ botao, ...r, errosPagina: [...errosPagina] });
      errosPagina.length = 0;
    };

    for (const alvo of nivel1) {
      if (IGNORAR.test(alvo)) continue;
      await abrir(page, tela.url);
      errosPagina.length = 0;
      const antesDoClique = new Set(await listar(page, null));
      const r = await apertar(page, escopo, alvo, efeitosExternos);
      registra(alvo, r);
      if (!r.ficouNaTela || NAO_ABRIR_FILHOS.test(alvo) || /^NADA/.test(r.resultado)) continue;

      // 2º nível: o que apareceu com o clique.
      const novos = (await listar(page, null)).filter((n) => !antesDoClique.has(n) && !IGNORAR.test(n)).slice(0, MAX_FILHOS);
      for (const filho of novos) {
        await abrir(page, tela.url);
        await clicar(page, escopo, alvo);
        await page.waitForTimeout(700);
        errosPagina.length = 0;
        const r2 = await apertar(page, null, filho, efeitosExternos);
        registra(`${alvo} › ${filho}`, r2);
      }
    }

    const dir = 'crawl-report'; // fora de test-results: o Playwright limpa essa pasta a cada execução
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${tela.nome}.json`), JSON.stringify(relatorio, null, 2));
    const graves = relatorio.filter((l) => /QUEBROU|INEXISTENTE/.test(l.resultado) || l.errosPagina.length);
    expect(graves, JSON.stringify(graves, null, 2)).toEqual([]);
  });
}
