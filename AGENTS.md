# AGENTS.md — Backstage Pro

Arquivo de referência para agentes (Claude Code, Cursor, etc.) que trabalham neste projeto.

## Arquivos protegidos (cuidado ao editar)

Estes arquivos têm lógica crítica — editar com atenção, não refatorar sem motivo:

- `e2e/**` — testes E2E; não alterar sem rodar `npm run test:e2e` depois
- `src/lib/authContext.jsx` — autenticação central; mudanças afetam todo o app
- `vite.config.js` — build; mudanças quebram PWA/chunks
- `package.json` / `package-lock.json` — dependências; não adicionar sem motivo
- `public/` — ícones PWA; não substituir sem regenerar manifesto

## Convenções

- Stack: React 18 + Vite 6 + Tailwind + shadcn/ui + Supabase + Framer Motion
- Router: react-router-dom v7
- Auth: `useAuth()` de `src/lib/authContext.jsx`
- Dados: hooks Supabase diretos (`useClients`, `useEvents`, etc.) em `src/lib/`
- Formatação de moeda: `formatCurrency` do `useFinancialVisibility()`
- Scroll: `main[data-app-scroll]`, `useAppScrollLock`, `.bp-modal-scroll` ou `ScrollArea fill`
- **Backup automático**: `npm run git:backup` ao fim de sessões com mudanças; hook em `.cursor/hooks.json`. Commits WIP usam `chore(auto):`. Pausa: `.cursor/PAUSE_AUTO_GIT`
- Commits “oficiais” e deploy só com pedido explícito do usuário
- Sem secrets em código — `.env.local` nunca commitado

## Log de atividade

Ver `docs/AGENT_LOG.md` — append-only (somente anexar novas entradas).
