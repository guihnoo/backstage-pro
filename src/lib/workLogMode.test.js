import { describe, it, expect } from 'vitest';
import { resolveWorkLogMode, eventWorkLogModeToSave, clockNow, isWorkLogMode } from './workLogMode';

describe('resolveWorkLogMode', () => {
  it('sem nada escolhido é ficha completa', () => {
    expect(resolveWorkLogMode(null, null)).toBe('completo');
    expect(resolveWorkLogMode({}, {})).toBe('completo');
  });

  it('segue o Perfil quando o trabalho não escolheu', () => {
    expect(resolveWorkLogMode({ work_log_mode: null }, { work_log_mode: 'ponto' })).toBe('ponto');
  });

  it('a escolha do trabalho vale mais que a do Perfil', () => {
    expect(resolveWorkLogMode({ work_log_mode: 'completo' }, { work_log_mode: 'ponto' })).toBe('completo');
    expect(resolveWorkLogMode({ work_log_mode: 'ponto' }, { work_log_mode: 'completo' })).toBe('ponto');
  });

  it('ignora valor desconhecido', () => {
    expect(resolveWorkLogMode({ work_log_mode: 'xyz' }, { work_log_mode: 'abc' })).toBe('completo');
    expect(isWorkLogMode('ponto')).toBe(true);
    expect(isWorkLogMode('')).toBe(false);
  });
});

describe('eventWorkLogModeToSave', () => {
  it('igual ao Perfil grava null (segue o Perfil)', () => {
    expect(eventWorkLogModeToSave('ponto', { work_log_mode: 'ponto' })).toBeNull();
    expect(eventWorkLogModeToSave('completo', {})).toBeNull();
  });

  it('diferente do Perfil grava a escolha', () => {
    expect(eventWorkLogModeToSave('ponto', { work_log_mode: 'completo' })).toBe('ponto');
    expect(eventWorkLogModeToSave('completo', { work_log_mode: 'ponto' })).toBe('completo');
  });
});

describe('clockNow', () => {
  it('formata HH:MM com zero à esquerda', () => {
    expect(clockNow(new Date(2026, 9, 22, 7, 5))).toBe('07:05');
    expect(clockNow(new Date(2026, 9, 22, 23, 59))).toBe('23:59');
  });
});
