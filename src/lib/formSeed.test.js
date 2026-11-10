// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSeedOnOpen, mergeFresh } from './formSeed';

describe('useSeedOnOpen', () => {
  it('preenche ao abrir e não de novo quando o objeto recarrega', () => {
    let calls = 0;
    const { rerender } = renderHook(({ k }) => useSeedOnOpen(k, () => { calls += 1; }), { initialProps: { k: null } });
    expect(calls).toBe(0);
    rerender({ k: 'e1' });
    rerender({ k: 'e1' });
    rerender({ k: 'e1' });
    expect(calls).toBe(1);
    rerender({ k: null });
    rerender({ k: 'e1' });
    expect(calls).toBe(2);
    rerender({ k: 'e2' });
    expect(calls).toBe(3);
  });
});

describe('mergeFresh', () => {
  it('mantém o que o usuário mudou e atualiza o resto', () => {
    const base = { name: 'Gui', phone: '1', daily_rate: '800' };
    const current = { name: 'Guilherme', phone: '1', daily_rate: '800' };
    const next = { name: 'Gui', phone: '2', daily_rate: '900' };
    expect(mergeFresh(current, base, next)).toEqual({ name: 'Guilherme', phone: '2', daily_rate: '900' });
  });
  it('sem base usa os dados novos', () => {
    expect(mergeFresh({ a: 1 }, null, { a: 2 })).toEqual({ a: 2 });
  });
});
