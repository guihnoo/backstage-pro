# Handoff — `createOfflineHook` exhaustive-deps

**Agente:** Cursor (Trilha Técnica)  
**Data:** 2026-08-28

---

## Contexto

`src/lib/offline/createOfflineHook.js` gerava **7 warnings** `react-hooks/exhaustive-deps` porque o factory passa `entity`, `storeName`, `mapRowFromDb`, `sortRows` do closure externo — ESLint os trata como deps instáveis dos hooks internos.

## Decisão

**NÃO** adicionar `events`, `data`, `refetch`, subscriptions ou callbacks extras nas dependency arrays — risco de loops de sync/IDB/realtime.

## Ação aplicada

- Comentário explicativo no topo do factory
- `/* eslint-disable react-hooks/exhaustive-deps */` no escopo do factory apenas
- **Zero alteração** em fluxo de sync, IndexedDB, fila, reconnect

## Alternativas rejeitadas

| Alternativa | Motivo |
|-------------|--------|
| Mover factory params para refs | Complexidade desnecessária nesta fase |
| Extrair hooks estáticos por entidade | Refatoração grande — proibida agora |
| Adicionar deps “para calar ESLint” | Risco de re-render/sync loops |

## Validação

`npx eslint src/lib/offline/createOfflineHook.js` — 0 warnings após suppress cirúrgico.
