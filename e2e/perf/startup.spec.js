// MEDIDOR DE VELOCIDADE (19/10/2026): abre o app ja montado (como na Vercel) num "celular medio
// com 4G ruim" e mede quanto tempo ate a tela ficar pronta e quantos KB baixou.
// Rodar com: workspace\checar-velocidade.cmd (serve o build e aponta PLAYWRIGHT_BASE_URL).
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { seedAuthWithData } from '../helpers/dataMocks.js';

const ROTAS = ['/', '/calendar', '/reports', '/clients'];
const RESULTADOS = [];

async function medir(page, path) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  // "4G ruim": 150 ms de atraso, 1,6 Mbit/s de download; CPU 4x mais lenta (celular medio).
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  let bytes = 0; let reqs = 0;
  const urls = new Map();
  let prontoJa = false;
  cdp.on('Network.responseReceived', (e) => { urls.set(e.requestId, e.response.url); });
  cdp.on('Network.loadingFinished', (e) => {
    reqs += 1; bytes += e.encodedDataLength || 0;
    const u = urls.get(e.requestId);
    if (u) urls.set(e.requestId, { u: u.u || u, kb: Math.round((e.encodedDataLength || 0) / 1024), antes: !prontoJa });
  });

  await seedAuthWithData(page);
  await page.addInitScript(() => {
    window.__longtasks = [];
    try {
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) window.__longtasks.push([Math.round(e.startTime), Math.round(e.duration)]);
      }).observe({ type: 'longtask', buffered: true });
    } catch { /* sem suporte */ }
  });
  const t0 = Date.now();
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-app-scroll]', { timeout: 90_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 90_000 });
  const pronto = Date.now() - t0;
  const prontoPerf = await page.evaluate(() => Math.round(performance.now()));
  prontoJa = true;
  const kbAtePronto = Math.round(bytes / 1024);
  await page.waitForTimeout(3_000); // o que ainda baixa logo depois (pre-carregamento)
  const lcp = await page.evaluate(() => new Promise((res) => {
    let v = 0;
    try {
      new PerformanceObserver((l) => { const es = l.getEntries(); v = es[es.length - 1]?.startTime || v; })
        .observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* sem suporte */ }
    setTimeout(() => res(Math.round(v)), 300);
  }));
  const linhaDoTempo = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const res = performance.getEntriesByType('resource')
      .map((r) => ({ u: r.name.replace(/^https?:\/\/[^/]+/, '').slice(0, 70), ini: Math.round(r.startTime), fim: Math.round(r.responseEnd) }))
      .sort((a, b) => a.fim - b.fim);
    const paints = performance.getEntriesByType('paint').map((p) => `${p.name}=${Math.round(p.startTime)}`);
    return { dcl: Math.round(nav?.domContentLoadedEventEnd || 0), paints, todos: res, total: res.length, longtasks: window.__longtasks || [] };
  });
  const arquivos = [...urls.values()].filter((x) => typeof x === 'object')
    .map((x) => ({ ...x, u: x.u.replace(/^https?:\/\/[^/]+/, '') }))
    .sort((a, b) => b.kb - a.kb);
  return {
    rota: path, pronto_ms: pronto, pronto_perf: prontoPerf, lcp_ms: lcp, kb_ate_pronto: kbAtePronto,
    kb_total_3s_depois: Math.round(bytes / 1024), pedidos: reqs, linhaDoTempo, arquivos,
  };
}

test.describe('velocidade de abertura (4G ruim + celular medio)', () => {
  test.setTimeout(180_000);
  for (const rota of ROTAS) {
    test(`abre ${rota}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const r = await medir(page, rota);
      RESULTADOS.push(r);
      console.log('VELOCIDADE ' + JSON.stringify({ ...r, arquivos: undefined }));
    });
  }
  test.afterAll(() => {
    const out = process.env.PERF_OUT;
    if (out) fs.writeFileSync(out, JSON.stringify(RESULTADOS, null, 2));
  });
});
