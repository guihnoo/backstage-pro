// Relatório só de horas para o cliente: PDF sem nenhum valor em dinheiro (07/11).
import fs from 'node:fs';
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb, FAKE_IDS } from '../helpers/fakeDb.js';

test('janela do trabalho gera o relatório de horas sem valores', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await seedAuth(page);
  await installFakeDb(page);
  await page.goto(`/calendar?event=${FAKE_IDS.showAReceber}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('tab', { name: /^Horas/ })).toBeVisible({ timeout: 60_000 });
  await dialog.getByRole('tab', { name: /^Horas/ }).click();

  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await dialog.getByTestId('hours-report-button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Horas_.*\.pdf$/);
  const path = process.env.BP_SAVE_PDF;
  if (path) await download.saveAs(path);
  const bytes = fs.readFileSync(await download.path());
  expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
});
