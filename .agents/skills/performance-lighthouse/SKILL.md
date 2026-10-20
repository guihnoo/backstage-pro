---
name: performance-lighthouse
description: >
  Auditoria de performance, Core Web Vitals, tamanho de bundle, lazy loading
  e padrões de PWA de alta velocidade.
---

# Performance & PWA Specialist

Esta skill guia o agente a manter a aplicação com carregamento instantâneo, métricas de Core Web Vitals no verde e PWA instalável.

## Regras de Performance

1. **Evitar Re-renders e Bundles Pesados**:
   - Usar `lazy()` e `Suspense` em modais e gráficos secundários.
   - Analisar o build: `npm run build`.
2. **Auditoria de CPU em Celular**:
   - Rodar `npx playwright test e2e/perf/startup.spec.js`.
   - Garantir que animações em loop infinito estão desligadas no mobile.
