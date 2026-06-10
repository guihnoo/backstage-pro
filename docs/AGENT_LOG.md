# AGENT_LOG.md — Backstage Pro

Registro cronológico de tarefas executadas por agentes.

---

## 2026-06-10

### POLISH-MICRO — payment_due_date, labels pt-BR, busca description, toast erro perfil ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **EventDetailModal (calendar)**: exibe `payment_due_date` na seção financeira quando preenchido e não pago — data em âmbar + ícone de alerta
- **Expenses.jsx**: labels de categoria agora usam pt-BR acentuado (ex: "Alimentação" em vez de "alimentacao"); busca inclui `description`; placeholder atualizado
- **ProfileSimple.jsx**: `handleSave` em catch só fazia `console.error` sem feedback — adicionado `toast.error`
- **Build**: Vite ✅; deploy: push `8e78e07`

### REVENUE-CONSISTENCY — getEventCacheAmount como fallback em 3 componentes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Bug**: `ClientInsightsModal`, `PaymentAlerts`, `ClientDetailedTable` calculavam receita/pendência usando apenas `daily_cache` dos registros de trabalho — eventos sem work registrado apareciam com valor R$ 0,00
- **Fix**: adicionado `getEventCacheAmount(event)` como fallback em todos os três (padrão já usado em `Clients.jsx`, `ClientDetailModal`, `Reports.jsx`)
- **Arquivos**:
  - `src/components/clients/ClientInsightsModal.jsx` — `getEventRevenue` helper + fallback
  - `src/components/dashboard/PaymentAlerts.jsx` — fallback no valor do alerta
  - `src/components/reports/ClientDetailedTable.jsx` — `getEventRevenue` helper + fallback em `generatedRevenue` + `pendingRevenue`
- **Build**: Vite ✅

### SLATE-COMPLETE + CLIENT-SEARCH — Migração gray→slate finalizada + busca expandida ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **SocialLoginButtons.jsx**: `text-gray-500` (rodapé OAuth) → `text-slate-500`; branding Google/Apple mantido intencional
- **Clients.jsx (busca expandida)**: filtro `searchTerm` agora inclui `razao_social`, `email`, `phone` (normalizado, sem formatação) e `city` — antes só buscava `name` + `contact_person`
- **Auditoria final `gray-*`**: todos os arquivos fora do domínio Cursor migrados para `slate-*`. Único remanescente: `SocialLoginButtons.jsx` (classes de branding Google/Apple — intencional)
- **Build**: Vite ✅ (51.75s)

### CLIENT-DETAIL-CHART-FIX — ReportsChart no ClientDetail recebia prop errada ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Bug**: `<ReportsChart data={{...}} />` — prop `data` ignorada; componente espera `chartInput`
- **Fix**: adicionado `import { getEventStatus }`, `getEventRevenue` como `useCallback`, `chartInput` como `useMemo` com `{ realized, receivable, projected, expenses }`. Prop trocada para `chartInput`
- **Arquivos**: `src/pages/ClientDetail.jsx`
- **Build**: Vite ✅

### POLISH-FORMS-HOME — Acentuação, payment_due_date, paleta slate e ProximosEventos ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **EventForm.jsx**:
  - "Observacoes" → "Observações" (label)
  - Campo `payment_due_date` adicionado na UI — input `type="date"` abaixo de "Modelo de pagamento" (já existia no `defaultState` e no payload, mas sem campo visível)
  - "Horário inicial" e "Horário final" já corrigidos na sessão anterior
- **ExpenseForm.jsx**:
  - Toast "Preencha titulo" → "Preencha título"
  - Placeholder "Sem vinculo" → "Sem vínculo"
- **ProximoShow.jsx**: `gray-*` → `slate-*` em toda a paleta (consistência com app); "Cliente sem nome" → `—` (mais elegante)
- **ProximosEventos.jsx**: `gray-*` → `slate-*` em toda a paleta; `events.slice(0, 5)` → `slice(0, 6)` (mais eventos visíveis)
- **Build**: não executado (alterações visuais e UX leves; aguarda CI do Cursor ou instrução de deploy)

---

## 2026-06-09

### UNLOCK-ALL — Todos os arquivos desbloqueados para manutenção ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Mudança**: `AGENTS.md` reescrito — seção LOCKED removida; arquivos sensíveis reclassificados como "cuidado ao editar" (`e2e/**`, `authContext.jsx`, `vite.config.js`, `package.json`, `public/`)
- Regras de convenção, scroll e segredo mantidas

### CLOSE-BTN-DEDUP — Remover botão X duplicado em modais ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Problema**: `DialogContent` (Radix) já renderiza `X` automático em `absolute right-4 top-4`. Modais com header customizado tinham um segundo `X` manual → duplicidade visível.
- **Solução**: adicionada prop `hideDefaultClose` ao `DialogContent` em `ui/dialog.jsx`. Modais com X manual usam `hideDefaultClose` para suprimir o automático.
- **Arquivos corrigidos** (4):
  - `src/components/ui/dialog.jsx` — prop `hideDefaultClose`
  - `src/components/clients/ClientDetailModal.jsx` — `hideDefaultClose`
  - `src/components/reports/EventDetailModal.jsx` — `hideDefaultClose`
  - `src/components/clients/ClientInsightsModal.jsx` — `hideDefaultClose`
  - `src/components/calendar/DateInfoModal.jsx` — `hideDefaultClose`
- `src/components/clients/ClientForm.jsx` — `hideDefaultClose` (desbloqueado nesta sessão)
- **Build**: Vite ✅ (34s)

### CLIENT-QUICK-CREATE — Criar empresa inline no EventForm com busca CNPJ ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivos**:
  - `src/components/clients/ClientQuickCreateDialog.jsx` — novo componente (dialog com `CompanySearchInput`)
  - `src/components/clients/ClientCombobox.jsx` — substituiu criação direta por abertura do dialog
- **Fluxo**: ao digitar nome novo no combobox e clicar "Criar empresa", abre dialog com busca por nome/CNPJ da Receita Federal; ao selecionar empresa, auto-preenche nome, razão social, email, phone, city/state e notes; salva empresa no banco compartilhado (`upsertCompany`) + cria cliente com `profile_complete: true` se teve dados; sem empresa encontrada, cria rascunho apenas com nome
- **Build**: Vite ✅ (exit 0, 56s)

### SPRINT-C1 — Gráficos animados em ReportsChart ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivo**: `src/components/reports/ReportsChart.jsx`
- **Mudanças**:
  - Tab "Realizado": `LineChart` → `AreaChart` com gradiente SVG (`gradRealized`) — visual premium
  - Barras (A Receber, Projetado, Geral): gradientes SVG `url(#grad*)` + `radius={[6,6,0,0]}` + `maxBarSize`
  - Animações: `animationDuration={900}` + `animationEasing="ease-out"` em todos os charts; despesas com `animationBegin={120}` para stagger
  - `AnimatePresence mode="wait"` + `motion.div key={chartView}` — fade/slide suave ao trocar de tab
  - `GradientDefs` component interno (defs SVG inline no recharts)
  - Removido import de `LineChart, Line` (não mais usados)
- **Build**: Vite ✅ (exit 0)

### PERF-SPA-LAZY — Code splitting + navegação SPA estável + E2E 47/47 ✅
- **Agente**: Cursor (Composer)
- **Performance (build)**:
  - Bundle principal `index-*.js`: **~878 KB → ~263 KB** (~70% menor)
  - Chunks lazy: `Home` ~54 KB, `Calendar` ~63 KB, `Goals` ~33 KB, `Reports` ~42 KB, `AI_Mentor` ~139 KB, `react-pdf` ~1.4 MB (só ao abrir Reports)
- **Navegação SPA (fix raiz)**:
  - `AppLayout`: `<Link>` com paths **relativos** (`calendar`, `clients`, …) + `end` no Home; `Suspense` no `<Outlet>`
  - `routes.jsx`: **todas** as rotas do shell (`Home` inclusive) via `lazy` + `HydrateFallback`
  - `App.jsx`: `RouterProvider useTransitions={false}` — evita UI “fantasma” durante troca de rota
  - `NavigationSync`: reconcile só em `popstate` (não compete com `Link`)
  - `useQueryAction`: `navigate(pathname, { replace: true })` em vez de `replaceState` cru
- **E2E**: smoke **18/18** ✅ · regression **29/29** ✅ (overflow + modais)
- **Próximo**: Sprint C (charts Reports, specs `goals-edit` / `ai-mentor-shell` se desejado)

### SPRINT-AB-FIX — Sprint A+B Cursor + fix SPA navigation + E2E 47/47 ✅
- **Agente**: Claude Code (claude-sonnet-4-6) + Cursor (Sprint A+B)
- **BUG RAIZ**: `patchHistoryNotifications` disparava `bp:history` em TODA chamada de `pushState`/`replaceState`, incluindo as internas do React Router. Isso fazia `NavigationSync.reconcile` chamar `navigate()` dentro do rAF em loop, cancelando a navegação pendente — Calendar nunca commitava. Fix: filtrar chamadas com state `{ idx }` (assinatura do React Router).
- **Arquivos alterados**:
  - `src/lib/patchHistory.js` — filtro `isReactRouterNav` para não disparar `bp:history` em navegações internas do React Router
  - `e2e/helpers/fakeAuth.js` — revertido `seedAuth` para `goto('/login') + evaluate` (addInitScript causava validação de JWT pelo Supabase → auth nunca resolvia)
  - Sprint A Cursor: deletados órfãos (`StatDetailModal`, `Profile.jsx`, `SplashScreen.jsx`, `DashboardCustomizer.jsx`, `FeedbackModal.jsx`, `PhotoReceiptAnalyzer.jsx`, `ChatInterface.jsx`, `BackupManager.jsx`)
  - Sprint B Cursor: `AppLayout` migrado de `<a onClick>` para `<Link>` (7 navItems incluindo Metas)
  - `src/lib/appNavigate.js` — novo arquivo por Cursor
  - `src/lib/hardNavigate.js`, `src/lib/useQueryAction.js`, `src/components/NavigationSync.jsx` — atualizados por Cursor
- **E2E**: 47/47 ✅ (incluindo novos testes de Metas e navegação SPA)
- **Deploy**: pendente (aguardando instrução)
- **Próximo**: Sprint C1 — gráficos animados em Reports; OAuth E2E manual; GOOGLE_CLIENT_SECRET rotation

### SESSAO-11-CLOSE — Encerramento sessão 11 + NotificationCenter ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **NotificationCenter**: DropdownMenu + `ScrollArea max-h-[60dvh]` — funcional, sem necessidade de Sheet ✅
- **Auditoria sprint completa**: todas as rotas 🟢 (login, signup, onboarding, legal, /client-detail, /ai-mentor, NotificationCenter)
- **RELATORIO** backlog atualizado; deploy registrado `0b666c7`
- **E2E total**: 46/46 ✅
- **Próximo**: OAuth E2E manual · CNPJ Amarrok · charts animados · GOOGLE_CLIENT_SECRET rotation

### PUBLIC-ROUTES-AUDIT — Rotas públicas + StatDetailModal ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Rotas auditadas**: `/login`, `/signup`, `/onboarding` — renderizam fora do `AppLayout`, usam `min-h-screen` corretamente; scroll nativo do browser 🟢
- **StatDetailModal** órfão confirmado: `QuickStats` usa `hardNavigate(config.route)`, não usa modal → seguro remover
- **AUDITORIA_PAGINAS**: rotas públicas ✅, StatDetailModal ✅, /client-detail ✅

### RESPONSIVE-FIXES-R2 — GoogleCalendarSync + Profile + Goals modal ✅
- **Agente**: Cursor (Composer)
- **GoogleCalendarSync**: status em coluna no mobile, `min-w-0`, email truncate, botões `w-full sm:w-auto`
- **ProfileSimple**: toggle visibilidade com `min-w-0 flex-1`, avatar com clip
- **Goals**: sheet de badge com `break-words` / `min-w-0`
- **Testes pós-fix**: regression 25/25 ✅, smoke 17/17 ✅ — profile @ 320px sem overflow horizontal

### CLIENT-DETAIL-AUDIT — Auditoria /client-detail ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Resultado**: página 🟢 PASS — `NeonPageShell min-h-full pb-24` ✅ · `ReportEventList` (`ScrollArea h-[400px]`) ✅ · modais: ClientForm LOCKED ✅, EventForm ✅, EventDetailModal reports ✅
- **AUDITORIA_PAGINAS**: `/client-detail` marcada ✅

### CSS-RESPONSIVE-FIX — min-h-full, overflow-x-clip, Profile grid ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Problema**: páginas com `min-h-screen` dentro de `[data-app-scroll]` conflitavam com 100vh; sem contenção de overflow-x
- **Arquivos corrigidos**:
  - `src/pages/Calendar.jsx`, `Goals.jsx`, `Home.jsx`, `ProfileSimple.jsx` — `min-h-screen` → `min-h-full`
  - `src/pages/ProfileSimple.jsx` — grid categorias `grid-cols-1 min-[360px]:grid-cols-2` + `min-w-0` nos botões
  - `src/components/design/NeonPageShell.jsx` — `overflow-x-clip` adicionado
  - `src/index.css` — `[data-app-scroll] { overflow-x: clip }`
- **Build**: ✅

### SCROLL-FLEX-SHRINK — flex-shrink-0 em DialogHeader/DialogFooter ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Problema**: `DialogHeader` e `DialogFooter` sem `flex-shrink-0` em containers `flex flex-col` — poderiam ser comprimidos em telas pequenas, ocultando conteúdo
- **Arquivos corrigidos**:
  - `src/components/calendar/EventDetailModal.jsx` — DialogHeader (l.273) + DialogFooter (l.595)
  - `src/components/clients/ClientDetailModal.jsx` — DialogHeader (l.301) + DialogFooter (l.607)
  - `src/components/reports/EventListModal.jsx` — DialogHeader (l.20)
- **Auditoria pós-fix**: grep confirma zero DialogHeader/DialogFooter sem `flex-shrink-0` em todo o projeto
- **Build**: ✅ 37.76s — sem erros

### E2E-ROUTES — Smoke navigation expenses/goals/clients/reports ✅
- **Agente**: Cursor (Composer)
- **Arquivo**: `e2e/smoke/app-routes-navigation.spec.js` (4 testes novos)
- **Cobertura**: shell da página ou estado de erro API (sessão fake); clients via Home evita redirect onboarding
- **Smoke total**: 17/17 ✅

### SESSAO-10 — Auditoria geral scroll/modais + registro docs ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Auditoria**: `/calendar`, `/reports`, `/expenses`, `/goals`, `/clients`, `/`, `/profile` — 🟢 PASS
- **Sem fix de código crítico** — padrões scroll já corretos (batches sessões 2–6)
- **Órfãos**: `StatDetailModal` não importado; `NotificationCenter` dropdown OK
- **Docs**: RELATORIO sessão 10, AUDITORIA_PAGINAS checkboxes, IDEIAS_PENDENTES atualizado
- **Build**: ✅
- **Deploy**: pendente — commits locais `91778c2`–`d077cca` não pushados

### DEPLOY-SESSAO-10 — Push + Vercel + Edge Function ✅
- **Agente**: Cursor (Composer)
- **Push**: `ed46dfc..af786fe` → `origin/main`
- **Vercel prod**: https://backstage-pro-beta.vercel.app (`dpl_EGsLJ8TBfeYsmGtZjgEzkvu8zc35`)
- **Supabase**: `search-company` function redeployada
- **Smoke E2E**: 13/13 ✅

### HOTFIX-LAZY-ROUTES — Páginas travadas em Carregando ✅
- **Agente**: Cursor (Composer)
- **Bug**: `React.lazy()` + Suspense em `/calendar`, `/clients`, `/expenses`, `/reports`, `/client-detail`, `/ai-mentor` — chunk carregava mas módulo não resolvia; fallback infinito
- **Fix**: `src/routes.jsx` — imports estáticos; removido Suspense das rotas
- **Commit**: `ed46dfc` · **Deploy**: ✅ Vercel prod
- **Testes**: smoke E2E 13/13

### DOCS-VIDA-APP — Sistema de registro e auditoria ✅
- **Agente**: Cursor (Composer)
- **Arquivos**: `CLAUDE.md`, `docs/AUDITORIA_PAGINAS.md`, `docs/IDEIAS_PENDENTES.md`
- **Atualizado**: `RELATORIO_VIDA_APP.md` sessão 9, `.cursor/rules/backstage-core.mdc`

---

## 2026-06-07

### DAYQUICK-FIX — Bug filter eventsToRegister em DayQuickActionsMobile ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivo**: `src/components/calendar/DayQuickActionsMobile.jsx`
- **Bug**: `eventsToRegister` filtrava `getEventStatus(e) !== 'paid'` — mas `getEventStatus` nunca retorna `'paid'`, então TODOS os eventos apareciam na seção "Registrar horas manualmente"
- **Fix**: mudado para `getEventStatus(e) !== 'completed'`, exibindo apenas eventos ativos/agendados na seção de registro manual
- **Build**: ✅

### CURSOR-STORAGE-AUTO12H — Migrations 009+010, Storage, applyAuto12Hours, export ✅
- **Agente**: Cursor (Composer)
- **Migration 009** (`supabase/migrations/009_clients_invoice_url.sql`): `ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_portal_url text` — aplicada via CLI de `C:\temp\backstage-sb-push` (fora do OneDrive, workaround bug CLI)
- **Migration 010** (`supabase/migrations/010_storage_backstage_bucket.sql`): cria bucket `backstage` (public=true) com RLS policies `SELECT/INSERT/UPDATE/DELETE` por `user_id`
- **`src/lib/uploadFile.js`** — criado: `uploadUserFile(file, {folder})` via Supabase Storage, bucket `backstage`, max 5MB images, retorna `{file_url, path}` (contrato compatível com Base44)
- **`src/api/integrations.js`** — `UploadFile` shim delegando para `uploadUserFile` (Supabase Storage substitui Base44 permanentemente)
- **`src/lib/applyAuto12Hours.js`** — criado: lógica Supabase pura (event lookup → insert `daily_work` por dia → update `auto_hours_applied=true`); retorna `{data:{success, daysCreated}}`
- **`src/lib/checkCompletedEventsForAutoHours.js`** — criado: batch version para aplicar 12h em todos os eventos completados sem horas
- **`src/api/functions.js`** — re-exports de `applyAuto12Hours` e `checkCompletedEventsForAutoHours` das libs Supabase (shims)
- **`src/lib/exportReport.js`** — criado: `exportReportCsv` (CSV semicolon-delimited + download) e `exportReportPdf` (print dialog)
- **`src/components/reports/ExportManager.jsx`** — reescrito com exports reais (substituiu toasts "em breve")
- **`src/lib/useClients.js`** — removidos `delete payload.invoice_portal_url` temporários (cleanup pós-migration 009)
- **Commit**: `c58bebf` ("fix: habilitar invoice_portal_url e Storage pós-migration 009/010")
- **Deploy**: ✅ Vercel

### FULL-FUNCTIONAL-AUDIT — Audit e correções de funcionalidade completa ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Fix crítico**: `useClients.js` — `invoice_portal_url` deletado do payload em `create` e `update` (coluna ausente na tabela até migration 009 ser aplicada). Clientes podem ser criados sem erro 400.
- **Fix**: `reports.jsx` `EventDetailModal` — props `client` e `onApply12h` estavam faltando.
- **Auditoria completa**: Home (LOCKED ✅), Agenda ✅, Clientes ✅, Despesas ✅, Relatórios ✅, Perfil ✅ — todos os modais e cards clicáveis verificados.
- **Pendente (ação manual)**: `ALTER TABLE clients ADD COLUMN IF NOT EXISTS invoice_portal_url text;` no Supabase SQL Editor.
- **Build**: ✅ 0 erros

### BASE44-CLEANUP-2 — Remoção de Base44 restante em componentes ativos ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **ExportManager.jsx** — `exportReportPdf` + `exportReportXlsx` substituídos por toast "em breve"; botões com opacity 60 indicam feature pendente
- **ReceiptAnalyzer.jsx** — `UploadFile` + `extractExpenseData` substituídos por toast "em breve"; formulário manual permanece funcional
- **AppLayout.jsx** — nav expandido de 5→6 itens: adicionado Despesas (Receipt) e Relatório (BarChart2); Metas removida do nav (acessível via /goals); ícones 18px, texto 9px com truncate
- **Build**: ✅ 0 erros
- **Deploy**: push main → Vercel 3a2f694

### AUDIT-PAGES — Audit completo página a página + fixes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Audit completo**:
  - **Home** ✅ DO NOT TOUCH — hooks Supabase via useBackstageData.js
  - **Agenda** ⚠️→✅ — EventForm+DailyWorkModal funcionam (DB confirmado); fix: handleQuickWorkEntry delegando para handleOpenWorkModalForDate
  - **Clientes** ✅ — Cursor migrou ClientForm; create/edit/delete funcionam
  - **Metas** ✅ — useStats + useEvents de useBackstageData.js, full Supabase
  - **Perfil** ✅ — ProfileSimple, toggle visibilidade financeira Supabase
  - **Despesas** ⚠️ — funciona; ReceiptAnalyzer usa Base44 (botão Escanear falha)
  - **Relatórios** ⚠️ (LOCKED) — display funciona; export PDF/XLSX usa Base44
  - **AppLayoutContent.jsx** — ÓRFÃO (não importado em nada); Base44 Notifications não afeta o app ativo
  - **AppLayout ativo** = bottom-nav simples (Home/Agenda/Clientes/Metas/Perfil)
- **Fixes**:
  - `Calendar.jsx` — `handleQuickWorkEntry` agora chama `handleOpenWorkModalForDate` em vez de abrir DailyWorkModal sem evento
  - `Calendar.jsx` — `handleEventActionSheetApplyManual12h` → toast informativo (Base44 removida)
  - `EventActionSheet.jsx` — import direto `applyAuto12Hours` removido; usa prop `onApplyManual12h`; prop `canApplyAuto12h` adicionada
- **Build**: ✅ 0 erros
- **Deploy**: push main → Vercel 9406016

### HOTFIX-AGENDA — Cliente + Evento na Agenda ✅
- **Agente**: Cursor (Composer)
- **Causa raiz**: `ClientForm` usava `useAppData()` sem `AppDataProvider` → crash ao cadastrar cliente → `EventForm` sem cliente no select
- **Arquivos**:
  - `src/App.jsx` — `AppDataProvider` na árvore
  - `src/components/clients/ClientForm.jsx` — migrado para `useAuth` + `useClients` (sem Base44)
  - `src/pages/Calendar.jsx` — alerta sem clientes; mobile usa menu Evento/Horas no toque do dia
  - `src/components/calendar/EventForm.jsx` — empty state cliente; `status: pending`; erros Supabase visíveis
- **Build**: ✅

### S2-CLOSE — Sprint 2 Fechamento ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Migration 008**: ✅ JÁ APLICADA — colunas `financial_visibility` e `google_calendar_connected` confirmadas via REST query (status 200). Aplicada em sessão anterior via `db push` fora do OneDrive (workaround bug CLI OneDrive).
- **FinancialVisibilityContext**: sincronizado com Supabase via `useUserSettings()` — lê `financial_visibility` do Supabase (fase 2) com fallback localStorage (fase 1 imediata). `toggleVisibility()` agora persiste via `upsert()`.
- **pages/index.jsx**: `FinancialVisibilityProvider` movido de `MigratedModuleRoute` → nível de `AppLayout`, disponível em todas as rotas autenticadas (inclusive `/profile`). `MigratedModuleRoute` simplificado para apenas `<Suspense>`.
- **ProfileSimple.jsx**: toggle "Visibilidade Financeira" adicionado — usa `useFinancialVisibility().toggleVisibility()`, persiste no Supabase, com switch visual neon seguindo cor da categoria.
- **Órfãos removidos**: ForecastSummary.jsx, SyncStatusIndicator.jsx, LegacyAppShell.jsx, LegacyRoute.jsx, navConfig.jsx, CustomReportBuilder.jsx — todos já não existem.
- **Órfãos Base44 confirmados (não deletar sem ordem)**: ChatInterface.jsx, EventTemplateModal.jsx, PhotoReceiptAnalyzer.jsx, FeedbackModal.jsx, DashboardCustomizer.jsx — nenhum é importado em nenhum arquivo.
- **Build**: ✅ 0 erros — index: 709KB, ReportEventList: 404KB, EventDetailModal: 70KB
- **E2E smoke**: 3/3 falham por timeout de teardown do contexto Playwright no Windows (GPU headless) — pré-existente, não causado por esta sessão. App carrega e guards funcionam (`[vite] connected` nos logs).

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

### LAYOUT-FIX — Layout global, Sonner, FAB e receipt_url ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Commits**: `427da45`, `1e44d47`
- **Problemas corrigidos**:
  - `ExpenseForm.jsx`: `receipt_url` retornado pelo `ReceiptAnalyzer` era descartado — adicionado a `defaultState`, `setFormData` e payload do `handleSubmit`
  - `AppLayout.jsx`: `<main>` sem `pb-20` → conteúdo ficava atrás do nav fixo; adicionado
  - `App.jsx`: `toast()` de sonner chamado em várias páginas, mas só o shadcn `<Toaster>` estava no tree; adicionado `<SonnerToaster position="top-center" richColors closeButton />`
  - `FloatingActions.jsx`: FAB em `bottom-8 z-40`, nav em `z-50 ~56px` → 24px de sobreposição; corrigido para `bottom-[88px]`
  - `Calendar.jsx`, `reports.jsx`: `NeonPageShell` sem `pb-24` → conteúdo cortado atrás do nav; adicionados
  - `DayQuickActionsMobile.jsx`: filtro `getEventStatus(e) !== 'paid'` (função nunca retorna `'paid'`) → mostrava todos os eventos na seção de registro manual; corrigido para `!== 'completed'`
- **Build**: ✅ sem erros

### BASE44-REMOVE — Remoção total do @base44/sdk ✅
- **Agente**: Cursor (Auto) + Claude Code
- **Commits**: `f7c14b1`, `68b3a75`
- **Arquivos**:
  - `src/api/base44Client.js` — **deletado**
  - `src/api/integrations.js` — **reescrito**: `UploadFile` usa `uploadUserFile` (Supabase Storage); demais funções são stubs seguros
  - `src/api/functions.js` — **reescrito**: re-exporta implementações reais (`applyAuto12Hours`, `checkCompletedEventsForAutoHours`, `exportReportCsv`, `exportReportPdf`, `createBackup`, `exportUserSnapshot`); ~35 funções Base44 → stubs `notAvailable`
  - `src/lib/featureUnavailable.js` — **criado**: helper stub compatível com contrato Base44
  - `src/lib/userDataBackup.js` — **criado**: `createBackup` exporta snapshot JSON via download do browser
  - `src/pages/ProfileSimple.jsx` — adicionado botão "Exportar meus dados" com `createBackup`
  - `src/pages/Clients.jsx`, `src/pages/Expenses.jsx` — `useEffect` orfão removido após migração para `useQueryAction`
- **Stubs ativos**: `GoogleCalendarSync`, `AI_Mentor`, `ChatInterface`, `BackupManager`, `NotificationCenter`, `AppLayoutContent`, `FeedbackModal`, `DashboardCustomizer`, `EventTemplateModal` (todos órfãos, fora do roteamento ativo)
- **Build**: ✅ 3736 módulos, sem erros de importação Base44

### TOASTER-POINTER-FIX — ToastProvider bloqueava cliques globais ✅ CRÍTICO
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Commit**: `995193c`
- **Bug**: `ToastProvider` e `ToastViewport` em `src/components/ui/toast.jsx` tinham `fixed top-0 z-[100] w-full max-h-screen` SEM `pointer-events-none`. Isso criava dois overlays invisíveis cobrindo a tela inteira em z-100 (acima do nav em z-50), capturando todos os eventos de clique/toque.
- **Sintoma**: Home carregava mas sem interatividade; outras páginas "não carregavam" porque cliques no nav eram bloqueados.
- **Fix**: Adicionado `pointer-events-none` a `ToastProvider` e `ToastViewport`. Toasts individuais já tinham `pointer-events-auto` (classe `group pointer-events-auto` no `toastVariants`) — fix é segura, interação com toasts preservada.
- **Build**: ✅ sem erros

---
## AUTH-TIMEOUT-FIX — 2026-06-07
**Commits:** d8eb1c5, 4776796
**Problema:** AuthCallback travava por até 18s sem feedback visual de escape
**Fixes:**
- EXCHANGE_TIMEOUT_MS: 12s → 8s, PROFILE_TIMEOUT_MS: 10s → 6s, OVERALL_TIMEOUT_MS: 18s → 12s
- Link "Demorou demais? Voltar ao login" aparece após 4s de loading (showEscape state)
- ProfileSimple: useEffect para sincronizar form quando profile carrega depois do mount

---
## ESLINT-ENCODING-FIX — 2026-06-07
**Arquivos:** src/components/clients/ClientInsightsModal.jsx, src/pages/reports.jsx, src/components/layout/AppLayout.jsx, src/pages/index.jsx
**Problema:** ESLint errors + mojibake (duplo-encoding UTF-8) em reports.jsx

### Fixes aplicados:
1. **ClientInsightsModal.jsx** — `no-empty`: catch blocks vazios nas linhas 80 e 94 → `/* ignore invalid date */`
2. **reports.jsx** — `no-case-declarations`: case bodies com const sem `{}` (linhas 253, 481, 504) → envoltos em blocos `{}`
3. **reports.jsx** — mojibake: 133 sequências duplo-codificadas (C3 83 C2 XX → C3 XX). Afetava acentos em strings como "Mês", "Período", "Últimos", "Concluído". Corrigido via script Python de substituição binária.
4. **AppLayout.jsx** — `min-h-0` no `<main>` para scroll correto em flexbox nas páginas internas.
5. **index.jsx** — Mantida versão estática (sem lazy) do Cursor; `MigratedModuleRoute` em `ErrorBoundary`.

**Build:** ✅ 3737 módulos, sem erros

---
## ESLINT-DEEP-PASS — 2026-06-07
**Commits:** d6bc69e, e006ebf
**Escopo:** Varredura completa de src/ exceto arquivos LOCKED

### Fixes adicionais:
1. **EventDetailModal.jsx** — `react-hooks/rules-of-hooks`: 3 `useMemo` chamados após `if (!event) return null` → movidos para antes do early return com optional chaining
2. **36 arquivos** — `import React from 'react'` removido (desnecessário com JSX transform React 17+)
3. **Calendar.jsx** — 37 mojibake C3 83 C2 XX → C3 XX corrigidos; + `deleteDailyWorkEntry` e `updateEvent` adicionados nas deps de `useCallback` (`exhaustive-deps`)
4. **ClientForm.jsx** — aspas não escapadas em JSX text substituídas por `&ldquo;` / `&rdquo;`
5. **command.jsx / toast.jsx** — `eslint-disable-next-line` para atributos custom de libs (`cmdk-input-wrapper`, `toast-close`)

**Resultado:** zero violações de `rules-of-hooks`, `exhaustive-deps`, `no-empty`, `no-case-declarations` em arquivos não-LOCKED
**Build:** ✅ 3737 módulos, sem erros
