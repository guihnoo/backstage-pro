import { describe, expect, it } from 'vitest';
import { getPaymentReminderTiming, PAYMENT_REMINDER_START_DAYS } from './paymentReminderTiming';
import { buildUserNotifications } from './notificationRules';

const event = (overrides = {}) => ({
  id: 'payment-timing', title: 'Trabalho exemplo', client_id: 'client',
  start_date: '2026-10-01', end_date: '2026-10-01',
  status: 'completed', payment_status: 'unpaid', estimated_revenue: 1000,
  ...overrides,
});
const notifications = (events, today = '2026-10-11', extra = {}) => buildUserNotifications({
  events, clients: [{ id: 'client', name: 'Produtora exemplo' }],
  profile: {}, today: new Date(today + 'T12:00:00Z'),
  formatCurrency: (value) => `R$ ${value}`, ...extra,
});
const payments = (events, today) => notifications(events, today).filter((note) => note.type === 'payment_reminder');

describe('getPaymentReminderTiming', () => {
  it('starts exactly ten calendar days after the event end, including days 10 and 15', () => {
    expect(PAYMENT_REMINDER_START_DAYS).toBe(10);
    expect(getPaymentReminderTiming(event(), '2026-10-10')).toBeNull();
    expect(getPaymentReminderTiming(event(), '2026-10-11')).toMatchObject({ daysSinceEnd: 10, isOverdue: false });
    expect(getPaymentReminderTiming(event(), '2026-10-16')).toMatchObject({ daysSinceEnd: 15, isOverdue: false });
  });

  it.each([
    ['2026-10-25', '2026-11-04'],
    ['2026-12-26', '2027-01-05'],
    ['2028-02-29', '2028-03-10'],
  ])('counts days consistently over calendar boundaries from %s to %s', (end, today) => {
    expect(getPaymentReminderTiming(event({ start_date: end, end_date: end }), today)?.daysSinceEnd).toBe(10);
  });

  it.each([
    { payment_status: 'paid' },
    { status: 'cancelled' },
    { status: 'cancelado' },
    { start_date: '2026-11-01', end_date: '2026-11-02' },
    { end_date: '2026-02-30' },
    { start_date: 'invalid' },
    { end_date: 'invalid' },
    { start_date: '2026-10-05', end_date: '2026-10-01' },
    { start_date: '2026-02-29', end_date: '2026-02-29' },
  ])('does not notify paid, cancelled, future or invalid events: %j', (overrides) => {
    expect(getPaymentReminderTiming(event(overrides), '2026-10-11')).toBeNull();
  });

  it('rejects invalid today and malformed datetime values', () => {
    expect(getPaymentReminderTiming(event(), '2026-02-30')).toBeNull();
    expect(getPaymentReminderTiming(event({ end_date: '2026-10-01Tinvalid' }), '2026-10-11')).toBeNull();
    expect(getPaymentReminderTiming(null, '2026-10-11')).toBeNull();
  });

  it('can use the start when end is absent, but never replaces an invalid supplied end', () => {
    expect(getPaymentReminderTiming(event({ end_date: null }), '2026-10-11')?.daysSinceEnd).toBe(10);
    expect(getPaymentReminderTiming(event({ end_date: '2026-02-30' }), '2026-10-11')).toBeNull();
  });

  it('uses only a valid explicit due date for overdue status', () => {
    expect(getPaymentReminderTiming(event({ payment_due_date: '2026-10-05' }), '2026-10-11')).toMatchObject({ isOverdue: true, daysOverdue: 6 });
    expect(getPaymentReminderTiming(event({ payment_due_date: '2026-10-20' }), '2026-10-11')).toMatchObject({ isOverdue: false, daysOverdue: 0 });
    expect(getPaymentReminderTiming(event({ payment_due_date: '2026-10-11' }), '2026-10-11')).toMatchObject({ isOverdue: false, daysOverdue: 0 });
    expect(getPaymentReminderTiming(event({ payment_due_date: '2026-02-30' }), '2026-10-11')).toMatchObject({ isOverdue: false, dueDate: null });
    expect(getPaymentReminderTiming(event({ payment_due_date: '2026-10-02' }), '2026-10-10')).toBeNull();
  });

  it('does not mutate event data or manufacture a due date', () => {
    const input = Object.freeze(event());
    const before = JSON.stringify(input);
    expect(getPaymentReminderTiming(input, '2026-10-11')).toMatchObject({ dueDate: null });
    expect(JSON.stringify(input)).toBe(before);
    expect(input).not.toHaveProperty('payment_due_date');
  });
});

describe('payment notification integration', () => {
  it('does not issue a payment reminder on day 9 and uses pending language on days 10 and 15', () => {
    expect(payments([event()], '2026-10-10')).toEqual([]);
    for (const [today, day] of [['2026-10-11', 10], ['2026-10-16', 15]]) {
      const notes = payments([event()], today);
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({ id: 'payment:payment-timing', title: 'Pagamento pendente: Trabalho exemplo', priority: 'high', action_url: '/reports?aba=receber' });
      expect(notes[0].message).toContain(`encerrado há ${day} dias`);
      expect(notes[0].message).toContain('Sem vencimento informado');
      expect(notes[0].message).not.toMatch(/atraso|atrasado|vencido/i);
    }
  });

  it('shows overdue only for a past explicit due date, after the ten-day threshold', () => {
    const overdue = payments([event({ payment_due_date: '2026-10-05' })], '2026-10-11')[0];
    expect(overdue).toMatchObject({ title: 'Pagamento vencido: Trabalho exemplo', priority: 'urgent' });
    expect(overdue.message).toContain('ultrapassado há 6 dias');
    const future = payments([event({ payment_due_date: '2026-10-20' })], '2026-10-11')[0];
    expect(future.title).toContain('pendente');
    expect(future.message).toContain('20/10/2026');
    expect(future.message).not.toMatch(/atraso|atrasado|vencido|ultrapassado/i);
  });

  it('does not turn an invalid due date into overdue, or notify a paid/cancelled event', () => {
    const notes = payments([
      event({ id: 'invalid-due', payment_due_date: '2026-02-30' }),
      event({ id: 'paid', payment_status: 'paid' }),
      event({ id: 'cancelled', status: 'cancelled' }),
      event({ id: 'invalid', end_date: '2026-02-30' }),
      event({ id: 'future', start_date: '2026-12-01', end_date: '2026-12-01' }),
    ], '2026-10-11');
    expect(notes.map((note) => note.id)).toEqual(['payment:invalid-due']);
    expect(notes[0].message).toContain('Sem vencimento informado');
  });

  it('preserves today, tomorrow and goal notifications, with no input mutation', () => {
    const events = Object.freeze([
      Object.freeze(event()),
      Object.freeze(event({ id: 'today', start_date: '2026-10-11', end_date: '2026-10-11' })),
      Object.freeze(event({ id: 'tomorrow', start_date: '2026-10-12', end_date: '2026-10-12' })),
    ]);
    const before = JSON.stringify(events);
    const notes = notifications(events, '2026-10-11', { profile: { monthly_goal_events: 10 }, diariasCount: 9 });
    expect(notes.map((note) => note.type)).toEqual(expect.arrayContaining(['payment_reminder', 'today_event', 'event_reminder', 'goal_reminder']));
    expect(JSON.stringify(events)).toBe(before);
    expect(events[0]).not.toHaveProperty('payment_due_date');
  });
});
