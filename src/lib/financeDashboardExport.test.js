import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildFinanceDashboard } from './financeDashboard';
import { buildFinanceReportHtml, openFinanceReport } from './financeDashboardExport';

const snapshot = () => buildFinanceDashboard({
  monthKey: '2026-11', today: '2026-11-20',
  events: [
    { id: 'old', title: 'Convenção', client_name: 'Sincronia', start_date: '2026-10-20', end_date: '2026-10-20', estimated_revenue: 2000, payment_status: 'paid', paid_amount: 2000, paid_date: '2026-11-05' },
    { id: 'cross', title: 'Evento contínuo', client_name: 'Aurora', start_date: '2026-10-28', end_date: '2026-11-10', estimated_revenue: 6000, payment_status: 'paid', paid_amount: 6000, paid_date: '2026-11-18' },
    { id: 'due', title: 'Festival', client_name: 'GS Eventos', start_date: '2026-11-14', end_date: '2026-11-15', estimated_revenue: 3000, payment_status: 'pending', payment_due_date: '2026-11-30' },
  ],
  expenses: [{ expense_date: '2026-11-15', amount: 1000 }],
});

afterEach(() => vi.unstubAllGlobals());

describe('financial dashboard print export', () => {
  it('prints the selected month with separate revenue, receipts, global pending and cash', () => {
    const html = buildFinanceReportHtml(snapshot());
    expect(html).toContain('Financeiro 2026-11');
    expect(html).toContain('novembro de 2026');
    expect(html).toMatch(/Faturamento do mês[^<]*<\/td><td>R\$\s*9\.000,00/);
    expect(html).toMatch(/Entrou no mês[^<]*<\/td><td>R\$\s*8\.000,00/);
    expect(html).toMatch(/Falta receber de realizados[^<]*<\/td><td>R\$\s*3\.000,00/);
    expect(html).toMatch(/Resultado de caixa[^<]*<\/td><td>R\$\s*7\.000,00/);
    expect(html).toContain('não representa saldo bancário ou lucro contábil');
    expect(html).not.toContain('Lucro líquido');
  });

  it('keeps untrusted company, event and expense text as escaped data', () => {
    const data = snapshot();
    data.billedRows[0].companyName = '<img src=x onerror=alert(1)>';
    data.billedRows[0].event.title = '<script>send()</script>';
    data.monthExpenses[0].description = 'Transporte & alimentação';
    const html = buildFinanceReportHtml(data);
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;script&gt;send()&lt;/script&gt;');
    expect(html).toContain('Transporte &amp; alimentação');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
  });

  it('keeps the title used by existing expense records in the print report', () => {
    const data = snapshot();
    data.monthExpenses[0].title = 'Uber até o local';
    data.monthExpenses[0].category = 'transporte';
    expect(buildFinanceReportHtml(data)).toContain('Uber até o local');
  });

  it('renders empty periods and data-quality warnings without fabricating entries', () => {
    const data = buildFinanceDashboard({ monthKey: '2026-12', today: '2026-11-20',
      events: [{ id: 'legacy', start_date: '2026-10-10', end_date: '2026-10-10', payment_status: 'paid', paid_amount: 200 }],
    });
    const html = buildFinanceReportHtml(data);
    expect(html).toContain('Financeiro 2026-12');
    expect(html).toContain('dezembro de 2026');
    expect(html).toContain('Nenhum registro neste recorte.');
    expect(html).toContain('sem data de pagamento');
  });

  it('reports blocked popups and prints only the supplied snapshot', () => {
    vi.stubGlobal('window', { open: vi.fn(() => null) });
    expect(() => openFinanceReport(snapshot())).toThrow('Permita abrir');
    const popup = { opener: {}, document: { open: vi.fn(), write: vi.fn(), close: vi.fn() }, focus: vi.fn(), print: vi.fn() };
    vi.stubGlobal('window', { open: vi.fn(() => popup) });
    openFinanceReport(snapshot());
    expect(popup.opener).toBeNull();
    expect(popup.document.write).toHaveBeenCalledWith(expect.stringContaining('Financeiro 2026-11'));
    expect(popup.print).toHaveBeenCalledOnce();
  });
});
