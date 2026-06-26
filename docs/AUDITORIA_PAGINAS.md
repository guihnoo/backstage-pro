# Auditoria página a página — Backstage Pro

> Checklist vivo para revisão premium. Marque `[x]` quando validado em **mobile + desktop** após deploy.  
> Legenda: 🟢 OK · 🟡 Ajustar · 🔴 Quebrado · ⬜ Não revisado

**Última rodada geral:** 2026-06-22 (S167) — auditoria E2E interativa CDP · 7 páginas validadas em conta real · 1 bug corrigido (ClientDetailModal Editar)  
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
| Banner offline | [x] | 🟢 | `OfflineBanner` global — só âmbar sem internet (S183) |
| Prefetch nav | [x] | 🟢 | `routePrefetch.js` hover/touch bottom nav |
| Load progressivo S185 | [x] | 🟢 | Skeleton só sem cache hooks; fallback offline via `deriveDashboard` |
| Lazy ForecastWidget S185 | [x] | 🟢 | chunk separado ~2.7KB gzip |
| Pull-to-refresh silencioso S185 | [x] | 🟢 | `refetch({ silent: true })` — sem flash de skeleton |
| Header palco/motivação S185 | [x] | 🟢 | Removido `AnimatePresence mode="wait"` (risco tela preta S158) |

**Testes:** bottom-nav smoke ✅ · calendar-navigation ✅ · overflow-responsive `/` ✅

---

## Agenda `/calendar`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`Calendar.jsx`) | [x] | 🟢 | S184: load progressivo (events+clients); lazy Kanban/Calc/Disponibilidade; offline não bloqueia |
| Vista Semana (`week`) | [x] | 🟢 | scroll-x em mobile; cards com overflow tratado; `+N mais` é `<button type="button">` ✅ (S139 auditoria) |
| Vista Próximos Shows (`upcoming`) | [x] | 🟢 | lista agrupada; `EventHeading` + truncate; scroll da página OK (S139 auditoria) |
| Vista Kanban (`kanban`) | [x] | 🟢 | `KanbanPipeline.jsx` card `<button type="button">` ✅; colunas scroll-x OK (S139 auditoria) |
| `BackstageCalendarGrid` | [x] | 🟢 | `role="grid"` + roving tabindex + Arrow keys; `EventLanesOverlay` `type="button"` ✅ (S138) |
| `EventForm` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `EventDetailModal` (calendar) | [x] | 🟢 | S184: fullscreen mobile `100dvh`; ScrollArea fill ✅ |
| `DailyWorkModal` (LOCKED) | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `DateInfoModal` | [x] | 🟢 | `ScrollArea fill` ✅ |
| `RecurringEventActionModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `EventTemplateModal` | [x] | 🟢 | `bp-modal-scroll` ✅ |
| `DayBottomSheet` | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `EventActionSheet` (mobile) | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `EventHoursSheet` | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll` ✅ |
| `CacheCalculator` | [x] | 🟢 | Dialog Radix; inputs com `htmlFor`; `type="button"` ✅ (S139 auditoria) |
| `AvailabilityShareModal` | [x] | 🟢 | Dialog `max-h-[90dvh] flex flex-col`; `flex-1 overflow-y-auto` na lista ✅ (S139 auditoria) |
| `EventChecklist` | [x] | 🟢 | todos `type="button"` ✅; renderizado dentro do `EventDetailModal` (S139 auditoria) |
| `AlertsPanel` | [x] | 🟢 | `min-w-0` + `break-words` no body; títulos longos não extrapolam ✅ lapida |
| `CalendarTodayStrip` | [x] | 🟢 | `EventHeading` (company name) + prop `clients`; location truncate correto ✅ lapida |
| `EventDetailModal` client name | [x] | 🟢 | `max-w-[200px] sm:max-w-[300px]` — não corta nomes médios em mobile ✅ lapida |
| Multi-eventos (inline) | [x] | 🟢 | `max-h-80 overflow-y-auto` + `useAppScrollLock` ✅ |

**Testes:** calendar-navigation ✅ · event-form auth ✅ · 18 smoke ✅ (lapida `85d0c2e`)

---

## Clientes `/clients`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página lista + filtros | [x] | 🟢 | pull-to-refresh silencioso ✅ (S187) |
| Offline cache S187 | [x] | 🟢 | Erro só bloqueia online sem cache; banner inline |
| Lazy modais S187 | [x] | 🟢 | ClientForm/DetailModal/ActionSheet/Insights/InactivePanel — chunk ~21KB |
| Cards lista | [x] | 🟢 | `truncate` + `title` em nome/contato; `min-w-0 overflow-hidden` ✅ |
| `ClientForm` (LOCKED) | [x] | 🟢 | `ScrollArea fill` ✅; Razão Social adicionado sessão 10 |
| `ClientDetailModal` | [x] | 🟢 | `EventHeading` timeline + próximos eventos; header truncate ✅; botão Editar corrigido (S167 `a466c1a`) |
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
| Página | [x] | 🟢 | pull-to-refresh silencioso ✅ (S188); offline cache |
| Lazy forms S188 | [x] | 🟢 | ExpenseForm + ReceiptAnalyzer lazy; chunk ~20KB |
| `ExpenseListItem` | [x] | 🟢 | `EventHeading` c/ client lookup correto (`useClients` → prop `client`); `ClampedText` em notas ✅ |
| `ExpenseForm` (LOCKED) | [x] | 🟢 | `ScrollArea fill` ✅; select evento com truncate ✅ |
| `ReceiptAnalyzer` | [x] | 🟢 | OCR Gemini Vision — Edge Function `analyze-receipt` ✅ |

**Testes:** expense-form auth ✅ · app-routes-navigation ✅

---

## Relatórios `/reports`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`Reports.jsx`) | [x] | 🟢 | pull-to-refresh silencioso ✅; KPI StatCards truncate ✅; erro só bloqueia online sem cache (S186) |
| Lazy charts S186 | [x] | 🟢 | 20+ componentes lazy; chunk inicial ~39KB gzip (era ~137KB) |
| Offline cache S186 | [x] | 🟢 | Banner inline + dados em cache quando offline/erro |
| Modal projeção S186 | [x] | 🟢 | `100dvh` mobile + `bp-modal-scroll` |
| `ReportEventList` | [x] | 🟢 | `EventHeading` + título truncado ✅ |
| `KPIDetailModal` | [x] | 🟢 | `EventHeading` em itens de evento; título `Ellipsis` ✅ |
| `EventDetailModal` (reports) | [x] | 🟢 | `ScrollArea fill` ✅; card NF-e (S137): botões `type="button"` ✅; `InlineNotes`: `role="button"` + `tabIndex` + `onKeyDown` ✅ |
| `PaymentConfirmModal` | [x] | 🟢 | título do evento com `Ellipsis` ✅ |
| `DrilldownModal` | [x] | 🟢 | `max-h-[90dvh] flex flex-col overflow-hidden`; `DialogHeader flex-shrink-0`; `ScrollArea fill` ✅ (S136) |
| `BrazilVisitedMap` | [x] | 🟢 | Lazy subcomponent OK |
| `ExportManager` PDF/CSV/ICS | [x] | 🟢 | Implementado |
| `SmartInsights` | [x] | 🟢 | Card simples; sem modal; OK (S139 auditoria) |
| `SeasonalityChart` | [x] | 🟢 | Recharts; sem scroll; OK (S139 auditoria) |
| `WeekdayBreakdown` | [x] | 🟢 | Recharts; sem scroll; OK (S139 auditoria) |
| `NfTracker` | [x] | 🟢 | `EventHeading`; `type="button"` ✅; OK (S139 auditoria) |
| `CacheEvolutionChart` | [x] | 🟢 | Recharts; isVisible ✅; OK (S139 auditoria) |
| `InactiveClientsPanel` | [x] | 🟢 | header `type="button"` ✅; expand/collapse correto (S139 auditoria) |
| `TopClients` | [x] | 🟢 | card simples; `EventHeading`; OK (S139 auditoria) |
| `CategoryBreakdown` | [x] | 🟢 | card simples; sem scroll; OK (S139 auditoria) |
| `CashflowForecast` | [x] | 🟢 | `EventHeading`; inline card; OK (S139 auditoria) |
| `ReceivablesAging` | [x] | 🟢 | `EventHeading`; `type="button"` ✅; OK (S139 auditoria) |
| `YearOverYear` | [x] | 🟢 | gráfico + tabela; sem scroll; OK (S139 auditoria) |
| `MonthlyTrend` | [x] | 🟢 | Recharts; OK (S139 auditoria) |
| `IRSummary` | [x] | 🟢 | expansível; `type="button"` ✅; OK (S139 auditoria) |
| `WorkAnalytics` | [x] | 🟢 | gráficos + tabelas; `EventHeading`; OK (S139 auditoria) |

**Testes:** routes-auth ✅ · app-routes-navigation ✅ · reports-guards regression ✅

---

## Metas `/goals`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`Goals.jsx`) | [x] | 🟢 | pull-to-refresh ✅; tabs sem `mode="wait"` (S189) |
| Lazy MeiDashboard/modais S189 | [x] | 🟢 | chunk ~37KB gzip 11KB |
| Próximos Shows | [x] | 🟢 | `EventHeading` + data truncada ✅ |
| `MeiDashboard` | [x] | 🟢 | alert banner e valores financeiros truncate ✅ |
| Badge bottom sheet | [x] | 🟢 | `useAppScrollLock` + `bp-modal-scroll`; título `Ellipsis` ✅ |
| `BadgeCelebration` overlay | [x] | 🟢 | `useAppScrollLock` ✅; auto-fecha em 4s |
| `EventDetailModal` | [x] | 🟢 | `ScrollArea fill` ✅ |

---

## Perfil `/profile`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página ProfileSimple | [x] | 🟢 | `NeonPageShell min-h-full pb-28` ✅; pull-to-refresh (`refetchStats`) ✅ lapida |
| `GoogleCalendarSync` | [x] | 🟡 | OAuth E2E manual pendente |
| Template fechamento PDF | [x] | 🟢 | sessão 10 — campos nome/subtítulo/PIX ✅ |
| Visibilidade financeira | [x] | 🟢 | Supabase sync ✅ |

---

## AI Mentor `/ai-mentor`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (chat) | [x] | 🟢 | `flex flex-col h-[calc(100dvh-10rem)]` + `flex-1 overflow-y-auto` mensagens ✅ |
| Input chat | [x] | 🟢 | `pb-safe` adicionado — evita sobreposição home indicator iOS ✅ lapida |
| Sheet histórico | [x] | 🟢 | `flex flex-col` + SheetHeader/botão `flex-shrink-0` + `flex-1 overflow-y-auto` ✅ |
| `MessageBubble` | [x] | 🟢 | `max-w-[85%]`; código `overflow-x-auto`; JSON `max-h-48 overflow-auto` ✅ |
| `SmartSuggestions` | [x] | 🟢 | `grid cols-1/2`; icon `flex-shrink-0`; texto wraps naturalmente ✅ |
| Typing dots animation | [x] | 🟢 | `TypingDots` com 3 pontos Framer Motion (substituiu Loader2 + texto) ✅ S33 |
| Empty state por categoria | [x] | 🟢 | `CATEGORY_HINTS[profile?.category]` — hint personalizado por categoria ✅ S33 |

---

## Modais globais / compartilhados

| Componente | Scroll | Status | Notas |
|------------|--------|--------|-------|
| `ConfirmDialog` | [x] | 🟢 | `AlertDialogContent` com `overflow-y-auto overscroll-contain` ✅ |
| `FeedbackModal` | [x] | 🟢 | Perfil → Suporte; tipos, rating, screenshot; `bp-modal-scroll` ✅ |
| Inbox owner `/admin/feedbacks` | [x] | 🟢 | RLS `profiles.role=owner`; filtros + notas internas ✅ |
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
| `DropdownMenuContent` z-50 atrás de Dialog z-101 | ✅ Corrigido | S150 `b4454f6` — `z-[150]`; `TooltipContent` → `z-[200]` |
| Tab bar Reports overflow em mobile (Fiscal oculto) | ✅ Corrigido | S151 `0232540` — labels curtos + gap menor + fade gradiente direita |

---

## Próxima sprint de auditoria (ordem sugerida)

1. [x] **`/client-detail`** — auditada sessão 11 ✅
2. [x] **`/ai-mentor`** — desbloqueado + auditado sessão 11 ✅
3. [x] **Rotas públicas** — auditadas sessão 11 ✅ (fora AppLayout, scroll nativo OK)
4. [x] **`StatDetailModal`** — órfão confirmado; QuickStats usa `hardNavigate`; seguro remover quando quiser
5. [x] **NotificationCenter** — DropdownMenu + `ScrollArea max-h-[60dvh]` ✅ não usa Dialog, sem scroll lock; aceitável
