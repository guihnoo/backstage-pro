# Auditoria página a página — Backstage Pro

> Checklist vivo para revisão premium. Marque `[x]` quando validado em **mobile + desktop** após deploy.  
> Legenda: 🟢 OK · 🟡 Ajustar · 🔴 Quebrado · ⬜ Não revisado

**Última rodada geral:** 2026-06-09 (sessão 10) — auditoria completa scroll/modais  
**Produção:** https://backstage-pro-beta.vercel.app

---

## Como auditar cada item

1. Abrir a rota logado (ou seed E2E)
2. Rolagem da **página** (conteúdo maior que viewport)
3. Abrir **cada modal/sheet** → rolagem interna + fundo não rola
4. Registrar em `RELATORIO_VIDA_APP.md` se corrigir algo

---

## Rotas públicas

> Estas rotas renderizam **fora** do `AppLayout` — sem `main[data-app-scroll]`. Usam `min-h-screen` corretamente; scroll nativo do browser as cobre.

| Rota | Página | Scroll | Modais | E2E | Status | Notas |
|------|--------|--------|--------|-----|--------|-------|
| `/login` | LoginNew | [x] | — | ⬜ | 🟢 | `min-h-screen overflow-x-hidden` — fora do AppLayout ✅ |
| `/signup` | SignupNew | [x] | — | ⬜ | 🟢 | `min-h-screen flex center py-10` — scroll doc ✅ |
| `/onboarding` | Onboarding | [x] | — | ⬜ | 🟢 | 5 steps; `items-start py-8` — sem corte em mobile ✅ |
| `/privacidade` | PrivacyPolicy | [x] | — | ⬜ | 🟢 | `min-h-screen` fora AppLayout, scroll nativo ✅ |
| `/termos` | TermsOfService | [x] | — | ⬜ | 🟢 | `min-h-screen` fora AppLayout, scroll nativo ✅ |

---

## Home `/`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página inteira (`Home.jsx`) | [x] | 🟢 | LOCKED — `main[data-app-scroll]` ✅ |
| Card Próximo Show / Modo Palco | [x] | 🟢 | LOCKED ✅ |
| `QuickStats` inline | [x] | 🟢 | sem modal próprio |
| `StatDetailModal` | [x] | 🟢 | Removido — arquivo não existia no src; referência limpa ✅ |
| `FloatingActions` FAB | [x] | 🟢 | `z-40`, `bottom-[88px]` ✅ |
| `NotificationCenter` | [x] | 🟡 | DropdownMenu — sem `useAppScrollLock`; aceitável para dropdown |
| `ProximosEventos` | [x] | 🟢 | LOCKED ✅ |
| Overflow texto longo | [x] | 🟢 | `overflowText`, `EventHeading`, truncate em alertas/forecast |
| Pull-to-refresh | [x] | 🟢 | `usePullToRefresh` + indicador mobile |
| `ForecastWidget` | [x] | 🟢 | `getEventDisplay` + truncate |
| `AlertasBastidao` | [x] | 🟢 | Ellipsis + line-clamp descrição |
| `MetaMensalBar` | [x] | 🟢 | CTA quando metas zeradas |
| Banner offline | [x] | 🟢 | `OfflineBanner` global AppLayout |
| Prefetch nav | [x] | 🟢 | `routePrefetch.js` hover/touch bottom nav |

**Testes:** bottom-nav smoke ✅ · calendar-navigation ✅ · overflow-responsive `/` ✅

---

## Agenda `/calendar`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`Calendar.jsx`) | [x] | 🟢 | `NeonPageShell pb-24` ✅ |
| `EventForm` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `EventDetailModal` | [x] | 🟢 | `ScrollArea fill` + `flex-shrink-0` header/footer ✅; categoria despesa inline traduzida sessão 19 |
| `DailyWorkModal` (LOCKED) | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `DateInfoModal` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `RecurringEventActionModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `EventTemplateModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `DayBottomSheet` | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `EventActionSheet` (mobile) | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `EventHoursSheet` | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `AlertsPanel` | [x] | 🟢 | `min-w-0` + `break-words` no body; títulos longos não extrapolam ✅ lapida |
| `CalendarTodayStrip` | [x] | 🟢 | `EventHeading` (company name) + prop `clients`; location truncate correto ✅ lapida |
| `EventDetailModal` client name | [x] | 🟢 | `max-w-[200px] sm:max-w-[300px]` — não corta nomes médios em mobile ✅ lapida |
| Multi-eventos (inline) | [x] | 🟢 | `max-h-80 overflow-y-auto` + `useAppScrollLock` ✅ |

**Testes:** calendar-navigation ✅ · event-form auth ✅ · 18 smoke ✅ (lapida `85d0c2e`)

---

## Clientes `/clients`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página lista + filtros | [x] | 🟢 | `NeonPageShell min-h-full pb-24` ✅; pull-to-refresh ✅ lapida |
| Cards lista | [x] | 🟢 | `truncate` + `title` em nome/contato; `min-w-0 overflow-hidden` ✅ |
| `ClientForm` (LOCKED) | [x] | 🟢 | `ScrollArea fill` ✅; Razão Social adicionado sessão 10 |
| `ClientDetailModal` | [x] | 🟢 | `EventHeading` timeline + próximos eventos; header truncate ✅ |
| `ClientInsightsModal` | [x] | 🟢 | `Ellipsis` no título; `EventHeading` último evento ✅ |
| `ClientActionSheet` | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `CompanySearchInput` (3 abas) | [x] | 🟢 | Pesquisar/CNPJ/NF-e — sessão 10 |

**Testes:** routes-auth ✅ · app-routes-navigation ✅

---

## Detalhe cliente `/client-detail`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | [x] | 🟢 | Header truncate; `StatCard` valores truncados; notas com `ClampedText` ✅ |
| `ReportEventList` | [x] | 🟢 | `ScrollArea h-[400px]` — card inline, correto ✅ |
| `ClientForm` (LOCKED) | [x] | 🟢 | `ScrollArea fill` ✅ |
| `EventForm` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `EventDetailModal` (reports) | [x] | 🟢 | `ScrollArea fill` + `flex-shrink-0` ✅ |

---

## Despesas `/expenses`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | [x] | 🟢 | `NeonPageShell pb-24` ✅; pull-to-refresh ✅; StatCard/MonthGroup truncate ✅ |
| `ExpenseListItem` | [x] | 🟢 | `EventHeading` no evento vinculado; `ClampedText` em notas ✅ |
| `ExpenseForm` (LOCKED) | [x] | 🟢 | `ScrollArea fill` ✅; select evento com truncate ✅ |
| `ReceiptAnalyzer` | [x] | 🟢 | OCR Gemini Vision — Edge Function `analyze-receipt` ✅ |

**Testes:** expense-form auth ✅ · app-routes-navigation ✅

---

## Relatórios `/reports`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`reports.jsx`) | [x] | 🟢 | `NeonPageShell pb-24` ✅; `LiveClockBar` adicionado sessão 18 |
| `EventDetailModal` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `DrilldownModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `KPIDetailModal` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `PaymentConfirmModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `EventListModal` | [x] | 🟢 | `ScrollArea fill` + `flex-shrink-0` header ✅ |
| `DashboardCustomizer` | [x] | 🟢 | Removido no purge sessão 16 — não existe mais no src |
| `BrazilVisitedMap` | [x] | 🟢 | Lazy subcomponent OK |
| `ExportManager` PDF/CSV | [x] | 🟢 | Implementado |

**Testes:** routes-auth ✅ · app-routes-navigation ✅ · reports-guards regression ✅

---

## Metas `/goals`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | [x] | 🟢 | `NeonPageShell min-h-full pb-24` ✅ |
| Badge bottom sheet | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `BadgeCelebration` overlay | [x] | 🟢 | `useAppScrollLock` ✅; auto-fecha em 4s |
| `EventDetailModal` | [x] | 🟢 | `ScrollArea fill` ✅ |

---

## Perfil `/profile`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página ProfileSimple | [x] | 🟢 | `NeonPageShell min-h-full pb-28` ✅ |
| `GoogleCalendarSync` | [x] | 🟡 | OAuth E2E manual pendente |
| Template fechamento PDF | [x] | 🟢 | sessão 10 — campos nome/subtítulo/PIX ✅ |
| Visibilidade financeira | [x] | 🟢 | Supabase sync ✅ |

---

## AI Mentor `/ai-mentor`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (chat) | [x] | 🟢 | `flex flex-col h-[calc(100dvh-10rem)]` + `flex-1 overflow-y-auto` mensagens ✅ |
| Sheet histórico | [x] | 🟢 | `flex flex-col` + SheetHeader/botão `flex-shrink-0` + `flex-1 overflow-y-auto` ✅ |

---

## Modais globais / compartilhados

| Componente | Scroll | Status | Notas |
|------------|--------|--------|-------|
| `ConfirmDialog` | [x] | 🟢 | `AlertDialogContent` com `overflow-y-auto overscroll-contain` ✅ |
| `FeedbackModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `NotificationCenter` | [x] | 🟡 | DropdownMenu, scroll lock não necessário — aceitável |
| `StatDetailModal` | [x] | 🟢 | Removido — arquivo inexistente no src (purge anterior); referência limpa ✅ |

---

## Bugs conhecidos (não repetir)

| Bug | Status | Fix / commit |
|-----|--------|----------------|
| Lazy routes travam em Carregando | ✅ Corrigido | `ed46dfc` — imports estáticos |
| `eventsToRegister` filtro errado | ✅ Corrigido | AGENT_LOG 2026-06-07 |
| Toast overlay z-100 bloqueava cliques | ✅ Corrigido | `TOASTER-POINTER-FIX` |
| Scroll fundo com modal aberto | ✅ Corrigido | `useAppScrollLock` + CSS sessões 2–6 |
| `z-50` conflitando nav/dialogs/sheets | ✅ Corrigido | Hierarquia z-index oficial |
| `min-h-0` ausente em flex main | ✅ Corrigido | AppLayout.jsx |
| `flex-shrink-0` ausente em DialogHeader/Footer | ✅ Corrigido | SCROLL-FLEX-SHRINK 2026-06-09 |
| `min-h-screen` em páginas dentro de `data-app-scroll` | ✅ Corrigido | sessão 11 — Calendar, Goals, Home, Profile → `min-h-full` |

---

## Próxima sprint de auditoria (ordem sugerida)

1. [x] **`/client-detail`** — auditada sessão 11 ✅
2. [x] **`/ai-mentor`** — desbloqueado + auditado sessão 11 ✅
3. [x] **Rotas públicas** — auditadas sessão 11 ✅ (fora AppLayout, scroll nativo OK)
4. [x] **`StatDetailModal`** — órfão confirmado; QuickStats usa `hardNavigate`; seguro remover quando quiser
5. [x] **NotificationCenter** — DropdownMenu + `ScrollArea max-h-[60dvh]` ✅ não usa Dialog, sem scroll lock; aceitável
