import { describe, expect, it } from 'vitest';
import { addDays, format } from 'date-fns';
import {
  buildMarkPaidUpdate,
  buildMarkUnpaidUpdate,
  buildWorkByEvent,
  distributePaidAmount,
  expensesInPeriod,
  getEventReceivedAmount,
  getEventReceivedDate,
  hoursInPeriod,
  isDateInRange,
  monthKeyRange,
  monthRange,
  paidEventsInPeriod,
  projectedEventsInPeriod,
  projectedInPeriod,
  receivedInPeriod,
  sumExpenses,
  toDateKey,
  workInPeriod,
  yearRange,
} from './financeMetrics';

const JUNE = { start: '2026-06-01', end: '2026-06-30' };
const today = format(new Date(), 'yyyy-MM-dd');
const inDays = (n) => format(addDays(new Date(), n), 'yyyy-MM-dd');

describe('datas e períodos', () => {
  it('toDateKey aceita data, datetime e Date local', () => {
    expect(toDateKey('2026-06-20')).toBe('2026-06-20');
    expect(toDateKey('2026-06-20T23:30:00Z')).toBe('2026-06-20');
    expect(toDateKey(new Date(2026, 5, 20, 23, 30))).toBe('2026-06-20');
  });

  it('toDateKey devolve null para ausente ou inválido', () => {
    expect(toDateKey(null)).toBeNull();
    expect(toDateKey('')).toBeNull();
    expect(toDateKey('20/06/2026')).toBeNull();
    expect(toDateKey(new Date('x'))).toBeNull();
  });

  it('monthRange cobre do dia 1 ao último dia', () => {
    expect(monthRange(new Date(2026, 1, 10))).toEqual({ start: '2026-02-01', end: '2026-02-28' });
    expect(monthKeyRange('2026-12')).toEqual({ start: '2026-12-01', end: '2026-12-31' });
    expect(yearRange(2026)).toEqual({ start: '2026-01-01', end: '2026-12-31' });
  });

  it('isDateInRange é inclusivo e aceita limites Date', () => {
    expect(isDateInRange('2026-06-01', JUNE)).toBe(true);
    expect(isDateInRange('2026-06-30', JUNE)).toBe(true);
    expect(isDateInRange('2026-07-01', JUNE)).toBe(false);
    expect(
      isDateInRange('2026-06-30', { start: new Date(2026, 5, 1), end: new Date(2026, 5, 30, 23, 59) })
    ).toBe(true);
  });

  it('período aberto inclui qualquer data válida, nunca data ausente', () => {
    const open = { start: null, end: null };
    expect(isDateInRange('2019-01-01', open)).toBe(true);
    expect(isDateInRange(null, open)).toBe(false);
  });
});

describe('getEventReceivedAmount — valor canônico do recebido', () => {
  it('usa paid_amount quando informado', () => {
    expect(getEventReceivedAmount({ paid_amount: 1800, estimated_revenue: 2000 })).toBe(1800);
  });

  it('paid_amount 0 é valor válido (não cai no cachê)', () => {
    expect(getEventReceivedAmount({ paid_amount: 0, estimated_revenue: 2000 })).toBe(0);
  });

  it('sem paid_amount cai no valor do evento', () => {
    expect(getEventReceivedAmount({ paid_amount: null, estimated_revenue: 2000 })).toBe(2000);
    expect(getEventReceivedAmount({ estimated_revenue: 2000 })).toBe(2000);
  });

  it('sem paid_amount usa o valor que estava em "A receber" (horas registradas)', () => {
    const event = { paid_amount: null, estimated_revenue: 2000 };
    expect(getEventReceivedAmount(event, [{ daily_cache: 1200 }, { daily_cache: 1000 }])).toBe(2200);
  });

  it('sem paid_amount, actual_revenue (valor ajustado do fluxo antigo) vence as horas', () => {
    const event = { paid_amount: null, actual_revenue: 1900, estimated_revenue: 2000 };
    expect(getEventReceivedAmount(event, [{ daily_cache: 2200 }])).toBe(1900);
  });

  it('paid_amount numérico em string é aceito', () => {
    expect(getEventReceivedAmount({ paid_amount: '1500.50' })).toBe(1500.5);
  });
});

describe('recebido por período — competência paid_date', () => {
  const paid = (overrides) => ({ id: 'e', payment_status: 'paid', status: 'confirmed', ...overrides });

  it('show de maio pago em junho conta em junho', () => {
    const events = [paid({ start_date: '2026-05-28', paid_date: '2026-06-03', paid_amount: 3000 })];
    expect(receivedInPeriod(events, JUNE)).toBe(3000);
    expect(receivedInPeriod(events, monthKeyRange('2026-05'))).toBe(0);
  });

  it('show de junho pago em julho não conta em junho', () => {
    const events = [paid({ start_date: '2026-06-28', paid_date: '2026-07-01', paid_amount: 4000 })];
    expect(receivedInPeriod(events, JUNE)).toBe(0);
  });

  it('pago antigo sem paid_date entra pela data do show', () => {
    const event = paid({ start_date: '2026-06-10', paid_amount: 2500 });
    expect(getEventReceivedDate(event)).toBe('2026-06-10');
    expect(receivedInPeriod([event], JUNE)).toBe(2500);
  });

  it('pago sem paid_amount soma o valor do evento em vez de zero', () => {
    const events = [paid({ paid_date: '2026-06-05', paid_amount: null, estimated_revenue: 1800 })];
    expect(receivedInPeriod(events, JUNE)).toBe(1800);
  });

  it('não pagos e cancelados ficam de fora', () => {
    const events = [
      paid({ id: 'a', paid_date: '2026-06-05', paid_amount: 1000 }),
      paid({ id: 'b', paid_date: '2026-06-06', paid_amount: 700, status: 'cancelled' }),
      { id: 'c', payment_status: 'unpaid', start_date: '2026-06-07', paid_amount: 500 },
      { id: 'd', payment_status: 'partial', start_date: '2026-06-08', paid_amount: 300 },
    ];
    expect(paidEventsInPeriod(events, JUNE).map((e) => e.id)).toEqual(['a']);
    expect(receivedInPeriod(events, JUNE)).toBe(1000);
  });

  it('usa as horas do evento certo via workByEvent', () => {
    const events = [
      paid({ id: 'a', paid_date: '2026-06-05', estimated_revenue: 1000 }),
      paid({ id: 'b', paid_date: '2026-06-06', estimated_revenue: 1000 }),
    ];
    const workByEvent = buildWorkByEvent([
      { event_id: 'a', daily_cache: 1400 },
      { event_id: null, daily_cache: 999 },
    ]);
    expect(receivedInPeriod(events, JUNE, workByEvent)).toBe(2400);
  });

  it('período aberto soma tudo que foi recebido', () => {
    const events = [
      paid({ id: 'a', paid_date: '2025-01-05', paid_amount: 100 }),
      paid({ id: 'b', paid_date: '2026-06-06', paid_amount: 200 }),
    ];
    expect(receivedInPeriod(events, { start: null, end: null })).toBe(300);
  });
});

describe('previsto por período — competência data do show', () => {
  const future = inDays(10);
  const range = { start: inDays(1), end: inDays(30) };

  it('soma só shows futuros com início dentro do período', () => {
    const events = [
      { id: 'a', start_date: future, end_date: future, status: 'confirmed', estimated_revenue: 1500 },
      { id: 'b', start_date: inDays(60), end_date: inDays(60), status: 'confirmed', estimated_revenue: 900 },
      { id: 'c', start_date: inDays(-5), end_date: inDays(-5), status: 'confirmed', estimated_revenue: 700 },
      { id: 'd', start_date: future, end_date: future, status: 'cancelled', estimated_revenue: 400 },
    ];
    expect(projectedEventsInPeriod(events, range).map((e) => e.id)).toEqual(['a']);
    expect(projectedInPeriod(events, range)).toBe(1500);
  });

  it('total previsto = soma da lista prevista', () => {
    const events = [
      { id: 'a', start_date: future, end_date: future, estimated_revenue: 1500 },
      { id: 'b', start_date: inDays(12), end_date: inDays(13), daily_cache_value: 800 },
    ];
    const listed = projectedEventsInPeriod(events, range);
    expect(listed).toHaveLength(2);
    expect(projectedInPeriod(events, range)).toBe(1500 + 1600);
  });
});

describe('despesas e horas por período', () => {
  it('despesa entra pelo expense_date (date como legado)', () => {
    const expenses = [
      { id: 1, expense_date: '2026-06-10', amount: 120 },
      { id: 2, date: '2026-06-11', amount: '80.5' },
      { id: 3, expense_date: '2026-07-01', amount: 999 },
    ];
    const inJune = expensesInPeriod(expenses, JUNE);
    expect(inJune.map((e) => e.id)).toEqual([1, 2]);
    expect(sumExpenses(inJune)).toBe(200.5);
  });

  it('diária com só work_date preenchido não some', () => {
    const work = [
      { id: 1, date: '2026-06-10', total_hours: 8 },
      { id: 2, date: null, work_date: '2026-06-11', total_hours: 10 },
      { id: 3, date: '2026-07-02', total_hours: 12 },
    ];
    expect(workInPeriod(work, JUNE).map((w) => w.id)).toEqual([1, 2]);
    expect(hoursInPeriod(work, JUNE)).toBe(18);
  });
});

describe('buildMarkPaidUpdate / buildMarkUnpaidUpdate', () => {
  const event = { estimated_revenue: 2000, start_date: '2026-06-10', end_date: '2026-06-10' };

  it('grava paid_date de hoje e o valor que estava em "A receber"', () => {
    expect(buildMarkPaidUpdate(event)).toEqual({
      payment_status: 'paid',
      paid_date: today,
      paid_amount: 2000,
    });
  });

  it('usa as horas registradas quando existem', () => {
    expect(buildMarkPaidUpdate(event, [{ daily_cache: 1100.111 }, { daily_cache: 1150.222 }]).paid_amount).toBe(
      2250.33
    );
  });

  it('valor e data explícitos têm prioridade', () => {
    expect(buildMarkPaidUpdate(event, [], { paidAmount: 1750, paidDate: '2026-06-15' })).toEqual({
      payment_status: 'paid',
      paid_date: '2026-06-15',
      paid_amount: 1750,
    });
  });

  it('evento sem valor grava paid_amount NULL (leitura acompanha o cachê depois)', () => {
    const update = buildMarkPaidUpdate({ start_date: '2026-06-10' });
    expect(update.paid_amount).toBeNull();
    expect(getEventReceivedAmount({ ...update, estimated_revenue: 900 })).toBe(900);
  });

  it('desmarcar limpa data e valor', () => {
    expect(buildMarkUnpaidUpdate()).toEqual({
      payment_status: 'unpaid',
      paid_date: null,
      paid_amount: null,
    });
  });
});

describe('distributePaidAmount', () => {
  const items = [
    { id: 'a', amount: 1000 },
    { id: 'b', amount: 1000 },
    { id: 'c', amount: 1000 },
  ];

  it('sem valor digitado cada evento fica com o próprio valor', () => {
    expect(distributePaidAmount(items)).toEqual(items);
    expect(distributePaidAmount(items, 0)).toEqual(items);
  });

  it('reparte proporcionalmente e a soma bate com o digitado', () => {
    const shares = distributePaidAmount(items, 1000);
    expect(shares.map((s) => s.amount)).toEqual([333.33, 333.33, 333.34]);
    expect(shares.reduce((sum, s) => sum + s.amount, 0)).toBeCloseTo(1000, 2);
  });

  it('respeita pesos diferentes', () => {
    const shares = distributePaidAmount(
      [
        { id: 'a', amount: 3000 },
        { id: 'b', amount: 1000 },
      ],
      3600
    );
    expect(shares).toEqual([
      { id: 'a', amount: 2700 },
      { id: 'b', amount: 900 },
    ]);
  });
});
