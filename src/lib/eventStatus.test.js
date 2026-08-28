import { describe, expect, it } from 'vitest';
import { addDays, format } from 'date-fns';
import { getEventStatus, getEventStatusLabel } from '@/components/utils/dateUtils';

const today = format(new Date(), 'yyyy-MM-dd');
const yesterday = format(addDays(new Date(), -1), 'yyyy-MM-dd');
const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
const nextWeek = format(addDays(new Date(), 7), 'yyyy-MM-dd');

function event(overrides = {}) {
  return {
    start_date: today,
    end_date: today,
    status: 'scheduled',
    payment_status: 'unpaid',
    ...overrides,
  };
}

describe('getEventStatus — status persistido vs situação temporal', () => {
  it('cancelled ignora datas e retorna cancelled', () => {
    expect(getEventStatus(event({ status: 'cancelled', start_date: tomorrow }))).toBe('cancelled');
  });

  it('completed manual tem prioridade sobre datas futuras', () => {
    expect(getEventStatus(event({ status: 'completed', start_date: nextWeek, end_date: nextWeek }))).toBe(
      'completed'
    );
  });

  it('archived manual tem prioridade sobre datas futuras', () => {
    expect(getEventStatus(event({ status: 'archived', start_date: nextWeek, end_date: nextWeek }))).toBe(
      'archived'
    );
  });

  it('evento futuro retorna scheduled mesmo com status de negócio confirmed/tentative/pending', () => {
    expect(getEventStatus(event({ status: 'confirmed', start_date: tomorrow, end_date: tomorrow }))).toBe(
      'scheduled'
    );
    expect(getEventStatus(event({ status: 'tentative', start_date: tomorrow, end_date: tomorrow }))).toBe(
      'scheduled'
    );
    expect(getEventStatus(event({ status: 'pending', start_date: tomorrow, end_date: tomorrow }))).toBe(
      'scheduled'
    );
  });

  it('evento em andamento hoje retorna in_progress independente de confirmed no banco', () => {
    expect(getEventStatus(event({ status: 'confirmed', start_date: today, end_date: today }))).toBe(
      'in_progress'
    );
    expect(getEventStatus(event({ status: 'scheduled', start_date: today, end_date: today }))).toBe(
      'in_progress'
    );
  });

  it('evento passado sem status manual completed/archived vira completed por data', () => {
    expect(getEventStatus(event({ status: 'confirmed', start_date: yesterday, end_date: yesterday }))).toBe(
      'completed'
    );
    expect(getEventStatus(event({ status: 'scheduled', start_date: yesterday, end_date: yesterday }))).toBe(
      'completed'
    );
  });

  it('sem datas cai em scheduled', () => {
    expect(getEventStatus({ status: 'confirmed' })).toBe('scheduled');
    expect(getEventStatus(null)).toBe('scheduled');
  });

  it('getEventStatusLabel usa o status calculado, não o persistido bruto', () => {
    const futureConfirmed = event({ status: 'confirmed', start_date: tomorrow, end_date: tomorrow });
    expect(getEventStatus(futureConfirmed)).toBe('scheduled');
    expect(getEventStatusLabel(futureConfirmed)).toBe('Agendado');
  });
});

describe('getEventStatus — payment_status é independente', () => {
  it('payment_status paid não altera getEventStatus', () => {
    const ev = event({
      status: 'confirmed',
      start_date: tomorrow,
      end_date: tomorrow,
      payment_status: 'paid',
    });
    expect(getEventStatus(ev)).toBe('scheduled');
  });

  it('payment_status partial não altera getEventStatus', () => {
    const ev = event({
      status: 'confirmed',
      start_date: yesterday,
      end_date: yesterday,
      payment_status: 'partial',
    });
    expect(getEventStatus(ev)).toBe('completed');
  });
});
