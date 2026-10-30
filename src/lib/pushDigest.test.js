import { describe, expect, it } from 'vitest';
import { buildPushDigest, getPushPaymentReminderTiming, PUSH_PAYMENT_REMINDER_START_DAYS } from '../../supabase/functions/_shared/pushDigest.ts';
import { getPaymentReminderTiming, PAYMENT_REMINDER_START_DAYS } from './paymentReminderTiming';

const event = (overrides = {}) => ({
  id: 'push-timing', title: 'Trabalho exemplo', client_id: 'client',
  start_date: '2026-10-01', end_date: '2026-10-01',
  status: 'completed', payment_status: 'unpaid',
  daily_cache_value: 1000, actual_revenue: null, estimated_revenue: 1000,
  ...overrides,
});
const digest = (events, today = '2026-10-11', prefs = {}) => buildPushDigest({
  events, clients: [{ id: 'client', name: 'Produtora exemplo' }], profile: {},
  today: new Date(today + 'T12:00:00Z'),
  prefs: { push_events: false, push_payments: true, push_goals: false, ...prefs },
});
const reminders = (events, today, prefs) => digest(events, today, prefs).filter((item) => item.type === 'payment_reminder');

describe('server push payment reminder policy', () => {
  it('uses the approved ten-day threshold, independently of a due date', () => {
    expect(PUSH_PAYMENT_REMINDER_START_DAYS).toBe(10);
    expect(PUSH_PAYMENT_REMINDER_START_DAYS).toBe(PAYMENT_REMINDER_START_DAYS);
    expect(reminders([event()], '2026-10-10')).toEqual([]);
    expect(reminders([event({ payment_due_date: '2026-10-02' })], '2026-10-10')).toEqual([]);
    expect(reminders([event()], '2026-10-11')).toHaveLength(1);
    expect(reminders([event()], '2026-10-16')).toHaveLength(1);
  });

  it('describes elapsed time as time since completion, without inventing overdue status', () => {
    for (const [date, day] of [['2026-10-11', 10], ['2026-10-16', 15], ['2026-11-01', 31]]) {
      const notification = reminders([event()], date)[0];
      expect(notification).toMatchObject({
        key: 'payment:push-timing', type: 'payment_reminder', title: 'Pagamento pendente',
        priority: 'high', url: '/reports?aba=receber',
      });
      expect(notification.body).toContain('encerrado há ' + day + ' dias');
      expect(notification.body).toContain('Sem vencimento informado');
      expect(notification.body).not.toMatch(/atraso|atrasad|vencid|ultrapassad/i);
    }
  });

  it('reports overdue only when an explicit valid due date is already past', () => {
    const late = reminders([event({ payment_due_date: '2026-10-05' })], '2026-10-11')[0];
    expect(late).toMatchObject({ title: 'Pagamento vencido', priority: 'urgent' });
    expect(late.body).toContain('Vencimento ultrapassado há 6 dias');
    for (const dueDate of ['2026-10-11', '2026-10-20']) {
      const pending = reminders([event({ payment_due_date: dueDate })], '2026-10-11')[0];
      expect(pending).toMatchObject({ title: 'Pagamento pendente', priority: 'high' });
      expect(pending.body).toContain('Vencimento em ' + dueDate.split('-').reverse().join('/'));
      expect(pending.body).not.toMatch(/atraso|atrasad|vencid|ultrapassad/i);
    }
  });

  it.each([
    { payment_status: 'paid' },
    { status: 'cancelled' },
    { status: 'cancelado' },
    { start_date: '2026-10-11', end_date: '2026-10-11' },
    { start_date: '2026-11-01', end_date: '2026-11-02' },
    { start_date: '2026-10-05', end_date: '2026-10-01' },
    { start_date: 'invalid' },
    { end_date: 'invalid' },
    { start_date: '2026-02-29', end_date: '2026-02-29' },
    { end_date: '2026-02-30' },
    { end_date: '2026-10-01Tinvalid' },
  ])('does not remind paid, cancelled, unfinished or invalid events: %j', (overrides) => {
    expect(reminders([event(overrides)], '2026-10-11')).toEqual([]);
  });

  it('treats invalid due dates as unknown instead of fabricating overdue status', () => {
    const pending = reminders([event({ payment_due_date: '2026-02-30' })])[0];
    expect(pending.title).toBe('Pagamento pendente');
    expect(pending.body).toContain('Sem vencimento informado');
    expect(pending.body).not.toMatch(/atraso|atrasad|vencid|ultrapassad/i);
  });

  it('honors payment notification preferences without disabling unrelated categories', () => {
    expect(reminders([event()], '2026-10-11', { push_payments: false })).toEqual([]);
    const output = digest([
      event(),
      event({ id: 'today', start_date: '2026-10-11', end_date: '2026-10-11' }),
    ], '2026-10-11', { push_events: true, push_payments: false });
    expect(output.map((item) => item.type)).toEqual(['today_event']);
  });

  it('keeps today, tomorrow and goal reminders working with their original routes', () => {
    const output = buildPushDigest({
      events: [
        event({ id: 'today', start_date: '2026-10-11', end_date: '2026-10-11' }),
        event({ id: 'tomorrow', start_date: '2026-10-12', end_date: '2026-10-12' }),
      ],
      clients: [{ id: 'client', name: 'Produtora exemplo' }],
      profile: { monthly_goal_events: 10 }, diariasCount: 9,
      today: new Date('2026-10-11T12:00:00Z'),
      prefs: { push_events: true, push_payments: false, push_goals: true },
    });
    expect(output.map((item) => [item.type, item.url])).toEqual([
      ['today_event', '/'],
      ['event_reminder', '/calendar?event=tomorrow'],
      ['goal_reminder', '/goals'],
    ]);
  });

  it('retains priority sorting, three-item cap and immutable inputs', () => {
    const events = Object.freeze([
      Object.freeze(event({ id: 'plain' })),
      Object.freeze(event({ id: 'overdue', payment_due_date: '2026-10-05' })),
      Object.freeze(event({ id: 'third' })),
      Object.freeze(event({ id: 'fourth' })),
    ]);
    const before = JSON.stringify(events);
    const output = reminders(events);
    expect(output).toHaveLength(3);
    expect(output[0].key).toBe('payment:overdue');
    expect(JSON.stringify(events)).toBe(before);
    expect(events[0]).not.toHaveProperty('payment_due_date');
  });

  it('does not throw or dispatch notifications for an invalid reference Date', () => {
    expect(buildPushDigest({ events: [event()], clients: [], profile: null, today: new Date('invalid') })).toEqual([]);
  });
});

describe('browser/server timing parity', () => {
  const cases = [
    [event(), '2026-10-10'],
    [event(), '2026-10-11'],
    [event(), '2026-10-16'],
    [event({ payment_due_date: '2026-10-05' }), '2026-10-11'],
    [event({ payment_due_date: '2026-10-11' }), '2026-10-11'],
    [event({ payment_due_date: '2026-10-20' }), '2026-10-11'],
    [event({ payment_due_date: '2026-02-30' }), '2026-10-11'],
    [event({ start_date: '2026-12-26', end_date: '2026-12-26' }), '2027-01-05'],
    [event({ start_date: '2028-02-29', end_date: '2028-02-29' }), '2028-03-10'],
    [event({ start_date: '2026-10-25', end_date: '2026-10-25' }), '2026-11-04'],
    [event({ end_date: null }), '2026-10-11'],
    [event({ start_date: null, end_date: null, event_date: '2026-10-01' }), '2026-10-11'],
    [event({ start_date: 'invalid' }), '2026-10-11'],
    [event({ end_date: '2026-02-30' }), '2026-10-11'],
    [event({ end_date: '2026-10-01Tinvalid' }), '2026-10-11'],
    [event({ start_date: '2026-10-05', end_date: '2026-10-01' }), '2026-10-11'],
    [event(), '2026-02-30'],
    [event({ payment_status: 'paid' }), '2026-10-11'],
    [event({ status: 'cancelled' }), '2026-10-11'],
    [event({ status: 'cancelado' }), '2026-10-11'],
  ];
  it.each(cases)('returns the same timing for %j on %s', (input, today) => {
    expect(getPushPaymentReminderTiming(input, today)).toEqual(getPaymentReminderTiming(input, today));
  });
});

it('limiar do push respeita a virada do dia de São Paulo',()=>{
 const args={events:[event()],clients:[],profile:{},prefs:{push_events:false,push_payments:true,push_goals:false}};
 expect(buildPushDigest({...args,today:new Date('2026-10-11T02:59:00Z')}).filter(n=>n.type==='payment_reminder')).toHaveLength(0);
 expect(buildPushDigest({...args,today:new Date('2026-10-11T03:00:00Z')}).filter(n=>n.type==='payment_reminder')).toHaveLength(1);
});
