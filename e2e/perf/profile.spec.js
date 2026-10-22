// PERFIL DE CPU da abertura do Inicio (diagnostico): mostra onde o celular gasta tempo.
import { test, expect } from '../helpers/test.js';
import fs from 'node:fs';
import { seedAuthWithData } from '../helpers/dataMocks.js';

test('perfil de CPU ao abrir /', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await seedAuthWithData(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-app-scroll]', { timeout: 90_000 });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 90_000 });
  const { profile } = await cdp.send('Profiler.stop');

  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas;
  profile.samples.forEach((id, i) => {
    const n = byId.get(id);
    const cf = n.callFrame;
    const file = (cf.url || '(nativo)').replace(/^https?:\/\/[^/]+/, '');
    const key = `${file} :: ${cf.functionName || '(anonima)'}`;
    self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
  });
  const porArquivo = new Map();
  for (const [k, v] of self) { const f = k.split(' :: ')[0]; porArquivo.set(f, (porArquivo.get(f) || 0) + v); }
  const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${Math.round(v)}ms ${k}`);
  const out = { porArquivo: top(porArquivo, 25), porFuncao: top(self, 40) };
  fs.writeFileSync(process.env.PERF_OUT || 'perfil.json', JSON.stringify(out, null, 2));
});
