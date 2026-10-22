import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

// Revisão 22/10: a Política de Privacidade promete excluir a conta, mas o app não tinha o botão.
test('Perfil: excluir minha conta pede EXCLUIR, chama o servidor e volta ao login', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let called = null;
  await page.route('**/functions/v1/delete-account', async (route) => {
    called = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, removed_files: 2 }) });
  });
  await page.route('**/auth/v1/logout**', (route) => route.fulfill({ status: 204, body: '' }));
  await seedAuth(page);
  await page.goto('/profile', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 15_000 });

  const open = page.getByRole('button', { name: /excluir minha conta/i });
  await open.scrollIntoViewIfNeeded();
  await open.click();

  const dialog = page.getByRole('alertdialog');
  await expect(dialog.getByText('Excluir minha conta?')).toBeVisible();
  const confirm = dialog.getByRole('button', { name: /excluir para sempre/i });
  await expect(confirm).toBeDisabled();

  await dialog.getByLabel(/digite excluir/i).fill('excluir');
  await expect(confirm).toBeEnabled();
  await confirm.click();

  await expect.poll(() => called?.confirm).toBe('EXCLUIR');
  await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
});
