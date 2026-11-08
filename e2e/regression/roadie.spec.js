// Roadie (08/11): botão em todas as telas, cartões que ele prepara sozinho e pergunta com os dados reais.
import { test, expect } from '../helpers/test.js';
import { seedAuth } from '../helpers/fakeAuth.js';
import { installFakeDb } from '../helpers/fakeDb.js';

test.describe('Roadie', () => {
  test.setTimeout(120_000);

  test('botão no Início abre a gaveta com o show de hoje e leva ao CHEGUEI', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    await page.goto('/calendar', { waitUntil: 'domcontentloaded' });

    const dock = page.getByTestId('roadie-dock');
    await expect(dock).toBeVisible({ timeout: 60_000 });
    await dock.click();
    const sheet = page.getByTestId('roadie-sheet');
    await expect(sheet).toBeVisible();
    await expect(sheet.getByTestId('roadie-card').filter({ hasText: 'Hoje: Show no Allianz' })).toBeVisible({ timeout: 10_000 });
    await sheet.getByTestId('roadie-card').filter({ hasText: 'Hoje: Show no Allianz' }).getByRole('button', { name: /Ir para o CHEGUEI/ }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('pergunta da gaveta vai para o Roadie com o retrato da conta', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seedAuth(page);
    await installFakeDb(page);
    let corpo = null;
    await page.route('**/functions/v1/ai-chat', async (route) => {
      corpo = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'A Ana te deve R$ 700,00.\n\n[Dar baixa](/pendencias?grupo=receber)', provider: 'teste' }) });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByTestId('roadie-dock').click({ timeout: 60_000 });
    await page.getByLabel('Perguntar ao Roadie').fill('Quem me deve?');
    await page.getByRole('button', { name: 'Enviar pergunta ao Roadie' }).click();

    await expect(page).toHaveURL(/\/roadie/);
    await expect.poll(() => corpo, { timeout: 20_000 }).not.toBeNull();
    expect(corpo.messages.at(-1)).toMatchObject({ role: 'user', content: 'Quem me deve?' });
    expect(corpo.context).toHaveProperty('a_receber_total');
    expect(corpo.context.clientes.length).toBeGreaterThan(0);
    await page.getByTestId('roadie-acao').filter({ hasText: 'Dar baixa' }).click();
    await expect(page).toHaveURL(/\/pendencias\?grupo=receber/);
  });
});
