import { describe, it, expect } from 'vitest';
import { normalizeItems, addItem, togglePacked, toggleReturned, addKit, equipmentSummary, kitFromItems } from './equipment';

const base = [
  { id: 'a', text: 'Cabo XLR 10m', packed: true, returned: true },
  { id: 'b', text: 'Mesa de luz', packed: true, returned: false },
  { id: 'c', text: 'Fita gaffer', packed: false, returned: false },
];

describe('equipamento', () => {
  it('normaliza: sem repetidos, sem vazio, "voltou" só se foi na mala', () => {
    expect(normalizeItems([
      { id: '1', text: ' Cabo XLR ', packed: false, returned: true },
      { id: '2', text: 'cabo xlr', packed: true },
      { id: '3', text: '' },
    ])).toEqual([{ id: '1', text: 'Cabo XLR', packed: false, returned: false }]);
  });

  it('adicionar não repete (ignora maiúscula e acento)', () => {
    expect(addItem(base, 'FITA GAFFER')).toBe(base);
    const next = addItem(base, 'Pendrive');
    expect(next).toHaveLength(4);
    expect(next[3]).toMatchObject({ text: 'Pendrive', packed: false, returned: false });
  });

  it('tirar da mala desmarca "voltou"; voltou só vale para o que foi na mala', () => {
    expect(togglePacked(base, 'a').find((i) => i.id === 'a')).toMatchObject({ packed: false, returned: false });
    expect(toggleReturned(base, 'c').find((i) => i.id === 'c').returned).toBe(false);
    expect(toggleReturned(base, 'b').find((i) => i.id === 'b').returned).toBe(true);
  });

  it('usar meu kit junta sem repetir', () => {
    const next = addKit(base, [{ id: 'k1', text: 'mesa de luz' }, { id: 'k2', text: 'Extensão 20m' }]);
    expect(next.map((i) => i.text)).toEqual(['Cabo XLR 10m', 'Mesa de luz', 'Fita gaffer', 'Extensão 20m']);
  });

  it('resumo: na mala, voltou e o que falta voltar', () => {
    const s = equipmentSummary(base);
    expect(s).toMatchObject({ total: 3, packed: 2, returned: 1 });
    expect(s.missingReturn.map((i) => i.text)).toEqual(['Mesa de luz']);
    expect(s.notPacked.map((i) => i.text)).toEqual(['Fita gaffer']);
  });

  it('kit salvo só guarda id e nome', () => {
    expect(kitFromItems(base)).toEqual([
      { id: 'a', text: 'Cabo XLR 10m' }, { id: 'b', text: 'Mesa de luz' }, { id: 'c', text: 'Fita gaffer' },
    ]);
  });
});
