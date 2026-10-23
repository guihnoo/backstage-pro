import { test, expect } from '@playwright/test';
import { seedAuth, E2E_USER_ID } from '../helpers/fakeAuth.js';

// Pedido do Guih (22/10): foto do perfil por câmera, galeria ou arquivo. Foto de celular é grande:
// o app precisa reduzir antes de enviar (limite do envio: 5 MB).
test('Perfil: foto por câmera/galeria/arquivo, reduzida antes de enviar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const uploads = [];
  await page.route('**/storage/v1/object/**', async (route) => {
    if (route.request().method() === 'POST') {
      uploads.push({ size: route.request().postDataBuffer()?.length || 0, type: route.request().headers()['content-type'] });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'backstage/avatars/x.jpg' }) });
      return;
    }
    await route.continue();
  });
  await page.route('**/auth/v1/user', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ id: E2E_USER_ID, aud: 'authenticated', email: 'e2e-test@backstage.local' }),
  }));
  await seedAuth(page);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  await page.getByRole('button', { name: /trocar foto de perfil/i }).click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('button', { name: /tirar uma foto agora/i })).toBeVisible();
  await expect(sheet.getByRole('button', { name: /escolher da galeria/i })).toBeVisible();
  await expect(sheet.getByRole('button', { name: /escolher um arquivo/i })).toBeVisible();
  // a opção "câmera" abre a câmera; as outras abrem o seletor de arquivos
  await expect(sheet.locator('input[type=file][capture]')).toHaveCount(1);
  await expect(sheet.locator('input[type=file]')).toHaveCount(3);

  // "foto de celular": 3000x2000 com ruido (~vários MB, maior que o limite de 5 MB), criada dentro da página
  const bigSize = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 3000; c.height = 2000;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(3000, 2000);
    for (let i = 0; i < img.data.length; i += 4) { img.data[i] = Math.random() * 255; img.data[i + 1] = Math.random() * 255; img.data[i + 2] = Math.random() * 255; img.data[i + 3] = 255; }
    ctx.putImageData(img, 0, 0);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const input = document.querySelectorAll('[role=dialog] input[type=file]')[1];
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'IMG_0001.png', { type: 'image/png' }));
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return blob.size;
  });
  expect(bigSize).toBeGreaterThan(5 * 1024 * 1024);

  await expect.poll(() => uploads.length, { timeout: 20_000 }).toBe(1);
  expect(uploads[0].size).toBeLessThan(400 * 1024);
  await expect(page.getByText('Foto de perfil atualizada!')).toBeVisible({ timeout: 10_000 });
});
