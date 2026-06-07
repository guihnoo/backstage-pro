# AGENTS.md — Backstage Pro

Arquivo de referência para agentes (Claude Code, Cursor, etc.) que trabalham neste projeto.

## Arquivos LOCKED (não editar)

Estes arquivos são gerenciados pelo Cursor ou têm restrições explícitas:

- `vite.config.js`
- `package.json` / `package-lock.json`
- `src/lib/authContext.jsx`
- `src/components/clients/ClientForm.jsx`
- `src/components/calendar/EventForm.jsx`
- `src/components/expenses/ExpenseForm.jsx`
- `src/components/calendar/DailyWorkModal.jsx`
- `e2e/**`
- `src/components/home/ProximoShow.jsx`
- `src/components/home/ProximosEventos.jsx`
- `src/components/utils/dateUtils.jsx`
- `src/components/ai-elements/**`
- `src/pages/AI_Mentor.jsx`
- `public/` (ícones PWA)

## Convenções

- Stack: React 18 + Vite 6 + Tailwind + shadcn/ui + Supabase + Framer Motion
- Router: react-router-dom v7
- Auth: `useAuth()` de `src/lib/authContext.jsx`
- Dados: hooks Supabase diretos (`useClients`, `useEvents`, etc.) em `src/lib/`
- Formatação de moeda: `formatCurrency` do `useFinancialVisibility()`
- Sem commits automáticos — aguardar instrução explícita do usuário
- Sem secrets em código — `.env.local` nunca commitado

## Log de atividade

Ver `docs/AGENT_LOG.md`.

## LOCKED (Sprint 1 re-stabilization)

- `src/lib/useEvents.js`
- `src/lib/useDailyWork.js`
- `src/lib/useExpenses.js`
- `src/components/reports/PaymentConfirmModal.jsx`
- scripts `test:e2e*` em `package.json`

## Desbloqueado (Neon Bastidor — autorizado pelo usuário)

- `src/pages/Calendar.jsx`, `src/pages/reports.jsx`, `src/pages/Onboarding.jsx`, `src/pages/AuthCallback.jsx`
- `src/components/home/FloatingActions.jsx`

## Regras adicionais

- `docs/AGENT_LOG.md` � append-only (somente anexar novas entradas).
