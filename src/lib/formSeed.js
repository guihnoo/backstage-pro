import { useEffect, useRef } from 'react';

/**
 * Preenche um formulário UMA vez por abertura (10/11).
 *
 * Bug que isto evita: formulários que se re-preenchiam sempre que o objeto do trabalho/cliente
 * era recarregado (sincronização com o Google, realtime, refetch depois de salvar outra coisa)
 * e apagavam o que o usuário estava digitando — foi o que travou o "Confirmar recebimento".
 *
 * `key`: identifica a abertura (ex.: `open ? event?.id || 'novo' : null`). `null` = fechado.
 * `seed`: função que preenche o estado; roda só quando a chave muda.
 */
export function useSeedOnOpen(key, seed) {
  const last = useRef(undefined);
  const seedRef = useRef(seed);
  seedRef.current = seed;
  useEffect(() => {
    if (key == null) {
      last.current = undefined;
      return;
    }
    if (last.current === key) return;
    last.current = key;
    seedRef.current();
  }, [key]);
}

const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b);

/**
 * Junta dados novos do servidor sem perder o que o usuário já mudou:
 * campo que o usuário mexeu (diferente da base anterior) fica; o resto vem do servidor.
 */
export function mergeFresh(current, base, next) {
  if (!base || !current) return next;
  const out = { ...next };
  for (const k of Object.keys(current)) {
    if (!same(current[k], base[k])) out[k] = current[k];
  }
  return out;
}
