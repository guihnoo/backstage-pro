// Junta pedidos iguais que acontecem ao mesmo tempo. Várias partes da tela usam a mesma
// lista (eventos, clientes, horas): antes, cada uma fazia sua própria consulta ao abrir a
// tela (3–5 consultas idênticas no celular). Agora, enquanto uma consulta igual está em
// andamento, as outras esperam a mesma resposta. Nada fica guardado depois que ela chega:
// a próxima atualização sempre busca dados novos.
const inflight = new Map();

export function dedupeRequest(key, fn) {
  if (inflight.has(key)) return inflight.get(key);
  const promise = Promise.resolve()
    .then(fn)
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

/** Só para testes. */
export function _inflightSize() {
  return inflight.size;
}
