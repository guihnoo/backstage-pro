import { test, expect } from '@playwright/test';
import { seedAuth } from '../helpers/fakeAuth.js';

// Logo nova (credencial): o iPhone não troca o ícone da tela inicial sozinho, então o app avisa uma vez.
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

async function openAs(page, { standalone }) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript((standaloneValue) => {
    Object.defineProperty(navigator, 'standalone', { get: () => standaloneValue, configurable: true });
  }, standalone);
  await seedAuth(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
}

test.describe('aviso de ícone novo (iPhone)', () => {
  test.use({ userAgent: IPHONE_UA });

  test('iPhone com o app instalado vê o aviso, abre os passos e dispensa para sempre', async ({ page }) => {
    await openAs(page, { standalone: true });
    await expect(page.getByText(/atualizamos o ícone do app/i)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('button', { name: /como fazer/i }).click();
    await expect(page.getByText(/adicionar à tela de início/i)).toBeVisible();

    await page.getByRole('button', { name: /já fiz/i }).click();
    await expect(page.getByText(/atualizamos o ícone do app/i)).toHaveCount(0);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('main[data-app-scroll]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/atualizamos o ícone do app/i)).toHaveCount(0);
  });

  test('iPhone abrindo pelo Safari (sem instalar) não vê o aviso', async ({ page }) => {
    await openAs(page, { standalone: false });
    await expect(page.locator('main[data-app-scroll]')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/atualizamos o ícone do app/i)).toHaveCount(0);
  });
});
