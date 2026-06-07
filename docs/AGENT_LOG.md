# AGENT_LOG.md — Backstage Pro

Registro cronológico de tarefas executadas por agentes.

---

## 2026-06-06

### C-BADGE — Badge de cachê padrão no ClientCard ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivo**: `src/components/clients/ClientList.jsx`
- **O que fez**: Badge `R$ X/dia` abaixo do nome no `ClientCard` quando `client.default_daily_cache > 0`; usa `formatCurrency` já existente; build ✅ sem erros
- **Resultado**: ✅ Concluído

### S1-MODALS-HOOKS — Modais migrados de useAppData → hooks Supabase ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivos**:
  - `src/components/clients/ClientDetailModal.jsx` — `useAppData` → `useEvents + useDailyWork`
  - `src/components/calendar/EventDetailModal.jsx` — `useAppData` → `useDailyWork`
  - `src/components/clients/ClientInsightsModal.jsx` — `useAppData` → `useEvents + useDailyWork`
  - `src/lib/useUserSettings.js` — **criado** (hook novo: `refetch` + `upsert`, RLS por `user_id`)
- **Build**: ✅ sem erros
- **E2E**: ✅ exit 0

### S2-BASE44-CLEANUP — Remoção de Base44 + migration 008 ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivos alterados**:
  - `supabase/migrations/008_user_settings_extras.sql` — **criado**: adiciona `financial_visibility` e `google_calendar_connected` ao `user_settings`
  - `src/pages/Profile.jsx` — **migrado**: removeu `useAppData` + `User` + `UserSettings` Base44 → `useAuth()` + `useUserSettings()` (arquivo órfão, não está na rota ativa)
  - `src/components/mobile/EventHoursSheet.jsx` — **migrado**: `useAppData` → `useAuth()`, `DailyWork` entity → `useDailyWork()`, removeu console.logs de produção
  - `src/components/reports/ForecastSummary.jsx` — **deletado** (orphan, não importado em nenhum arquivo)
  - `src/components/calendar/SyncStatusIndicator.jsx` — **deletado** (orphan, não importado em nenhum arquivo)
- **Build**: ✅ 0 erros — chunk principal: 702KB (antes 760KB)
- **Base44 restante**: AI_Mentor (LOCKED), BackupManager (cloud functions sem equivalente Supabase), GoogleCalendarSync (OAuth), NotificationCenter (tabela `notifications` não existe), ClientForm (LOCKED)

### S1-RESTABILIZATION - hooks Supabase + guards E2E
- **Agente**: Codex (GPT-5)
- **Escopo**: Reaplicacao do Sprint 1 com migracao para hooks `useEvents`/`useDailyWork`/`useExpenses`, ajuste de mapeamentos legados (`event_date`, `work_date`, `hours_worked`, `expense_date`) e remocao de dependencias `@/api/entities` nos modais/formularios alvo.
- **Qualidade**: Recriados `playwright.config.js`, `playwright.prod.config.js` e suites em `e2e/smoke` e `e2e/regression` para validar guards de `calendar`, `event-form`, `expense-form` e `reports`.
- **Status**: Build e E2E executados ao final deste ciclo.

### NEON-BASTIDOR — Identidade visual iluminação (roxo/âmbar) ✅
- **Agente**: Cursor (Auto)
- **Escopo**: Sistema de design Neon Bastidor (`NeonAtmosphere`, `NeonGlass`, `LightingBeams`, `NeonLevelBars`, `NeonPageShell`, `NeonSectionFrame`), `AUTH_HERO_CATEGORY=lighting`, Splash/Login/Signup/Home/AppLayout com paleta `#A64AFF` + `#FFB700` e fundo `#050609`, molduras neon nos cards LOCKED da Home via `NeonSectionFrame`.
- **Build**: ✅ `npm run build` sem erros
- **Deploy**: https://backstage-pro-beta.vercel.app (production)

### NEON-BASTIDOR-2 — Perfil, Metas e Clientes ✅
- **Arquivos**: `ProfileSimple.jsx` (NeonPageShell + NeonGlass), `Goals.jsx` (NeonPageShell + fallback lighting), `Clients.jsx` (CTA gradiente categoria)
- **Build**: ✅

### NEON-BASTIDOR-3 — Agenda, Relatórios e fluxos desbloqueados ✅
- **Agente**: Cursor (Auto)
- **Desbloqueio**: `AGENTS.md` + `.cursor/rules/backstage-core.mdc` — Calendar, reports, Onboarding, AuthCallback, FloatingActions liberados para Neon (hooks/forms permanecem LOCKED)
- **Arquivos**: `Calendar.jsx`, `reports.jsx`, `Onboarding.jsx`, `AuthCallback.jsx`, `FloatingActions.jsx`, `ClientDetailModal.jsx`, `ClientInsightsModal.jsx`
- **Build**: ✅ `npm run build` sem erros

### HOTFIX — Login travando em “Carregando…” ✅
- **Causa**: `authContext` bloqueava `setLoading(false)` até carregar perfil; `getSession` sem `.catch()`; login por senha não atualizava `session` no React.
- **Correção**: `authContext.jsx`, `LoginNew.jsx`, `AuthCallback.jsx` (timeout 15s no OAuth).
- **Build**: ✅

### HOTFIX — OAuth Google: erro non-ISO-8859-1 no callback
- **Sintoma**: `/auth/callback` falha com `Failed to read the 'headers' property from 'RequestInit': String contains non-ISO-8859-1 code point` durante `exchangeCodeForSession`.
- **Causa provável**: caractere invisível (BOM, espaço unicode) em `VITE_SUPABASE_ANON_KEY` na Vercel — valor vai para headers `apikey`/`Authorization`.
- **Correção**: `src/lib/supabase.js` — sanitização Latin-1 das env vars + `global.fetch` que limpa headers antes do `fetch` nativo.
- **Build**: ✅ `npm run build`
- **Deploy**: push `main` → Vercel production
- **Smoke test**: token PKCE responde sem erro ISO-8859-1; bundle prod com URL + `sb_publishable_*` ✅
- **Follow-up**: mensagens de erro amigáveis em `AuthCallback.jsx` (PKCE expirado, flow inválido)
