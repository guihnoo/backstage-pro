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

async function setup(page, { work = [], visible = true, path = '/reports', events = EVENTS } = {}) {
  await page.clock.install({ time: new Date(NOW) });
  await installReportsMocks(page, events, CLIENTS);
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
  await expect(page.getByRole('heading', { name: 'DINHEIRO', exact: true })).toBeVisible({timeout:20000});
  await expect(page.getByText('Carregando...', { exact: true })).toBeHidden();
  return writes;
}


const company = (page,id)=>page.getByTestId('finance-company-'+id);
const metric = (page,id)=>page.getByTestId('finance-'+id);
const modal = page=>page.getByTestId('finance-metric-dialog');
const openMetric = (page,label)=>page.getByRole('button',{name:'Ver detalhes: '+label,exact:true}).click();
const close = page=>modal(page).getByRole('button',{name:'Fechar detalhes',exact:true}).click();

test('faturamento pertence ao encerramento e recebido ao mês do depósito',async({page})=>{
 await setup(page);
 for(const [key,value] of [['billed','9.000,00'],['received','8.000,00'],['pending','3.000,00'],['expenses','1.000,00'],['cash','7.000,00'],['upcoming','4.000,00']])await expect(metric(page,key)).toContainText(value);
 await page.getByRole('button',{name:'Mês anterior',exact:true}).click();
 await expect(metric(page,'billed')).toContainText('2.000,00');await expect(metric(page,'received')).toContainText('0,00');
 await page.getByRole('button',{name:'Próximo mês',exact:true}).click();await expect(metric(page,'billed')).toContainText('9.000,00');
 await page.getByRole('button',{name:'Próximo mês',exact:true}).click();await expect(metric(page,'billed')).toContainText('0,00');await expect(metric(page,'upcoming')).toContainText('4.000,00');
});
test('empresas preservam deep link, busca e filtros independentes',async({page})=>{
 await setup(page,{path:'/reports?aba=receber'});await expect(page.getByRole('tab',{name:/Empresas.*A receber/i})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'Pagos',exact:true}).click();await expect(company(page,'finance-aurora')).toBeVisible();await expect(company(page,'finance-gs')).toHaveCount(0);
 await page.getByRole('button',{name:'Pendentes',exact:true}).click();await expect(company(page,'finance-gs')).toBeVisible();await expect(company(page,'finance-aurora')).toHaveCount(0);
 await page.getByRole('button',{name:'Próximos',exact:true}).click();await expect(company(page,'finance-aurora')).toBeVisible();
 await page.getByRole('button',{name:'Todas',exact:true}).click();await page.getByLabel('Buscar empresa').fill('Sincronia');await expect(company(page,'finance-sincronia')).toBeVisible();await expect(company(page,'finance-gs')).toHaveCount(0);
});
test('empresa abre evento, volta à composição e exige confirmar depósito',async({page})=>{
 const writes=await setup(page,{path:'/reports?aba=receber'});await company(page,'finance-gs').click();
 await expect(modal(page)).toContainText('3.000,00');
 await modal(page).getByRole('button',{name:'Abrir evento: Palco GS novembro',exact:true}).click();await expect(modal(page)).toContainText('Valor do trabalho cadastrado');
 await modal(page).getByRole('button',{name:'Voltar à composição',exact:false}).click();await expect(modal(page)).toContainText('Evolução mensal');
 await modal(page).getByRole('button',{name:'Abrir evento: Palco GS novembro',exact:true}).click();
 await modal(page).getByRole('button',{name:'Recebi',exact:true}).click();
 const payment=page.getByRole('dialog',{name:'Confirmar Recebimento'});await expect(payment).toBeVisible();
 await expect(payment.getByLabel('Valor Real Recebido em Conta (R$)')).toHaveValue('');
 await expect(payment.getByRole('button',{name:'Confirmar Pagamento',exact:true})).toBeDisabled();
 await payment.getByLabel('Valor Real Recebido em Conta (R$)').fill('2.900,50');
 await expect(payment.getByRole('button',{name:'Confirmar Pagamento',exact:true})).toBeDisabled();
 await payment.getByRole('button',{name:'Recebi hoje',exact:true}).click();
 // This fixture may require acknowledging missing work hours before saving.
 const ack=payment.getByRole('checkbox');if(await ack.count())await ack.check();
 await expect(payment.getByRole('button',{name:'Confirmar Pagamento',exact:true})).toBeEnabled();
 await payment.getByRole('button',{name:'Cancelar',exact:true}).click();expect(writes.filter(w=>w.table==='events')).toEqual([]);
});
test('calendário abre pagamentos pelo dia cadastrado e não reparte cachê',async({page})=>{
 await setup(page);await page.getByRole('tab',{name:'Calendário',exact:true}).click();
 await page.getByTestId('finance-calendar-day-2026-11-05').click();await expect(modal(page)).toContainText('2.000,00');await expect(modal(page)).toContainText('Show Sincronia outubro');await close(page);
 await page.getByTestId('finance-calendar-day-2026-11-18').click();await expect(modal(page)).toContainText('6.000,00');await close(page);
 await page.getByRole('button',{name:'Trabalho',exact:true}).click();await page.getByTestId('finance-calendar-day-2026-11-10').click();await expect(modal(page)).toContainText('Sem registros neste dia');await expect(modal(page)).not.toContainText('6.000,00');
});
test('diária registrada mantém horas e valor próprios',async({page})=>{
 await setup(page,{work:[{id:'finance-work',user_id:E2E_USER_ID,event_id:'finance-pending',date:'2026-11-14',work_date:'2026-11-14',daily_cache:1500,start_time:'08:00',end_time:'20:00',total_hours:12,is_estimated:false}]});
 await page.getByRole('tab',{name:'Calendário',exact:true}).click();await page.getByRole('button',{name:'Trabalho',exact:true}).click();
 await expect(page.getByTestId('finance-daily-chart')).toContainText('1.500,00');
 await page.getByTestId('finance-calendar-day-2026-11-14').click();await expect(modal(page)).toContainText('1.500,00');await expect(modal(page)).toContainText('12 h registradas');await close(page);
 await page.getByTestId('finance-calendar-day-2026-11-15').click();await expect(modal(page)).not.toContainText('1.500,00');
});
test('privacidade cobre todas as oito abas e seus detalhes',async({page})=>{
 await setup(page,{visible:false});await expect(metric(page,'received')).toContainText('•••••');
 for(const name of ['Mês','Empresas · A receber','Calendário','Comparações','Próximos meses','Conferência','Fiscal','Análise']){
 await page.getByRole('tab',{name,exact:true}).click();await expect(page.getByRole('tabpanel')).not.toContainText(/(?:9|8|7|6|4|3|2|1)\.000,00/);
 }
 await page.getByRole('tab',{name:'Mês',exact:true}).click();await openMetric(page,'Entrou no mês');await expect(modal(page)).not.toContainText('8.000,00');await expect(modal(page)).toContainText('•••••');
});
test('oito abas e modais cabem em 360px e permitem rolar detalhes',async({page})=>{
 await page.setViewportSize({width:360,height:800});await setup(page);
 for(const name of ['Mês','Empresas · A receber','Calendário','Comparações','Próximos meses','Conferência','Fiscal','Análise']){
 await page.getByRole('tab',{name,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
 await page.getByRole('tab',{name:'Mês',exact:true}).click();await openMetric(page,'Entrou no mês');
 expect(await modal(page).evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);expect(await modal(page).locator('.bp-modal-scroll').evaluate(e=>getComputedStyle(e).overflowY)).toMatch(/auto|scroll/);
});
test('PDF acompanha o mês e os totais selecionados',async({page})=>{
 await setup(page);const ready=page.waitForEvent('popup');await page.getByRole('button',{name:/Exportar PDF/i}).click();const pdf=await ready;await pdf.waitForLoadState('domcontentloaded');
 for(const value of ['9.000,00','8.000,00','3.000,00'])await expect(pdf.locator('body')).toContainText(value);await pdf.close();
 await page.getByRole('button',{name:'Mês anterior',exact:true}).click();const previous=page.waitForEvent('popup');await page.getByRole('button',{name:/Exportar PDF/i}).click();const old=await previous;await old.waitForLoadState('domcontentloaded');await expect(old.locator('body')).toContainText('2.000,00');await expect(old.locator('body')).not.toContainText('9.000,00');await old.close();
});
test('recebido separa encerrados no mês de eventos de outros meses e devolve foco',async({page})=>{
 const writes=await setup(page);const trigger=page.getByRole('button',{name:'Ver detalhes: Entrou no mês',exact:true});await trigger.click();
 await expect(modal(page).getByTestId('finance-metric-total')).toContainText('8.000,00');await expect(modal(page).getByTestId('finance-metric-section-0')).toContainText('Festival contínuo Aurora');await expect(modal(page).getByTestId('finance-metric-section-1')).toContainText('Show Sincronia outubro');
 await page.keyboard.press('Escape');await expect(modal(page)).toHaveCount(0);await expect(trigger).toBeFocused();expect(writes.filter(w=>w.table!=='user_settings')).toEqual([]);
});
test('despesa e caixa abrem a composição exata do mês',async({page})=>{
 await setup(page);await openMetric(page,'Despesas do mês');await expect(modal(page)).toContainText('1.000,00');await modal(page).getByRole('button',{name:'Abrir despesa: Transporte do festival',exact:true}).click();await expect(modal(page)).toContainText('12/11/2026');await close(page);
 await openMetric(page,'Resultado de caixa do mês');await expect(modal(page).getByTestId('finance-cash-formula')).toContainText('8.000,00');await expect(modal(page)).toContainText('7.000,00');await close(page);
 await page.getByRole('button',{name:'Mês anterior',exact:true}).click();await openMetric(page,'Falta receber deste mês');await expect(modal(page)).not.toContainText('Palco GS novembro');
});
test('comparação por empresa abre os dois períodos sem base percentual inventada',async({page})=>{
 await setup(page);await page.getByRole('tab',{name:'Comparações',exact:true}).click();await page.getByLabel('Empresa da comparação').selectOption('finance-aurora');
 await expect(page.getByRole('tabpanel')).toContainText('Sem base para percentual');await page.getByRole('button',{name:'Ver detalhes: Diferença entre os períodos',exact:true}).click();
 await expect(modal(page)).toContainText('6.000,00');await expect(modal(page)).toContainText('20/11/2026');await expect(modal(page)).toContainText('20/10/2026');await expect(modal(page)).not.toContainText('Show Sincronia outubro');
});
test('evento contínuo futuro conta uma vez no fim e não vira entrada sem data',async({page})=>{
 await setup(page);await page.getByRole('tab',{name:'Próximos meses',exact:true}).click();const december=page.getByRole('tabpanel').locator('section.panel').filter({has:page.getByRole('heading',{name:'DEZEMBRO DE 2026',exact:true})});
 await december.getByRole('button',{name:'Ver detalhes: Faturamento previsto',exact:true}).click();await expect(modal(page)).toContainText('4.000,00');await expect(modal(page)).toContainText('Festival Aurora dezembro');await close(page);
 await december.getByRole('button',{name:'Ver detalhes: Recebimento com data',exact:true}).click();await expect(modal(page)).not.toContainText('Festival Aurora dezembro');
});
test('valor depositado tem prioridade e histórico sem final não contamina caixa',async({page})=>{
 const events=EVENTS.map(e=>e.id==='finance-continuous'?{...e,paid_amount:6200,paid_date_meta:{source:'estimated',days:10,original_paid_date:'2026-11-20'}}:e);
 events.push({id:'finance-unverified',user_id:E2E_USER_ID,client_id:'finance-aurora',title:'Pagamento antigo sem valor final',start_date:'2026-09-01',end_date:'2026-09-01',payment_status:'paid',paid_date:'2026-11-17',estimated_revenue:600});
 await setup(page,{events});await expect(metric(page,'received')).toContainText('8.200,00');await expect(metric(page,'cash')).toContainText('7.200,00');
 await openMetric(page,'Entrou no mês');await expect(modal(page)).toContainText('Data estimada');await expect(modal(page).getByTestId('finance-metric-section-2')).toContainText('Pagamento antigo sem valor final');await expect(modal(page).getByTestId('finance-metric-section-2')).toContainText('600,00');await close(page);
 await page.getByRole('tab',{name:'Conferência',exact:true}).click();await page.getByRole('button',{name:'Ver detalhes: Valor recebido não informado',exact:true}).click();await expect(modal(page)).toContainText('Pagamento antigo sem valor final');await close(page);
 await page.getByRole('tab',{name:'Fiscal',exact:true}).click();await expect(page.getByRole('tabpanel')).toContainText('8.200,00');
});
