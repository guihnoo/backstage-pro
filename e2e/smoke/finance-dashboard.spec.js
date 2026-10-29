import { test, expect } from '../helpers/test.js';
import { AUTH_KEY, E2E_USER_ID, fakeSession, seedAuth } from '../helpers/fakeAuth.js';
import { fakeReportClients, installReportsMocks } from '../helpers/fakeReports.js';

const NOW = '2026-11-20T15:00:00.000Z';
const CLIENTS = [
  { ...fakeReportClients()[0], id: 'finance-aurora', name: 'Aurora', company: 'Aurora' },
  { ...fakeReportClients()[1], id: 'finance-gs', name: 'GS Eventos', company: 'GS Eventos' },
  { ...fakeReportClients()[0], id: 'finance-sincronia', name: 'Sincronia', company: 'Sincronia' },
];
const EVENTS = [
  {
    id: 'finance-continuous', user_id: E2E_USER_ID, client_id: 'finance-aurora',
    title: 'Festival contínuo Aurora', start_date: '2026-10-28', end_date: '2026-11-10',
    status: 'completed', estimated_revenue: 6000, actual_revenue: 6000,
    payment_status: 'paid', paid_amount: 6000, paid_date: '2026-11-18',
  },
  {
    id: 'finance-pending', user_id: E2E_USER_ID, client_id: 'finance-gs',
    title: 'Palco GS novembro', start_date: '2026-11-14', end_date: '2026-11-15',
    status: 'completed', estimated_revenue: 3000, actual_revenue: 3000,
    payment_status: 'pending', payment_due_date: '2026-11-30',
  },
  {
    id: 'finance-old-paid', user_id: E2E_USER_ID, client_id: 'finance-sincronia',
    title: 'Show Sincronia outubro', start_date: '2026-10-20', end_date: '2026-10-20',
    status: 'completed', estimated_revenue: 2000, actual_revenue: 2000,
    payment_status: 'paid', paid_amount: 2000, paid_date: '2026-11-05',
  },
  {
    id: 'finance-upcoming', user_id: E2E_USER_ID, client_id: 'finance-aurora',
    title: 'Festival Aurora dezembro', start_date: '2026-11-28', end_date: '2026-12-02',
    status: 'confirmed', estimated_revenue: 4000, payment_status: 'pending',
  },
];
const EXPENSES = [{
  id: 'finance-expense', user_id: E2E_USER_ID, event_id: 'finance-continuous',
  title: 'Transporte do festival', amount: 1000, expense_date: '2026-11-12',
  category: 'transporte',
}];

async function setup(page, { work = [], visible = true, path = '/reports' } = {}) {
  await page.clock.install({ time: new Date(NOW) });
  await installReportsMocks(page, EVENTS, CLIENTS);
  const writes = [];
  let settings = { user_id: E2E_USER_ID, financial_visibility: visible };
  // This last handler catches every REST mutation before helper routes can
  // continue it. Unknown reads are local too; no real financial data is used.
  await page.route(/\/rest\/v1\//, async (route) => {
    const request = route.request();
    const table = new URL(request.url()).pathname.split('/rest/v1/')[1].split('/')[0];
    const method = request.method();
    const single = (request.headers().accept || '').includes('application/vnd.pgrst.object+json');
    const json = (body, status = 200) => route.fulfill({
      status, contentType: 'application/json', body: JSON.stringify(body),
    });
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      writes.push({ table, method });
      if (table === 'user_settings') {
        const payload = request.postDataJSON();
        settings = { ...settings, ...(Array.isArray(payload) ? payload[0] : payload) };
        return json(single ? settings : [settings]);
      }
      return json({ message: 'Real REST writes are blocked in finance E2E' }, 403);
    }
    if (table === 'user_settings') return json(single ? settings : [settings]);
    if (table === 'daily_work') return json(work);
    if (table === 'expenses') return json(EXPENSES);
    if (table === 'events' || table === 'clients' || table === 'profiles') return route.fallback();
    return json(single ? null : []);
  });
  await page.route(/\/auth\/v1\//, async (route) => {
    const session = fakeSession();
    session.expires_at = Math.floor(Date.parse(NOW) / 1000) + 86400;
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify(route.request().url().includes('/user') ? session.user : session),
    });
  });
  await seedAuth(page);
  // fakeSession uses the runner's real clock, while this browser is in November.
  await page.evaluate(({ key, now }) => {
    const session = JSON.parse(localStorage.getItem(key));
    session.expires_at = Math.floor(Date.parse(now) / 1000) + 86400;
    localStorage.setItem(key, JSON.stringify(session));
  }, { key: AUTH_KEY, now: NOW });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'DINHEIRO', exact: true })).toBeVisible();
  await expect(page.getByText('Carregando...', { exact: true })).toBeHidden();
  return writes;
}

const company = (page, id) => page.getByTestId('finance-company-' + id);
const metric = (page, id) => page.getByTestId('finance-' + id);

test('faturamento fecha no fim do evento e recebimentos seguem a data paga', async ({ page }) => {
  await setup(page);
  await expect(metric(page, 'billed')).toContainText('9.000,00');
  await expect(metric(page, 'received')).toContainText('8.000,00');
  await expect(metric(page, 'pending')).toContainText('3.000,00');
  await expect(metric(page, 'expenses')).toContainText('1.000,00');
  await expect(metric(page, 'upcoming')).toContainText('4.000,00');
  await expect(metric(page, 'cash')).toContainText('7.000,00');
  await expect(page.getByTestId('finance-expense-ledger')).toContainText('Transporte do festival');
  await expect(page.getByTestId('finance-expense-ledger')).toContainText('1.000,00');

  await page.getByRole('button', { name: 'Mês anterior', exact: true }).click();
  await expect(metric(page, 'billed')).toContainText('2.000,00');
  await expect(metric(page, 'received')).toContainText('0,00');
  await page.getByRole('button', { name: 'Próximo mês', exact: true }).click();
  await expect(metric(page, 'billed')).toContainText('9.000,00');
  await expect(metric(page, 'received')).toContainText('8.000,00');
  await page.getByRole('button', { name: 'Próximo mês', exact: true }).click();
  await expect(metric(page, 'billed')).toContainText('0,00');
  await expect(metric(page, 'received')).toContainText('0,00');
  await expect(metric(page, 'upcoming')).toContainText('4.000,00');
});

test('empresas filtram pago, pendente e futuro de forma independente e preservam deep link', async ({ page }) => {
  await setup(page, { path: '/reports?aba=receber' });
  await expect(page.getByRole('tab', { name: /Empresas.*A receber/i })).toHaveAttribute('aria-selected', 'true');
  await expect(company(page, 'finance-aurora')).toBeVisible();
  await expect(company(page, 'finance-gs')).toBeVisible();
  await expect(company(page, 'finance-sincronia')).toBeVisible();

  await page.getByRole('button', { name: 'Pagos', exact: true }).click();
  await expect(company(page, 'finance-aurora')).toBeVisible();
  await expect(company(page, 'finance-sincronia')).toBeVisible();
  await expect(company(page, 'finance-gs')).toHaveCount(0);

  await page.getByRole('button', { name: 'Pendentes', exact: true }).click();
  await expect(company(page, 'finance-gs')).toBeVisible();
  await expect(company(page, 'finance-aurora')).toHaveCount(0);
  await page.getByRole('button', { name: 'Próximos', exact: true }).click();
  await expect(company(page, 'finance-aurora')).toBeVisible();
  await expect(company(page, 'finance-gs')).toHaveCount(0);

  await page.getByRole('button', { name: 'Todas', exact: true }).click();
  await page.getByLabel('Buscar empresa').fill('Sincronia');
  await expect(company(page, 'finance-sincronia')).toBeVisible();
  await expect(company(page, 'finance-aurora')).toHaveCount(0);
});

test('empresa abre detalhes reais do evento e Recebi abre confirmação sem gravar', async ({ page }) => {
  const writes = await setup(page, { path: '/reports?aba=receber' });
  await company(page, 'finance-gs').click();
  const detail = page.getByTestId('finance-company-detail');
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('3.000,00');
  await detail.getByRole('button', { name: 'Abrir evento: Palco GS novembro', exact: true }).click();
  const eventDialog = page.getByRole('dialog');
  await expect(eventDialog).toBeVisible();
  await expect(eventDialog).toContainText('Palco GS novembro');
  await page.keyboard.press('Escape');
  await expect(eventDialog).toBeHidden();

  await detail.getByRole('button', { name: 'Recebi', exact: true }).click();
  const paymentDialog = page.getByRole('dialog', { name: 'Confirmar Recebimento' });
  await expect(paymentDialog).toBeVisible();
  await expect(paymentDialog.getByLabel('Valor Real Recebido em Conta (R$)')).toHaveValue('3000,00');
  await paymentDialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(paymentDialog).toBeHidden();
  expect(writes.filter((write) => write.table === 'events')).toEqual([]);
});

test('calendário mostra pagamentos nos dias reais sem repartir cachê fechado', async ({ page }) => {
  await setup(page);
  await page.getByRole('tab', { name: 'Calendário', exact: true }).click();
  await page.getByRole('button', { name: 'Recebimentos', exact: true }).click();
  await page.getByTestId('finance-calendar-day-2026-11-05').click();
  await expect(page.getByTestId('finance-day-detail')).toContainText('2.000,00');
  await expect(page.getByTestId('finance-day-detail')).toContainText('Show Sincronia outubro');
  await page.getByTestId('finance-calendar-day-2026-11-18').click();
  await expect(page.getByTestId('finance-day-detail')).toContainText('6.000,00');
  await expect(page.getByTestId('finance-day-detail')).toContainText('Festival contínuo Aurora');

  await page.getByRole('button', { name: 'Trabalho', exact: true }).click();
  await page.getByTestId('finance-calendar-day-2026-11-10').click();
  await expect(page.getByTestId('finance-day-detail')).not.toContainText('6.000,00');
  await expect(page.getByTestId('finance-day-detail')).not.toContainText('1.500,00');
});

test('ganho diário usa registro explícito sem inventar diária nos outros dias', async ({ page }) => {
  await setup(page, { work: [{
    id: 'finance-work', user_id: E2E_USER_ID, event_id: 'finance-pending',
    date: '2026-11-14', work_date: '2026-11-14', daily_cache: 1500,
    start_time: '08:00', end_time: '20:00', total_hours: 12, is_estimated: false,
  }] });
  await page.getByRole('tab', { name: 'Calendário', exact: true }).click();
  await page.getByRole('button', { name: 'Trabalho', exact: true }).click();
  await page.getByTestId('finance-calendar-day-2026-11-14').click();
  await expect(page.getByTestId('finance-day-detail')).toContainText('1.500,00');
  await expect(page.getByTestId('finance-day-detail')).toContainText('12 h registradas');
  await expect(page.getByTestId('finance-daily-chart')).toContainText('Ganhos diários registrados');
  await expect(page.getByTestId('finance-daily-chart')).toContainText('1.500,00');
  await expect(page.getByTestId('finance-day-detail')).toContainText('Palco GS novembro');
  await page.getByTestId('finance-calendar-day-2026-11-15').click();
  await expect(page.getByTestId('finance-day-detail')).not.toContainText('1.500,00');
});

test('privacidade oculta valores em métricas, empresas e calendário', async ({ page }) => {
  await setup(page, { visible: false });
  await expect(metric(page, 'billed')).toContainText('•••••');
  const assertNoAmounts = async () => {
    const screen = page.locator('main[data-app-scroll]');
    await expect(screen).not.toContainText(/(?:9|8|7|6|4|3|2|1)\.000,00/);
    const exposed = await screen.locator('[aria-label], [title]').evaluateAll((elements) =>
      elements.map((element) => [element.getAttribute('aria-label'), element.getAttribute('title')].join(' ')).join(' ')
    );
    expect(exposed).not.toMatch(/(?:9|8|7|6|4|3|2|1)\.000,00/);
  };
  await assertNoAmounts();
  await page.getByRole('tab', { name: /Empresas.*A receber/i }).click();
  await company(page, 'finance-aurora').click();
  await assertNoAmounts();
  await page.getByRole('tab', { name: 'Calendário', exact: true }).click();
  await page.getByRole('button', { name: 'Recebimentos', exact: true }).click();
  await page.getByTestId('finance-calendar-day-2026-11-18').click();
  await assertNoAmounts();
});

test('financeiro cabe em 360px com todas as abas acessíveis', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await setup(page);
  for (const name of ['Mês', 'Empresas · A receber', 'Calendário', 'Fiscal', 'Análise']) {
    await page.getByRole('tab', { name, exact: true }).click();
    await expect(page.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('exportação usa mês selecionado e valores do mesmo painel', async ({ page }) => {
  await setup(page);
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Exportar PDF/i }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.locator('body')).toContainText(/novembro/i);
  await expect(popup.locator('body')).toContainText('9.000,00');
  await expect(popup.locator('body')).toContainText('8.000,00');
  await expect(popup.locator('body')).toContainText('3.000,00');
  await popup.close();
  await page.getByRole('button', { name: 'Mês anterior', exact: true }).click();
  const previousPopupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: /Exportar PDF/i }).click();
  const previousPopup = await previousPopupPromise;
  await previousPopup.waitForLoadState('domcontentloaded');
  await expect(previousPopup.locator('body')).toContainText(/outubro/i);
  await expect(previousPopup.locator('body')).toContainText('2.000,00');
  await expect(previousPopup.locator('body')).not.toContainText('9.000,00');
  await previousPopup.close();
});
