// Ideia #111 — orçamento em PDF para a produtora.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, richSeed, FAKE_IDS } from '../helpers/fakeDb.js';

test.describe('orçamento em PDF', () => {
  test.setTimeout(120_000);

  test('gera o PDF do orçamento e abre o WhatsApp do cliente com a mensagem', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    // Sem "compartilhar" do celular: cai no caminho de baixar + WhatsApp
    await page.addInitScript(() => {
      window.__abriu = [];
      window.open = (url) => { window.__abriu.push(String(url)); return null; };
      try { Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true }); } catch { /* ok */ }
    });
    await seedAuth(page);
    const seed = richSeed();
    Object.assign(seed.user_settings[0], { report_full_name: 'Guilherme Monteiro', pix_key: 'guih@pix.com', pix_key_type: 'E-mail' });
    await installFakeDb(page, seed);

    await page.goto(`/calendar?event=${FAKE_IDS.showFuturo}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: /^Dinheiro/ }).click({ timeout: 60_000 });

    const download = page.waitForEvent('download', { timeout: 30_000 });
    await page.getByRole('button', { name: 'Orçamento em PDF' }).click();
    const arquivo = await download;
    expect(arquivo.suggestedFilename()).toMatch(/^Orcamento_Palco_Norte_Producoes_ORC-\d{6}-[0-9A-F]{4}\.pdf$/);
    const caminho = await arquivo.path();
    const fs = await import('node:fs');
    const bytes = fs.readFileSync(caminho);
    expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
    expect(bytes.length).toBeGreaterThan(2000);

    await expect.poll(() => page.evaluate(() => window.__abriu), { timeout: 10_000 }).toEqual([
      expect.stringMatching(/^https:\/\/wa\.me\/5511988887777\?text=.*or%C3%A7amento/),
    ]);
  });
});
