// CHEGUEI / BATER SAÍDA no Início (show hoje).
// 22/10: o CHEGUEI gravava sem `work_date` (obrigatória) e o banco recusava —
// "Não foi possível registrar a entrada." no iPhone do Guih.
import { test, expect } from '../helpers/test.js';
import { seedAuthWithData, fakeEvent, E2E_EVENT_ID } from '../helpers/dataMocks.js';
import { E2E_USER_ID } from '../helpers/fakeAuth.js';

const hojeLocal = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD no fuso do aparelho

test.describe('CHEGUEI no Início', () => {
  test.setTimeout(120_000);

  test('registra a entrada e depois a saída com as colunas certas', async ({ page }) => {
    const erros = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await seedAuthWithData(page);

    const hoje = hojeLocal();
    const show = { ...fakeEvent(), start_date: hoje, end_date: hoje, event_date: hoje };
    let registro = null;
    const gravacoes = [];

    // Registradas depois do seed: têm prioridade sobre o banco falso genérico.
    await page.route('**/rest/v1/events*', (route) =>
      route.request().method() === 'GET'
        ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([show]) })
        : route.fallback()
    );
    await page.route('**/rest/v1/daily_work*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const body = req.postDataJSON();
        gravacoes.push({ metodo: 'POST', body });
        registro = { id: '00000000-0000-4000-8000-0000000000aa', ...body };
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(registro) });
      }
      if (req.method() === 'PATCH') {
        const body = req.postDataJSON();
        gravacoes.push({ metodo: 'PATCH', body });
        registro = { ...registro, ...body };
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(registro) });
      }
      const rows = registro ? [registro] : [];
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rows) });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const cheguei = page.getByRole('button', { name: /registrar entrada \(cheguei\)/i });
    await expect(cheguei).toBeVisible({ timeout: 60_000 });
    await cheguei.click();

    await expect(page.getByText(/entrada registrada às \d{2}:\d{2}/i)).toBeVisible({ timeout: 10_000 });
    const entrada = gravacoes.find((g) => g.metodo === 'POST')?.body;
    expect(entrada).toMatchObject({ user_id: E2E_USER_ID, event_id: E2E_EVENT_ID, work_date: hoje, date: hoje, status: 'pending' });
    expect(entrada.entry_time).toMatch(/^\d{2}:\d{2}$/);

    const saida = page.getByRole('button', { name: /registrar saída \(bater saída\)/i });
    await expect(saida).toBeVisible({ timeout: 10_000 });
    await saida.click();

    await expect(page.getByText(/turno encerrado/i)).toBeVisible({ timeout: 10_000 });
    const fechamento = gravacoes.find((g) => g.metodo === 'PATCH')?.body;
    expect(fechamento).toMatchObject({ status: 'completed' });
    expect(fechamento.exit_time).toMatch(/^\d{2}:\d{2}$/);
    expect(fechamento).not.toHaveProperty('total_hours', undefined);

    expect(erros).toEqual([]);
  });
});
