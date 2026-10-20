---
name: browser-use
description: >
  Controle autônomo do navegador web para auditoria de UX, inspeção visual,
  validação de fluxos ponta a ponta e testes de tela como um usuário real.
---

# Browser Use — Auditor de UX Real

Esta skill capacita o agente a abrir instâncias do navegador (via Playwright ou Browser-Use), clicar em botões, preencher formulários, tirar screenshots e auditar fluxos completos no app.

## Comandos Rápidos

```bash
# Executar teste de fumaça visual e console limpo
npx playwright test e2e/regression/console-clean.spec.js

# Executar teste de navegação móvel da barra inferior
npx playwright test e2e/smoke/bottom-nav-navigation.spec.js

# Gravar capturas de tela das páginas
node scripts/capture-real.mjs
```
