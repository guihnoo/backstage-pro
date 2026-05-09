---
name: debug-systematic
description: Depuração estruturada — reproduzir, isolar, hipótese mínima, verificar correção (inspirado em fluxos tipo debug-pro / ecossistema OpenClaw)
---

# Debug sistemático

## Quando usar

Bug intermitente, regressão após refactor, ou falha Build/CI sem mensagem clara.

## Passos

1. **Reproduzir:** comando ou passos UI exactos; gravar erro literal e stack.
2. **Reduzir:** comentário binário — último commit bom vs mau, ou ficheiro mínimo que falha.
3. **Hipótese única:** uma causa por vez (rotas, env, async, cache SW).
4. **Instrumentar:** logs pontuais ou breakpoint; evitar `console.log` permanente em código quente.
5. **Correcção + prova:** teste manual ou comando que antes falhava agora passa.

## Para este repo

- Rotas: confirmar `path` vs chaves em `src/pages/index.jsx` (Linux CI é case-sensitive).
- API dev: `VITE_API_URL=/api` e API a correr na porta do proxy (`docs/QUICKSTART.md`).
- PWA: depois de mudar SW, testar em janela anónima ou desregistar SW antigo.
