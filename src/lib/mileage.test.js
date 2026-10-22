import { describe, it, expect } from 'vitest';
import { calcMileage, mileageNote, mileageFromExpense, parseKmRate } from './mileage';

describe('calcMileage', () => {
  it('km × valor', () => {
    expect(calcMileage({ km: 45, rate: 1.2 })).toEqual({ totalKm: 45, amount: 54 });
  });

  it('ida e volta dobra os km', () => {
    expect(calcMileage({ km: 45, rate: 1.2, roundTrip: true })).toEqual({ totalKm: 90, amount: 108 });
  });

  it('aceita vírgula e texto digitado', () => {
    expect(calcMileage({ km: '12,5', rate: '1,35' })).toEqual({ totalKm: 12.5, amount: 16.88 });
    expect(calcMileage({ km: '1.234,5', rate: '1' })).toEqual({ totalKm: 1234.5, amount: 1234.5 });
  });

  it('sem km ou com valor inválido não calcula', () => {
    expect(calcMileage({ km: '', rate: 1.2 })).toBeNull();
    expect(calcMileage({ km: 0, rate: 1.2 })).toBeNull();
    expect(calcMileage({ km: 10, rate: 'abc' })).toBeNull();
    expect(calcMileage({ km: 10, rate: -1 })).toBeNull();
  });
});

describe('mileageNote', () => {
  it('descreve a conta', () => {
    expect(mileageNote({ km: 45, rate: 1.2, roundTrip: true })).toBe('2 × 45 km (ida e volta) × R$ 1,20/km');
    expect(mileageNote({ km: '12,5', rate: '1,35' })).toBe('12,5 km × R$ 1,35/km');
    expect(mileageNote({ km: '', rate: 1 })).toBe('');
  });
});

describe('mileageFromExpense', () => {
  it('recupera km e valor por km de uma despesa gravada', () => {
    expect(mileageFromExpense({ distance_km: 90, amount: 108 })).toEqual({ km: 90, rate: 1.2, roundTrip: false });
  });

  it('despesa sem km não é de quilometragem', () => {
    expect(mileageFromExpense({ distance_km: null, amount: 50 })).toBeNull();
  });
});

describe('parseKmRate', () => {
  it('limita a valores possíveis', () => {
    expect(parseKmRate('1,20')).toBe(1.2);
    expect(parseKmRate('0')).toBe(0);
    expect(parseKmRate('500')).toBeNull();
    expect(parseKmRate('')).toBeNull();
  });
});
