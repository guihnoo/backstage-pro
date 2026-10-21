// AUDITOR DE USO NO CELULAR (18/10/2026, pedido do Guih).
// As auditorias anteriores so liam codigo. Este teste USA o app num iPhone simulado e reprova se:
//  1) a pagina ou a janela nao deixa rolar ate o fim (conteudo cortado);
//  2) depois de fechar uma janela a tela fica sem toque / sem rolagem (precisava atualizar);
//  3) algum campo de digitar tem letra < 16px (o iPhone da zoom sozinho e nao volta).
import { test, expect } from '@playwright/test';
import { abrirEventoDemo } from '../helpers/abrirEvento.js';
import { seedAuthWithData } from '../helpers/dataMocks.js';
import { APP_ROUTES } from '../helpers/scrollAudit.js';

const PHONES = [
  { name: 'iphone-se', width: 375, height: 667 },
  { name: 'iphone-14', width: 390, height: 844 },
];

async function go(page, path) {
  await seedAuthWithData(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 20_000 });
  // Primeiro carregamento no PC pode demorar (compilacao); espera a pagina de verdade.
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 60_000 });
  await page.waitForSelector('[data-app-scroll]', { timeout: 30_000 });
  await page.waitForTimeout(500);
  // Metas mostra 'Conquista desbloqueada!' em tela cheia (trava de proposito): fecha tocando fora.
  const conquista = page.getByText('Conquista desbloqueada!').first();
  if (await conquista.isVisible().catch(() => false)) {
    await page.mouse.click(8, 300);
    await expect(conquista).toBeHidden({ timeout: 5_000 });
    await page.waitForTimeout(400);
  }
}

/** Rola o container ate o fim e diz se chegou; acusa conteudo cortado sem rolagem. */
async function auditReach(page, rootSelector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return { ok: false, reason: `nao achei ${sel}` };
    const scrollables = [root, ...root.querySelectorAll('*')].filter((el) => {
      const s = getComputedStyle(el);
      return /(auto|scroll|overlay)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 4;
    });
    const results = scrollables.map((el) => {
      el.scrollTop = el.scrollHeight;
      return { reached: el.scrollTop + el.clientHeight >= el.scrollHeight - 3, h: el.scrollHeight, c: el.clientHeight };
    });
    const rs = getComputedStyle(root);
    const clipped = rs.overflowY === 'hidden' && root.scrollHeight > root.clientHeight + 4 && scrollables.length === 0;
    const notReached = results.filter((r) => !r.reached);
    return { ok: !clipped && notReached.length === 0, clipped, notReached, scrollables: results.length };
  }, rootSelector);
}

async function openDemoEvent(page) {
  await abrirEventoDemo(page);
  // No celular o toque abre primeiro a gaveta de acoes; dela vai para o detalhe (qualquer caminho).
  const ver = page.getByRole('button', { name: /ver detalhes do evento/i }).last();
  if (await ver.waitFor({ state: 'visible', timeout: 6_000 }).then(() => true).catch(() => false)) {
    await page.waitForTimeout(1_000); // espera a gaveta parar de subir (como uma pessoa faria)
    await ver.click();
  }
}

async function bodyUsable(page) {
  return page.evaluate(() => {
    const anyOpen = document.querySelector('[role="dialog"][data-state="open"],[role="alertdialog"][data-state="open"]');
    return {
      anyOpen: !!anyOpen,
      pointerNone: getComputedStyle(document.body).pointerEvents === 'none',
      scrollLocked: document.body.hasAttribute('data-scroll-locked'),
    };
  });
}

async function smallInputs(page, scopeSelector = 'body') {
  return page.evaluate((sel) => {
    const scope = document.querySelector(sel) || document.body;
    return [...scope.querySelectorAll('input, select, textarea')]
      .filter((el) => {
        const t = (el.getAttribute('type') || '').toLowerCase();
        if (['checkbox', 'radio', 'range', 'color', 'hidden', 'file'].includes(t)) return false;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        return parseFloat(getComputedStyle(el).fontSize) < 16;
      })
      .map((el) => `${el.tagName.toLowerCase()}#${el.id || el.name || el.placeholder || '?'} (${getComputedStyle(el).fontSize})`);
  }, scopeSelector);
}

async function closeAndCheck(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900); // tempo da animacao + destrava
  const b = await bodyUsable(page);
  expect(b.anyOpen, 'janela continuou aberta').toBe(false);
  expect(b.pointerNone, 'tela ficou SEM TOQUE depois de fechar').toBe(false);
  expect(b.scrollLocked, 'rolagem ficou TRAVADA depois de fechar').toBe(false);
}

test.describe('auditor de uso no celular', () => {
  test.setTimeout(150_000);

  for (const phone of PHONES) {
    for (const route of APP_ROUTES) {
      test(`pagina ${route.path} rola ate o fim e sem zoom @ ${phone.name}`, async ({ page }) => {
        await page.setViewportSize({ width: phone.width, height: phone.height });
        await go(page, route.path);
        const reach = await auditReach(page, '[data-app-scroll]');
        expect(reach.ok, `conteudo cortado: ${JSON.stringify(reach)}`).toBe(true);
        expect(await smallInputs(page), 'campos com letra < 16px (zoom no iPhone)').toEqual([]);
      });
    }
  }

  const MODALS = [
    {
      nome: 'detalhe do evento (Agenda)',
      path: '/calendar',
      open: openDemoEvent,
      tabs: [/resumo/i, /horas/i, /dinheiro/i],
    },
    {
      nome: 'novo evento',
      path: '/calendar?action=new-event',
      open: async () => {},
    },
    {
      nome: 'novo cliente',
      path: '/clients',
      open: async (page) => page.getByRole('button', { name: /novo cliente/i }).first().click(),
    },
    {
      nome: 'nova despesa',
      path: '/expenses',
      open: async (page) => page.getByRole('button', { name: /nova despesa/i }).first().click(),
    },
  ];

  for (const m of MODALS) {
    test(`janela "${m.nome}" mostra tudo e destrava ao fechar @ iphone-se`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await go(page, m.path);
      await m.open(page);
      const dialog = page.getByRole('dialog').last();
      await expect(dialog).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(400);

      const tabs = m.tabs || [null];
      for (const tab of tabs) {
        if (tab) await dialog.getByRole('tab', { name: tab }).click();
        await page.waitForTimeout(300);
        const reach = await auditReach(page, '[role="dialog"][data-state="open"]');
        expect(reach.ok, `janela ${m.nome}${tab ? ` aba ${tab}` : ''} cortada: ${JSON.stringify(reach)}`).toBe(true);
      }
      expect(await smallInputs(page, '[role="dialog"][data-state="open"]'), 'campos com letra < 16px').toEqual([]);
      await closeAndCheck(page);

      // Depois de fechar, a pagina tem que continuar rolando normalmente.
      const reach = await auditReach(page, '[data-app-scroll]');
      expect(reach.ok, 'pagina nao rola depois de fechar a janela').toBe(true);
    });
  }

  test('abrir e fechar janelas em sequencia nao trava a tela @ iphone-se', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await go(page, '/calendar');
    for (let i = 0; i < 3; i++) {
      await openDemoEvent(page);
      await expect(page.getByRole('dialog').last()).toBeVisible({ timeout: 15_000 });
      await closeAndCheck(page);
    }
  });
});
