# Relatório de Vida — Backstage Pro

> Documento vivo para Cursor, Claude Code e humanos.  
> **Atualize este arquivo a cada sessão significativa** (feature, fix, deploy, decisão de arquitetura).

**Última atualização:** 2026-10-22 (ideias novas 106–113 implementadas na branch `feat/ideias-novas`, **não publicadas**; Claude Code)  
**Pendente de deploy:** branch `feat/ideias-novas` (ideias 106–113) — **ordem obrigatória**: 1) migração `046_ideias_novas` (sem ela o Perfil não salva e o Novo trabalho falha), 2) Edge `analyze-job` (verify_jwt on; usa GEMINI_API_KEY), 3) push para `main`. Migrations 034–045 já em produção  
**Pasta local:** `C:\dev\backstage-pro` (desde 2026-10-09; a cópia antiga em `OneDrive\Documentos\backstage-pro` não é mais a pasta de trabalho)  
**Produção:** https://backstage-pro-beta.vercel.app  
**Último deploy:** 2026-10-22 — revisão das telas + CHEGUEI + destinos (`03ee64a`, push de `review/telas-fase1` para `main`; bundle `index-BAYKE3jv.js`). Antes: 2026-10-22 barra SALVAR do Perfil (`b849156`)  
**Edge Functions:** `ai-chat` + `analyze-receipt` + `google-calendar` v30 (Google Agenda v2, verify_jwt off — confere login por dentro) + `google-calendar-callback` v20 + `analyze-nfe` v5 (Files API + maxOutputTokens 8192 + thinkingBudget 0 — **testado e funcionando em produção** ✅) + `delete-account` v1 (2026-10-22, verify_jwt on, exige "EXCLUIR") + `send-push-digest` v6 (2026-10-22, avisos abrem a tela certa) deployadas no Supabase ✅  
**E2E:** smoke+regression com a **trava do banco** (todo POST/PATCH conferido contra as colunas reais) — **106 passando, 1 pulado** com os novos `home-cheguei` e `destinos-certos` (2026-10-22) · robô de botões `BP_CRAWL=1 npx playwright test e2e/audit --workers=3` · unit 281/281  
**Supabase ref:** `cwtallnetgodoacuoaow`

---

## Estado atual (resumo)

| Área | Status |
|------|--------|
| Core (eventos, clientes, despesas, horas) | Funcional |
| **Números entre telas (2026-10-09)** | Regra única em `src/lib/financeMetrics.js`: recebido por `paid_date`, previsto pela data do show, despesa por `expense_date`. Home, Metas, Relatórios e telas de cliente consomem as mesmas funções; todo "marcar pago" grava `paid_amount`. **Não recalcular dinheiro inline — usar o módulo.** Detalhe em `PLANO_REVISAO_GERAL.md` § Implementação |
| Confirmar Recebimento (`PaymentConfirmModal`) | Estava quebrado em produção desde S82: enviava `payment_method`, coluna que não existe em `events`. Agora só envia/mostra a forma de recebimento se a coluna existir; migration 034 pronta, **aguardando ok para aplicar** |
| Clientes — Empresa vs Pessoa | `client_type` coluna DB; toggle visual em form/combobox/cards/modais ✅ sessão 20–22 |
| Google Calendar OAuth + sync | v2 **no ar** desde 2026-10-21 (sincroniza sozinho a cada 15 min via cron `google-agenda-sync`, opções no Perfil, aviso de dia ocupado); **OAuth para todos pendente** (domínio + verificação Google) |
| Editar/excluir eventos (todas as telas) | Home, Metas, Agenda, Relatórios, ClientDetail, **NotificationCenter** ✅ |
| Dedupe Google Calendar | `googleEventDedupe` (unit + edge + smoke Perfil) ✅ |
| Busca global | `GlobalSearch.jsx` na TopBar — eventos + clientes ✅ |
| UX cores / hierarquia empresa | Implementado (`brandColors`, `EventHeading`) |
| Combobox cliente + geocode local | Implementado; criar Pessoa inline ✅ |
| Local do evento (endereço + GPS check-in) | `EventLocationSection` — criar, detalhe, action sheet |
| Páginas legais OAuth | `/privacidade`, `/termos` |
| Scroll / modais / z-index | Corrigido (v1–v3); popovers/select `z-[110]` dentro de dialogs |
| Badge rascunho (clientes) | Cards + modal detalhe + filtro **Rascunhos** |
| OAuth Google callback | Redirect `/profile?google_connected=1`; toast ao detectar query |
| Mapa Brasil (relatórios) | SVG interativo `@svg-maps/brazil`; marcadores calibrados (S39 — east fix -28.85→-34.79) |
| Alertas agenda (local GPS) | `AlertsPanel` montado em `Calendar.jsx` — lembrete check-in para eventos de hoje sem local |
| Modo Palco — check-in GPS | Botão em `ProximoShow` quando `isOnStage` e sem local |
| Rotas lazy (code-split) | **Reativado** — AppLayout usa `<Suspense>` + `wrapPage` lazy; Sprint A+B |
| Nav SPA via Link | `AppLayout` migrado de `<a onClick>` para `<Link>` (7 navItems + Metas) |
| patchHistory fix | Filtra chamadas internas React Router (state.idx) — evitava loop que cancelava lazy load |
| Gráficos animados (Sprint C1) | `ReportsChart`: AreaChart + gradientes SVG + AnimatePresence tabs |
| Auditoria / ideias | `docs/AUDITORIA_PAGINAS.md` + `docs/IDEIAS_PENDENTES.md` + `CLAUDE.md` |
| OAuth Google (UX erros) | `googleOAuthErrors.js` + callback preserva `refresh_token` em reconexão |
| CompanySearchInput (3 abas) | Pesquisar / CNPJ / NF-e XML — sessão 10 |
| PDF fechamento evento | `EventPDFDocument` + template no Perfil — dynamic import |
| Goals UX | 3° círculo A Receber, empty state shows, mês no header |
| Expenses UX | `MonthGroup` colapsável + filtro por evento |
| Auditoria scroll/modais | Sessão 10 — rotas principais 🟢 (ver `AUDITORIA_PAGINAS.md`) |
| Meta mensal = diárias únicas | `diarias_count` + UI Goals/Home/Perfil/IA/Onboarding ✅ |
| Backup git automático | Hook `.cursor/hooks.json` + `npm run git:backup` ✅ |
| Realtime sync multi-device | `RealtimeSyncProvider` + `realtimeBus` + `useRealtimeRefetch` — todos os hooks integrados; migração `028_enable_realtime.sql` **aplicada** ✅ |
| Classes Tailwind dinâmicas | Corrigidas em S27: `FinancialSummary`, `CategoryPicker`, `ClientDetailModal` — mapas estáticos substituem interpolação `bg-${color}-X` |
| Lapidação S28 | Auditoria completa: 10 componentes auditados, typo `PaymentConfirmModal` corrigido; todos componentes restantes confirmados limpos |
| Lapidação S29 | 38 componentes auditados; `GoogleCalendarSync` 3× `window.confirm()` → `ConfirmDialog`; `ReceiptAnalyzer` timezone bug (`toISOString` → `format`) |
| Google Calendar melhorias | Mapa fix (`.key` bug); matching fuzzy título→cliente; parser location→city/state; badge "fora de sinc" no header Agenda e em Configurações |
| Push Notifications (S30) | VAPID keys rotacionados; `VITE_VAPID_PUBLIC_KEY` adicionado a `.env.local` e Vercel; Edge Functions `send-push-digest`+`send-push-test` reimplantadas; cron 8h/18h BRT ativo; `push_subscriptions` limpa (reativar no Perfil após deploy) |
| Lapidação Sprint (S31) | **Sprint completa — 8/8 páginas `done`** — Cursor: Home, Clientes, Despesas, Relatórios, Metas; Claude Code: Agenda (`85d0c2e`), Despesas fix client lookup (`cad4b34`), Perfil pull-to-refresh (`c43302b`), IA Mentor pb-safe iOS (`e26d418`) |
| PWA offline refinado (S32) | `usePWA` hook (install prompt + isInstalled + isOnline); `InstallPwaCard` em Perfil (dismissível, persiste localStorage); `OfflineBanner` com estado "Conexão restaurada — puxe para atualizar" 3s + dispara `backstage:reconnect` CustomEvent |
| PWA offline Fase 1 (S180) | `useRealtimeRefetch` escuta `backstage:reconnect` → refetch silencioso em todos os hooks; `ProfileOfflineProvider` + `useProfile()` + cache `localStorage`; Workbox Supabase cache 7 dias / 200 entradas; telas Home/Goals/Calendar/AppLayout/AppTopBar usam perfil offline |
| PWA offline Fase 2 (S181–S183) | IndexedDB + fila CRUD + sync **silencioso** ao reconectar; detecção automática (`connectivityStore`); banner **só sem internet** (sem pending/reconectado) |
| Auditoria mobile S184–S189 | **S184 Agenda** · **S185 Home** · **S186 Relatórios** · **S187 Clientes** (lazy modais, offline cache) · **S188 Despesas** · **S189 Metas** (lazy MeiDashboard/modais, tabs sem `mode="wait"`) |
| Lapidação premium S183 (Claude Code) | **Haptics** (`haptics.js` via navigator.vibrate): toggle pagamento, confirmar evento, pull-to-refresh, nav inferior; **PullToRefreshIndicator** reescrito com anel SVG de progresso circular; **skeletons shimmer** completos em todos os componentes da Home (AReceber, ForecastWidget, PipelineFinanceiro, AlertasBastidao, MetaMensalBar, QuickStats, ProximosEventos); **stagger animation** nos cards de Clientes; barra "Confiabilidade" animada com `motion.div` |
| CRM automatizado (S32) | Painel "Próximos Passos" em `EventDetailModal` para eventos concluídos: checklist horas (12h auto / manual) + pagamento (marcar pago / WhatsApp cobrança); badge "Evento fechado 🎉" quando tudo ok; remove botão redundante do footer |
| Alertas CRM proativos (S32) | `AlertsPanel`: 2 novas regras — "Horas pendentes" (eventos últimos 14 dias sem horas) + "Pagamentos vencidos" (payment_due_date passado + unpaid); botão "Ver evento" abre `EventDetailModal` via `onOpenEvent` prop |
| IA Mentor polish (S33) | `TypingDots` component: 3 pontos animados Framer Motion substituem spinner+texto; `CATEGORY_HINTS` map: empty state hint dinâmico por categoria (audio/lighting/photo/video/dj/…) usando `profile.category` |
| Manual do usuário (S33) | `docs/MANUAL_USUARIO.md` + rota `/help` in-app (`AppHelp.jsx` + `userManualContent.js`); link no Perfil → "Abrir manual do app" |
| Fix CRM WhatsApp (S33) | `handleChargeWhatsApp` no `EventDetailModal` — usa `buildChargeMessage` profissional em vez de lista genérica de detalhes do evento (`6949f70`) |
| Projeção detalhada (S33) | `Reports.jsx` (`2f0cae9`): Dialog "Projeção do Próximo Período" — lista eventos agendados com valor, data, cliente; clique abre EventDetailModal |
| Histórico mensal metas (S33) | `Goals.jsx` (`2c660e2`): grid 2×2 na aba Metas mostrando receita paga + barra de progresso vs meta dos últimos 4 meses |
| S97-S100 UX (2026-06-15) | Reports: chips de filtro por cliente; AlertsPanel: 1 alerta por evento CRM; Calendar: swipe meses/semanas; DailyWorkModal: banner timer ao vivo com "Usar tempo" |
| Lapidação duplicidades (2026-06-15) | `CalendarPageHeader`: removido resumo financeiro redundante; `Calendar`: removido 5º StatCard "Clientes"; `Goals`: 4→2 cards (removidos Recebido + A Receber já nos círculos); `EventDetailModal`: fusão "Resultado do Show" → "Financeiro" |
| S101-S103 (2026-06-15) | `PipelineFinanceiro`: Despesas + Resultado Líquido do mês; `AReceber`: badge "Xd atraso" / "show em Xd"; `EventForm`: repetição de evento (N vezes a cada semana/mês) |
| S104-S107 (2026-06-15) | `MetaMensalBar`: ritmo do mês (dia X/Y + projeção de receita); `Goals`: cadência "1 show a cada X dias" + alerta ritmo; `Expenses`: mês atual expandido, meses passados colapsados; `ForecastWidget`: "X% da meta do mês" abaixo da receita projetada |
| S120-S124 polish + fixes (2026-06-15) | **paid_date bug fix**: `MonthlyTrend`, `Goals` (2 lugares), `goalMetrics.paidRevenueInMonth`, `IRSummary` (paidEvents + mensal) — todos usam `paid_date \|\| start_date` para competência fiscal. **Visual**: `ReportEventList` ícone pagamento + `getEventCacheAmount`; `EventDetailModal` WorkItem (3-cards Horas/Extras/Cachê) + ExpenseItem (EXPENSE_CAT_CONFIG 7 categorias); `Clients` chips A Receber; `WorkAnalytics` work_date fix; `FinancialSummary` grid compacto; `ExpenseAnalysis` cores semânticas + fix privacidade. **isVisible audit completa**: `Calendar.jsx` (StatCard, 5 inline, 3 callbacks drilldown), `ClientDetail.jsx`, `AI_Mentor.jsx`, `CalendarTodayStrip`, `EventActionSheet`, `ClientActionSheet`, `ClientInsightsModal`, `MeiDashboard`, `ClientDetailModal` (EventTimelineItem + modal) — todos protegidos. ESLint 0 warnings mantido em todos. |
| S108-S109 (2026-06-15) | `ProximoShow`: badge "HOJE" âmbar pulsante + countdown "Show hoje às HH:mm" + borda/linha âmbar quando show é hoje; `EventForm`: hint de cachê histórico do cliente (último + média dos 3 últimos) com botão "Usar" |
| S110 — Calendário visual (2026-06-15) | `BackstageCalendarGrid`: dots coloridos no fundo das células (1 dot por evento, cor do cliente); `ContinuousEventBar`: ícone de status (✓ pago / ⏰ aguardando / ⚠ pendente) sempre visível; badge `Xd` para eventos multi-dia; bordas arredondadas corrigidas (pill correto no início/fim); `+X mais` agora é chip clicável |
| S111-S119 Lapidação visual (2026-06-15) | **CalendarTodayStrip**: status icon + cachê em cada card. **Calendar week view**: cards ricos com fundo/borda colorida + status icon + cachê. **Calendar upcoming/list/search**: EventHeading + status + cachê. **KanbanPipeline**: EventHeading + badge Xd + accentColor. **DailyWorkModal**: atalhos 8h/10h/12h + 3-cards Horas/Extras/Cachê. **ProfileSimple**: widget "Este mês" 4-cards. **ClientDetail**: EventHeading nos próximos shows + NeonGlass financeiro. **Expenses**: 4º card "Este Mês" + totais por categoria nos chips. **EventHoursSheet** (mobile): atalhos + 3-cards igual ao DailyWorkModal. **Goals próximos shows**: status icon + cachê. **Fix**: `useDailyWork.mapPayloadToDb` setava só `date`; agora seta `work_date` (NOT NULL) + `date` simultaneamente. |
| S125-S127 isVisible auditoria completa (2026-06-16) | **S125**: SmartInsights (fmt param), DailyWorkModal, EventHoursSheet, EventForm hint. **S126**: reports/EventDetailModal (badge despesas + refactor handleShareEvent), EventTemplatesManager. **S127** (varredura final): Goals.jsx (5 locais: sublabels CircularProgress, texto motivacional, próximos shows), calendar/EventDetailModal (11 locais: cachê, ganhos, estimativa, lucro, despesas, horas), KPIDetailModal em Reports, MonthGroup em Expenses, Clients.jsx (title WhatsApp), ClientDetailModal subtitle, MonthlyTrend + ReportsChart + ExpenseAnalysis (tooltips). Exceções intencionais: share actions (IRSummary, Goals, handleShareEvent), valores públicos (MEI_LIMIT), área LOCKED (home/AReceber, home/ProximoShow). ESLint 0 warnings em todos os arquivos. |
| S128 Manual + Goals/Charts isVisible (2026-06-16) | Manual do usuário: 37→73 entradas (AGENT_LOG, Relatórios, IA Mentor, Perfil, Metas). `isVisible` em Goals.jsx (8 locais) + `ReportsChart` + `CacheEvolutionChart` + `SmartInsights`. |
| S132-S136 Acessibilidade global (2026-06-16) | **S132**: `htmlFor`/`id` em 10 pares (Goals, Onboarding, AdminFeedbacks). **S133**: ESLint 16→0 warnings (eslint-disable cirúrgicos em 9 arquivos; `react-hooks/exhaustive-deps`, `react-refresh/only-export-components`; AI_Mentor aria-labels). **S134**: Escape key em 5 overlays customizados (NotesSheet, EventHoursSheet, EventActionSheet, ClientActionSheet, FeedbackModal). **S135**: `type="button"` em 27 botões globais. **S136**: `role="button"` + `tabIndex` + `onKeyDown` em 8 `<div onClick>` (ReportEventList, ClientDetailModal×2, CompanySearchInput, reports/EventDetailModal, ExpenseAnalysis, Reports×2). ESLint 0 warnings global mantido. |
| S137 NF-e redirect (2026-06-17) | `calendar/EventDetailModal`: card "Próximos Passos" ganha 3º step "Emitir NF-e" + botão "NF-e" no card "Evento fechado". `reports/EventDetailModal`: após marcar Realizado exibe card animado com dados do evento (serviço, tomador, CNPJ, valor) + "Copiar" + "Emitir NF-e →" (abre `nfse.gov.br`); para eventos já concluídos botão "NF-e" no footer. Commit oficial `b50fd7b`. |
| S138 ARIA grid no calendário (2026-06-17) | `BackstageCalendarGrid.jsx`: `role="grid"` + `aria-label` no container; `role="row"` + `role="columnheader"` no `WeekHeader`; `role="rowgroup"` no bloco de semanas; `role="row"` em cada `WeekRow`; `role="gridcell"` + `data-date` + `aria-label` (data por extenso pt-BR) + `aria-selected` + `aria-current` em cada `DayCell`; roving tabindex com estado `focusedDate`; navegação por `ArrowLeft/Right/Up/Down/Home/End/Enter/Space`. ESLint 0 warnings. |
| S139 Auditoria S97–S138 (2026-06-17) | Auditoria formal de 25 componentes das features S97–S138: scroll/modal/ARIA/overflow. 0 problemas reais encontrados (1 falso positivo — `DrilldownModal` já tinha `flex-shrink-0`). `AUDITORIA_PAGINAS.md` atualizado. |
| S140 NF-e upload + IA Gemini (2026-06-19) | `NFeAttachment.jsx` (shared): upload PDF para Storage (`{userId}/nfe/`), dispara `analyze-nfe` edge function após upload, exibe card de resultado (✅ tudo confere / ⚠ divergências com grid de dados: número, tomador, CNPJ, valor, competência, serviço), botão re-analisar ✨, substituir/remover. `analyze-nfe` edge function: baixa PDF → Gemini 2.5-flash Vision com contexto do evento → valida cruzamento CNPJ exato > nome NFD. DB: `nfe_numero`, `nfe_arquivo_url`, `nfe_arquivo_nome`, `nfe_analise JSONB`. Integrado nos 2 EventDetailModals com `client` prop. |
| S141 EventDetailModal reports — 3 abas (2026-06-20) | `reports/EventDetailModal.jsx` + `calendar/EventDetailModal.jsx`: layout 3 abas Radix (Resumo · Trabalho · Fiscal) + `LifecycleBar` 4 etapas (Agendado→Realizado→Horas→Pago) + footer 1 CTA contextual por status + `···` DropdownMenu overflow (Edit/Duplicate/Client/WhatsApp/Delete). `InlineNotes` adicionada ao modal calendário. Indicador `●` na aba Fiscal quando NF-e registrada. Botão "Fiscal →" nos cards CRM navega para aba NF-e. |
| S143 Home 3 blocos (2026-06-20) | `Home.jsx`: 8 seções soltas agrupadas em 3 `NeonSectionFrame` — **Palco** (ProximoShow + AlertasBastidao), **Financeiro** (AReceber + QuickStats + MetaMensalBar + PipelineFinanceiro + ForecastWidget), **Agenda** (ProximosEventos). Layout limpo com `space-y-4`. |
| S144 Agenda 2 views + overflow (2026-06-20) | `Calendar.jsx`: toggle de 5 botões substituído por 2 primários (Grid LayoutGrid + Upcoming Zap) + `···` DropdownMenu com views secundárias (Semanal, Lista, Kanban). View ativa no overflow mantém highlight no botão `···`. |
| S145 Reports expandable sections (2026-06-20) | `Reports.jsx`: componente `ExpandableSection` (chevron toggle, sem Radix) adicionado inline. Aba Visão Geral: SmartInsights + ReceivablesAging + ReportsChart+FinancialSummary + MonthlyTrend sempre visíveis; **YearOverYear**, **CashflowForecast+CategoryBreakdown**, **TopClients** em 3 seções colapsáveis (fechadas por padrão). Imports: `ChevronDown`, `useRef` adicionados. |
| S146 Bottom nav 4 abas + sheet Mais (2026-06-20) | `AppLayout.jsx`: nav reduzido de 7 para 4 itens (Home + Agenda + Relatório + Mais). Botão **Mais** abre sheet Framer Motion com grid 4-col das abas secundárias (Clientes, Metas, Despesas, IA Mentor). Sheet fecha ao navegar ou clicar fora. Indicador top-bar em "Mais" quando rota secundária está ativa. |
| S147 Polish AppLayout + AppTour (2026-06-20) | `AppLayout.jsx`: botões da sheet Mais usam `match` (caminho absoluto) em vez de `to` relativo — fix navigate incorreto. `useEffect` scroll reset também fecha sheet ao usar botão voltar. `appTourSteps.js`: step `bottomNav` atualizado para descrever estrutura real (Home/Agenda/Relatório primários + Mais). |
| S148 ExpandableSection localStorage + Home spacing (2026-06-20) | `Reports.jsx`: `ExpandableSection` ganha prop `id`; estado open/closed persiste em `localStorage['backstage:report-section:{id}']` com `try/catch`. `Home.jsx`: removido `space-y-4` do container — `NeonSectionFrame` já tem `mb-8`, evitando espaçamento duplo. `useRef` desnecessário removido de Reports. |
| S149 Teste E2E Brave CDP (2026-06-21) | Revisão completa via agent-browser conectado ao Brave — todas as telas confirmadas. Zero bugs críticos. |
| S150 Fix z-index DropdownMenu (2026-06-21) | `src/components/ui/dropdown-menu.jsx`: `DropdownMenuContent` e `DropdownMenuSubContent` de `z-50` → `z-[150]` para ficar acima do `DialogContent` (`z-[101]`). `tooltip.jsx`: `TooltipContent` de `z-50` → `z-[200]`. Bug: menu "···" no `EventDetailModal` renderizava atrás do modal. |
| S151 Reports tab bar responsivo (2026-06-21) | `Reports.jsx`: tabs com labels duplos (`hidden min-[440px]:inline` full + `min-[440px]:hidden` short); `px-3` → `px-2.5`; `gap-2` → `gap-1.5`; fade gradiente à direita em mobile. Resultado: 721px → 672px, zero overflow. |
| S152 reports/EventDetailModal CTA fix (2026-06-21) | `reports/EventDetailModal.jsx`: "Confirmar Recebimento" só aparece para `completed`/`archived` (guarda `isCompletedOrArchived`). Eventos futuros agendados exibem "Editar". |
| S153 Lifecycle hint + ErrorBoundary chunk (2026-06-21) | `reports/EventDetailModal.jsx`: hint ciclo de vida diferencia eventos futuros. `ErrorBoundary.jsx`: auto-reload na primeira ocorrência de chunk stale pós-deploy (via sessionStorage). |
| S154 ProximoShow Local truncate (2026-06-21) | `ProximoShow.jsx`: `min-w-0` no flex container + div de texto do campo Local; `shrink-0` no MapPin. Endereços longos agora truncam corretamente na grid. |
| S155 Fix truncamento Reports + QuickStats float (2026-06-21) | `FinancialSummary.jsx`: `grid-cols-2 md:grid-cols-3` → `grid-cols-2` (container 300px era estreito demais). `Reports.jsx` StatCard: `p-6`+ícone inline→`p-4 relative`+ícone `absolute opacity-10`+`text-lg`; labels completos visíveis. `QuickStats.jsx`: `Math.round(v)` no format de `diarias_count` evita float durante animação. Arquivo `--url` commitado acidentalmente removido. |
| S156 Fix E2E: NotificationCenter client + Linha do Tempo nav + Calendar TDZ + MetricCard truncate (2026-06-21) | `NotificationCenter.jsx`: `client={clients?.find(c => c.id === selectedEvent.client_id)}` — corrige "Sem empresa". `ClientDetailModal.jsx`: `handleEventClick(event)` navega para `/calendar?event=ID` c/ delay 220ms. `Calendar.jsx`: `useEffect` para `?event=ID` movido APÓS `const eventMap = useMemo(...)` — fix TDZ crash. `ClientDetailModal.jsx` MetricCard: ícone `absolute opacity-10`, `text-xl font-mono` — corrige truncamento "R$ 1.000,...". |
| S157 Fix GlobalSearch event ID + Expenses truncate + Calendar tela preta (2026-06-21) | `GlobalSearch.jsx`: navega para `/calendar?event=ID` em vez de `/calendar`; `onClose()` antes + 220ms delay. `Expenses.jsx` StatCard: `text-xl font-bold font-mono` (era `text-2xl font-extrabold`). `Calendar.jsx`: `replaceState` interceptado pelo RR6 → `AnimatePresence` trava em exit. Tentativas 1 (replaceState) + 2 (replaceState + 600ms + useRef) falharam. Fix definitivo S158: remover toda limpeza de URL. |
| S158 Fix Calendar tela preta definitivo + AI Mentor client name (2026-06-21) | **Root cause**: `window.history.replaceState` é patchado pelo React Router v6 → dispara nova location → `AnimatePresence mode="wait"` vê nova renderização durante animação de entrada → `motion.div` fica em `opacity:0; translateY(-4px)` (exit state). Fix: remover todo `replaceState` e `navigate` para URL cleanup. `processedEventIdRef`/`processedActionRef` já previnem re-processamento. **AI Mentor**: `e.clients?.name` sempre null pois `useEvents` usa `select('*')` sem join → adicionado `clientMap` via `useClients()`. Nota: `useBackstageData.useEvents` tem JOIN correto; só `useEvents.js` (CRUD) não tem. |
| S167 Auditoria E2E interativa + fix Editar (2026-06-22) | Audit CDP via agent-browser: 7 páginas confirmadas (/clients /calendar /reports /expenses /goals /ai-mentor /profile). **Bug corrigido**: `ClientDetailModal` botão Editar não fechava o modal antes de abrir o form → `ClientForm` ficava oculto atrás. Fix: `onClose()` antes de `onEdit(client)`. Commit `a466c1a`. |

---

## Camadas de UI (z-index)

Ordem oficial após fix de scroll (2026-06-05):

| Camada | z-index | Exemplos |
|--------|---------|----------|
| Conteúdo / nav inferior | `z-30` | `AppLayout` bottom nav |
| Notificações / FAB | `z-40` | `NotificationCenter`, `FloatingActions` |
| Sheets mobile (backdrop) | `z-[90]` | `EventActionSheet`, `EventHoursSheet` |
| Sheets mobile (painel) | `z-[95]` | idem |
| Dialog / Sheet Radix | `z-[100]` overlay, `z-[101]` conteúdo | `DialogContent`, `Sheet` |
| Dropdowns / Menus dentro de Dialog | `z-[150]` | `DropdownMenuContent`, `DropdownMenuSubContent` |
| Tooltips | `z-[200]` | `TooltipContent` |
| Toasts | `z-[100]`+ | Sonner |

**Regra:** nunca usar `z-50` em cards/sheets customizados — conflitava com dialogs e com a nav. Componentes Radix portalizados (DropdownMenu, Tooltip) precisam de `z-[150]`+ quando usados dentro de `Dialog` (`z-[101]`).

---

## Scroll (padrão)

- Container principal da app: `<main data-app-scroll>` em `AppLayout.jsx`.
- Com modal Radix aberto **ou** `body[data-scroll-lock]`: o `main` trava via CSS (`index.css`).
- Overlays customizados (sheets Framer): usar hook `useAppScrollLock(isOpen)` de `src/lib/useAppScrollLock.js`.
- Corpo rolável dentro de modal flex: classe utilitária `.bp-modal-scroll` ou `ScrollArea` com prop `fill`.
- Modais Radix: `DialogContent` base usa `overflow-hidden`; scroll fica no filho (`bp-modal-scroll` / `ScrollArea fill`).

---

## Checklist OAuth Google Calendar (manual — produção)

Use este roteiro para fechar o item **#8** em `IDEIAS_PENDENTES.md`.

### Pré-requisitos (infra — uma vez)

| # | Onde | Ação |
|---|------|------|
| A | [Supabase → Edge Functions → Secrets](https://supabase.com/dashboard/project/cwtallnetgodoacuoaow/settings/functions) | `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` preenchidos |
| B | [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) | OAuth 2.0 Client ID do tipo **Web** |
| C | Mesmo client no GCP | **Authorized redirect URI** exatamente: `https://cwtallnetgodoacuoaow.supabase.co/functions/v1/google-calendar-callback` |
| D | GCP → OAuth consent screen | Sair de **Testing** → **In production** **ou** adicionar seu e-mail em **Test users** (#24) |
| E | Segurança (#23) | Rotacionar `GOOGLE_CLIENT_SECRET` no GCP → atualizar secret no Supabase → nunca commitar `client_secret_*.json` |

### Publicar a versão 2 — ✅ feito em 2026-10-21 (ordem usada, para referência)

1. Migração `043_google_agenda_opcoes.sql` (colunas de opções, `events.google_origin`, gatilho `events.updated_at`, corrige 5 eventos `'confirmado'`)
2. Edge `google-calendar` (com `_shared/googleSyncRules.ts`) com **verify_jwt = false** (está no `config.toml`; o cron usa a chave `sb_secret_…`, que não é JWT — cada ação de usuário confere o login dentro da função) + `google-calendar-callback`
3. Front (merge na `main` → Vercel)
4. Migração `044_google_agenda_cron.sql` (sincroniza a cada 15 min; timeout 120 s no `net.http_post`)
5. Conferir: `cron.job_run_details` + log da função com `sync-all` 200

### Fluxo E2E no app (15 min)

1. Abrir https://backstage-pro-beta.vercel.app/profile (logado)
2. Rolar até **Google Agenda · Sincronização com Google Calendar** → **Conectar ao Google**
3. Autorizar no Google (aceitar escopos de calendário + e-mail)
4. Esperar redirect para `/profile?google_connected=1` + toast
5. Confirmar **Conectado** + e-mail Google + "Última sincronização: há …"
6. Opções: **Enviar meus trabalhos** (escolher a agenda que recebe), **Trazer shows do Google** (escolher a agenda dos shows; palavras opcionais tipo `show, montagem`), **Avisar se o dia estiver ocupado**
7. **Sincronizar agora** — toast com contadores (enviados / trazidos / atualizados pelo Google / ficam para a próxima)
8. No **Novo trabalho**, tocar num dia com compromisso no Google → aparece **Dia ocupado no Google**
9. Mudar a data de um trabalho no Google → na próxima rodada a data muda no app
10. Se houver duplicatas: **Limpar duplicatas da agenda** → confirmar → toast `N duplicata(s) removida(s)`
11. **Desconectar** → reconectar a mesma conta mantém a agenda escolhida

### Erros comuns → mensagem no app

| Sintoma | Causa provável | Fix |
|---------|----------------|-----|
| `invalid_client` | Secrets ausentes no Supabase | Passo A |
| `redirect_uri_mismatch` | URI errada no GCP | Passo C |
| `unauthorized_client` / `access_denied` | App em Testing sem testador | Passo D |
| `missing_refresh_token` | Reconexão sem revogar antes | Desconectar, aguardar 10s, conectar de novo |
| 400 "não conectado" em list-calendars | Token expirado / desconectado | Reconectar no Perfil |

### Automação existente

- Smoke mock: `e2e/smoke/google-calendar-sync.spec.js` (UI conectada + dedupe + opções)
- Regression mock: `e2e/regression/google-busy-warning.spec.js` (aviso de dia ocupado no Novo trabalho)
- Unit: `src/lib/googleEventDedupe.test.js` (4 casos) + `src/lib/googleSyncRules.test.js` (18 casos — o que entra, o que sai, o que mudou)

### Para abrir a todos os usuários (Google Cloud — Guih)

Os escopos de agenda são "sensíveis": com o app em **Testing**, só entra quem está na lista de testadores e a conexão cai a cada 7 dias (o Perfil agora mostra "A conexão com o Google expirou"). Para publicar: domínio próprio (Hostinger) apontado para a Vercel e verificado no Search Console → tela de consentimento com página inicial, privacidade e termos nesse domínio → **Publish app** → pedir verificação dos escopos (vídeo mostrando o uso). Antes disso, rotacionar o `GOOGLE_CLIENT_SECRET` (#23).

---

## Changelog

### 2026-10-23 — Nova logo: Credencial horizontal (Claude Code — branch `feat/logo-motion`, **não publicado**)

- **Escolha**: depois de 8 rodadas de opções (fita, passe, feixe, case… corujas, bichos, objetos de bastidor), o Guih escolheu a **Credencial horizontal**: crachá claro na fita rosa, faixa amarela ALL ACCESS, **BACKSTAGE** preto, **PRO** rosa e código de barras.
- **Kit de ícones v2** (nomes novos para furar o cache; os antigos ficam no `public/` até todo mundo atualizar): `icon-v2.svg` (aba e logo dentro do app, só com o B, sem texto, que não depende de fonte), `icon-v2-192.png`, `icon-v2-512.png`, `icon-v2-maskable-512.png` (dentro da zona segura de 80% do Android), `apple-touch-icon-v2.png` (180, sem transparência), `badge-v2-96.png` (monocromático, para o aviso push). Gerados por script (Chromium com Anton e Space Mono).
- **Trocado**: `index.html` (aba e ícone do iPhone), `manifest.json` (ícones e atalhos), `push-sw.js` (ícone e `badge`), lista `includeAssets` do `vite.config.js` (só a lista), `BackstageLogo.jsx`.
- **Abertura animada**: a tela instantânea do `index.html` ganhou a credencial balançando na fita (SVG embutido, sem fonte; respeita "reduzir movimento"), no lugar de só o texto.
- **Aviso do iPhone** (`IconUpdateNotice`): uma vez, só no iPhone/iPad com o app instalado (`navigator.standalone`), diz que o ícone mudou e que é preciso apagar e adicionar de novo, com "Como fazer" (3 passos) e "Já fiz" (grava em `localStorage`). Android troca o ícone sozinho (~1 dia). Teste `e2e/regression/icon-update-notice.spec.js` (instalado vê e dispensa; Safari comum não vê).
- **Correção de passagem**: `SlowLoadingHint` e o aviso novo ficavam **atrás da barra fixa do topo** (renderizados antes do `<main>`); agora ficam dentro do `<main>`, logo abaixo da barra.
- **Não feito**: logo na tela de consentimento do Google (120×120, exige o domínio), PDFs e página pública de fechamento ainda usam a marca antiga, `theme_color` mantido em `#050609`, teste no Android instalando a versão antiga e publicando por cima, teste no iPhone real.

### 2026-10-22 — Foto do perfil, atualização do PWA, tela travada e auditoria geral (Claude Code — branch `feat/foto-perfil-pwa`, **não publicado**)

- **Foto do perfil** (`ProfilePhotoPicker`, `imageResize.js`): janela com **Tirar uma foto agora** (câmera), **Escolher da galeria** e **Escolher um arquivo**, mais **Remover foto**. A foto é cortada em quadrado (512 px) e reduzida antes do envio: foto de celular (4–12 MB) era **recusada** pelo limite de 5 MB; agora sai com ~100 KB. Teste `e2e/regression/profile-photo.spec.js`.
- **PWA instalado não atualiza**: no navegador a versão nova entra sozinha em 6–10 s (testado publicando uma versão por cima, app aberto) e os cabeçalhos do servidor estão certos; a causa no iPhone não pôde ser reproduzida aqui. Reforços que não dependem do iOS: checagem própria da versão publicada (`appBuild.js`, compara o nome do `assets/index-*.js` em `/index.html?bp=…`) ao voltar ao app, reconectar e a cada 45 s; botão **Verificar atualização** + número da versão no Perfil; `hardRefresh` limpa o cache do app; o recarregamento espera o usuário terminar de digitar/fechar a janela (até 5–10 min). **Quem já está preso numa versão antiga precisa abrir o app uma vez ou reinstalar o ícone.**
- **Tela travada**: consulta de dados (`/rest/v1/`) ganha limite de 20 s (`supabase.js`); `SlowLoadingHint` no layout avisa após 12 s só com esqueleto e oferece "Tentar de novo"; Agenda/Clientes/Despesas/Dinheiro mostram o erro com botão mesmo quando o app se acha sem internet e não há dados guardados (antes ficava esqueleto em ciclo). Teste `slow-loading-hint.spec.js`.
- **Auditoria** (52 medições = 13 telas × 4 aparelhos, axe, servidor lento, offline, versão nova, verificadores do Supabase): 0 telas presas, 0 estouros de largura, 1 erro de console (círculo do mapa sem raio — corrigido), setas de mês do Dinheiro 22→36 px. Pendências na apresentação "Backstage Pro Análise Geral" e abaixo.
- **Pendências abertas**: segurança do banco (senha vazada desligada, 1 opção de 2 etapas, 8 funções `SECURITY DEFINER` chamáveis por anon/authenticated); desempenho (18 políticas sem `(select auth.uid())`, 3 FKs sem índice); acessibilidade (contraste em 5 telas, `aria-prohibited-attr` no mapa, alvos < 40 px em 8 de 13 telas).
- **Atenção**: um arquivo meu sobrescreveu `src/lib/appVersion.js` (exporta `APP_VERSION`); restaurado do git antes de qualquer commit; o código novo ficou em `appBuild.js`.

### 2026-10-22 — Ideias novas 106–113 (Claude Code — branch `feat/ideias-novas`, **não publicado**)

Uma por vez, cada uma com testes de unidade e de tela (com a trava do banco):
- **#107 Só entrada e saída** — Perfil "Como você registra o trabalho" (ficha completa / só entrada e saída) e escolha por trabalho no Novo trabalho › Mais detalhes. No modo ponto, Registrar horas (janela e gaveta do celular) mostra só ENTRADA e SAÍDA com "Agora"; horas e cachê pela regra única; "Ver ficha completa". Registrar horas passou a usar a fila offline.
- **#112 Quilometragem** — categoria de despesa "Quilometragem (km)": km × valor por km, ida e volta, valor calculado sozinho e lembrado (`user_settings.km_rate`); km em `expenses.distance_km`.
- **#109 Várias funções** — Perfil "Minhas funções e cachês" (`profiles.role_rates`); Novo trabalho "Função neste trabalho" troca o cachê e grava `events.category/category_label`; Dinheiro › Análise "Por função". Contrato PDF mostra o nome da função.
- **#106 Colar do WhatsApp** — leitor local (sem internet) de datas, horários, cachê, local, cliente e função; resumo do que preencheu, Desfazer, mensagem inteira em Observações.
- **#108 Foto da credencial + Ler com IA** — Edge `analyze-job` (Gemini; foto em base64, não guardada; tudo conferido de novo no app).
- **#113 Equipamento** — na janela do trabalho, Ida (na mala) e Volta (voltou), Usar/Salvar meu kit, aviso "Falta voltar" depois do show; "Meu kit de equipamento" no Perfil.
- **#111 Orçamento em PDF** — janela do trabalho (aba Dinheiro e menu ···): compartilhar no celular, ou baixar + WhatsApp do cliente; validade de 7 dias, condições pelo modelo de pagamento, PIX. Recibo PDF passou a usar o nome do Perfil (antes saía "Técnico de Eventos").

Migração `046_ideias_novas` (colunas de 107/109/112/113, todas com padrão — o app de antes segue igual). Testes: unit 337/337; E2E novos: ponto-mode (4), quilometragem (1), funcoes-cache (3), colar-whatsapp (3), credencial-ia (3), equipamento (3), orcamento-pdf (1).

### 2026-10-22 — CHEGUEI corrigido + varredura de todos os botões e destinos (Claude Code — **publicado** `03ee64a`, bundle `index-BAYKE3jv.js`; migração 045, `delete-account` v1, `send-push-digest` v6)

**CHEGUEI dava erro** no iPhone ("Não foi possível registrar a entrada"): o botão gravava direto no banco só a coluna `date`, e `work_date` é obrigatória — o log do Supabase mostra 5 recusas (21/10 e 22/10 às 09:28–09:34). Agora CHEGUEI/BATER SAÍDA vão pelo mesmo caminho do "Registrar horas" (`useDailyWork` offline): grava as duas datas, não duplica o dia e **funciona sem sinal** (guarda na fila e sobe quando volta). Migração `045_daily_work_datas_juntas` (**aplicada** 22/10) preenche uma data com a outra no banco — conserta até versões antigas do app abertas no celular.

**Varredura** (pedido: "conferir todos os meios de interligação e botões"): (1) leitura automática do código inteiro (290 arquivos) contra o banco real — colunas, obrigatórias, funções, pastas, 438 destinos de botão/link contra as rotas, parâmetros de URL, ações não ligadas e props com nome errado; (2) **trava do banco nos testes**: `e2e/helpers/test.js` confere todo POST/PATCH contra as colunas reais (`e2e/helpers/dbSchema.js`) — o banco falso aceitava qualquer coisa, por isso o CHEGUEI passava nos testes; (3) **robô que aperta todos os botões** (`e2e/audit/buttons-crawl.spec.js`, banco falso completo `e2e/helpers/fakeDb.js`) em 11 telas, 2 níveis (janelas, abas, menus): **392 cliques**, nenhuma tela quebrou, nenhum erro de JavaScript, nenhum destino inexistente, nenhuma gravação recusada.

Corrigido: "Clientes em aberto › Ver todos" e o quadro A RECEBER abriam Dinheiro na aba Mês → abrem em **A receber** (`/reports?aba=`); MEI → aba Fiscal; "Horas no mês" → Análise (conferência de horas); avisos do celular "Hoje em cena" → Início (onde está o CHEGUEI), "Show amanhã" → o próprio trabalho, "Pagamento pendente" → A receber (`send-push-digest`, precisa publicar a função); **"Novo job" no cliente abria sem o cliente** (prop `prefillClient` que o formulário não lê → `prefillData`); despesa criada de dentro do trabalho mostrava o campo "Trabalho" vazio; "◎ Atualizar local" sem permissão de GPS deixava erro solto; botão vermelho na exclusão de modelo (`confirmVariant` → `destructive`); cor do título dos alertas (`Ellipsis` sem `style`); botões sem nome para o leitor de tela (setas do mês no Dinheiro, anotações do cliente, "···" do trabalho, NF, fechar conquista); "+" do checklist desativado com o campo vazio; aviso `end` no menu de baixo.

### 2026-10-22 — Revisão das telas que faltavam (Claude Code — **publicado** junto, `03ee64a`)

Despesas, Metas, Dinheiro, Mentor, Perfil, Login/Cadastro, Onboarding, menu Mais, telas vazias e de erro — com fotos no celular em 3 situações (com dados, vazia, sem conexão). Tabela item a item em `docs/PLANO_REVISAO_GERAL.md` § Revisão 22/10. Principais: **Despesas não tinha como excluir** nem marcar reembolso recebido; **nível/conquistas de Metas só contavam status "concluído"** (1 de 41 no banco) → regra única `isDoneEvent` (também no crew pass e no Mapa, que contavam shows futuros); **"A receber" do Dinheiro somava shows futuros** e não batia com Início/Mentor; "quem mais te pagou" somava o que não foi pago; DAS do MEI de 2025 → 2026 (R$ 86,05); **"Excluir minha conta"** (prometido na privacidade) com função `delete-account` **ainda não publicada**; erros com o mesmo texto e aviso em vez de zeros; horas "8,5h"; acento em títulos Anton cortados; ~450 linhas de código morto removidas (Despesas, Clientes, Dinheiro, Agenda — lint limpo nessas telas); manual do app com os níveis e conquistas atuais. Testes: unit 281/281, E2E 107 passando (1 pulado), 6 testes antigos ajustados aos textos novos.

### 2026-10-22 — Perfil: barra SALVAR presa em cima do menu (Claude Code — **publicado** `b849156`, testes do Perfil contra o site publicado ok)

Bug visto pelo Guih: o SALVAR ALTERAÇÕES do Perfil era `sticky` e andava pela tela ao rolar (ficava por cima dos cartões e depois saía com a página). Agora é uma barra presa logo acima do menu de baixo (`createPortal` no `body`, `fixed`), que só aparece quando há alteração não salva (compara o formulário com o perfil/PIX gravados, como texto: "12" = 12) e mostra "SALVO" por 2,5 s. Teste novo `e2e/regression/profile-save-bar.spec.js` (some sem alteração, posição igual no topo e no fim da página, some ao voltar o valor).

### 2026-10-21 — Google Agenda v2: sincroniza sozinho, opções no Perfil, aviso de dia ocupado (Claude Code — **publicado** `b3ee776`)

**Deploy (pedido do Guih):** 043 aplicada (5 eventos `'confirmado'` → `'confirmed'` + `google_origin='google'`; nenhum trabalho ficou pendente de envio) → edge `google-calendar` v30 + callback v20 → `main` `89132f5..b3ee776` (Vercel `index-DhSlvymM.js`) → 044 (cron `*/15`). Rodada manual igual à do cron: HTTP 200, 1 usuário ok, 0 falhas, nenhum trabalho alterado. Testes do Google (4) contra o site publicado: ok. Roteiro para desfazer guardado fora do repo.

Pedido do Guih: usuários usarem o Google Agenda sincronizado com o app; do Google só entram **eventos e shows**, nunca compromisso pessoal.

- **Opções no Perfil** (`GoogleCalendarSync.jsx`, visual All Access): enviar trabalhos (e para qual agenda — só as que o app pode escrever), trazer shows (de qual agenda + palavras opcionais), avisar dia ocupado; "última sincronização há X min"; erro da última rodada em rosa; atalho da Agenda abre o Perfil já na parte do Google (`?tab=google`).
- **Edge `google-calendar`**: rodada única `syncUser` (traz da agenda de shows, aplica mudanças de data/horário/local feitas no Google, manda só o que mudou — até 50 por rodada); ações novas `sync-all` (cron, confere `CRON_SECRET` ou chave de serviço) e `busy-days`; `push-event` sem conexão responde `skipped` (antes 400 a cada evento salvo); trabalho que veio do Google (`google_origin = 'google'`) só tem data/horário/local ajustados lá — título e descrição de quem criou ficam; excluir no app não apaga evento de outra pessoa no Google; cancelado vai para o Google como "CANCELADO · …" sem ocupar horário.
- **Bugs corrigidos**: importação gravava status `'confirmado'` (app usa `'confirmed'`) e não preenchia `event_date` (obrigatório — inserts falhavam calados); fim de evento de dia inteiro entrava com um dia a mais; `sync-now` reenviava **todos** os eventos toda vez; token expirado desconectava sem explicar e apagava a agenda escolhida; `.catch` em query do Supabase (não existe) no auto-desconectar.
- **Banco** (migração 043, não aplicada): opções em `user_settings`, `events.google_origin`, gatilho que atualiza `events.updated_at` em edição de verdade (ignora colunas `google_*`) — antes `updated_at` nunca mudava. Testado em tabela temporária, sem gravar.
- **Cron** (migração 044, não aplicada): a cada 15 min.
- **Novo trabalho**: `GoogleBusyWarning` mostra "Dia ocupado no Google" com os compromissos dos dias escolhidos.
- `ui/switch.jsx` no visual All Access (não era usado em lugar nenhum).
- Testes: unit 279/279; E2E completo 103 passando, 1 pulado (inclui os 4 do Google, com mocks); build ok.

### 2026-10-21 — Auditoria visual e homogeneização do app inteiro (Claude Code)

Depois do teste no iPhone o Guih ainda viu partes no modelo antigo. Auditoria por código (142 arquivos alcançáveis, 80 com marcas antigas) + 31 fotos. Raiz corrigida: `NeonGlass`/`NeonPageShell` viraram cartão/fundo do padrão, `.bp-chip-active`/`.bp-view-active` amarelo cheio, paleta antiga trocada em ~70 arquivos (selo claro → texto preto), `font-mono` → Space Mono, hex azul‑marinho → neutros. Janela do evento (títulos, documentos, PIX), lista da Agenda (selos de status), Metas (conquistas, MEI), cliente, Ajuda, aviso sem internet e toasts ajustados. Detalhes em `docs/AUDITORIA_VISUAL_ALLACCESS.md`.

### 2026-10-21 — Visual All Access, entregas 11 a 15: app inteiro com a cara nova (Claude Code)

- **11 Novo trabalho** (`EventForm.jsx`): pílulas dos clientes recentes + busca; faixa de 14 dias para tocar (1º toque = primeiro dia, 2º = último; ponto rosa = já tem show); cachê e alimentação em blocos; "Mais detalhes" recolhe pagamento, vencimento, NF, observações, repetir e modelo; rodapé "VAI RENDER" + SALVAR. Gravação igual à de antes. Ficaram de fora (funções novas): colar mensagem do WhatsApp e "entrada e saída".
- **12 Perfil** (`ProfileSimple.jsx`): crew pass amarelo (foto, nome, função, cidade, shows/cidades/anos), função e cachê padrão, meus dados, recebimento e fechamento (PIX em pílulas), meta do mês, ajuda/suporte, conta. Um SALVAR só, como antes. Avisos no celular e Google Agenda no visual novo.
- **13 Metas** (`Goals.jsx`): níveis viraram os 5 tiers do protótipo (Staff, Backstage, All Access, Headliner, Lenda) nas mesmas faixas de shows (0/5/20/50/100); credencial amarela com % e próximo tier; abas em pílula.
- **14 Mentor** (`AI_Mentor.jsx`): "M / MENTOR — seu parceiro de estrada", saudação + data, perguntas prontas no cartão dos Avisos, campo em pílula. Envio para a IA igual.
- **15 Mapa + apoio**: tela nova **`/mapa` "Minha turnê"** (shows, cidades, estados, mapa e "ganhou aqui" por cidade); "Mais › Mapa" aponta para ela e `/reports#mapa` redireciona; o mapa saiu do rodapé do Dinheiro. Privacidade, termos, ajuda, tela de erro, admin e avisos (toasts) sem as cores antigas; fundo do app `#0a0a0a`.
- Testes ajustados aos nomes novos (Novo trabalho, Perfil, mapa em `/mapa`); teste do "+ Novo trabalho" ganhou dados falsos (oscilava sem eles desde antes).

**Sem deploy.**

### 2026-10-21 — Visual All Access, entrega 10: janelas e formulários (Claude Code)

Padrão do protótipo ("Modal · Novo trabalho") aplicado **nos componentes base**, então todas as janelas do app seguem juntas:
- `ui/dialog.jsx`, `ui/alert-dialog.jsx`, `ui/sheet.jsx`: fundo `#121212`, borda amarela no topo, cantos de 24px, título em Anton caixa alta, botão fechar redondo `#222`; cabeçalho alinhado à esquerda.
- `ui/label.jsx`: etiqueta Space Mono 10px, caixa alta, cinza.
- `ui/input.jsx`, `ui/textarea.jsx`, `ui/select.jsx`: 48px, fundo preto, borda `#333`, cantos 12px, 16px de letra (sem zoom no iPhone), foco amarelo.
- `ui/button.jsx`: pílulas; padrão amarelo com texto preto; apagar em rosa; contorno `#444`.
- Formulários (despesa, horas, recebimento, cliente, evento, calculadora, disponibilidade, modelos, recibo, NF-e, notas, feedback…): saíram as cores antigas que brigavam com o padrão (scripts de troca de paleta + limpeza de classes nos campos). Botões verdes de "Confirmar pagamento" viraram o amarelo padrão; formas de recebimento em pílulas.
- Busca global: barra preta com borda amarela e campo em pílula.
- Janela de horas: título "Registrar horas" / "Editar horas" (o antigo não cabia ao lado do fechar).

**Sem deploy.**

### 2026-10-21 — Visual All Access, entrega 9: acertos nas telas já feitas (Claude Code)

**Pedido do usuário:** terminar o visual novo em todo o app antes de seguir. Plano em entregas 9–15 (ver `docs/AGENT_LOG.md` de 21/10). Referência: protótipo `Backstage Pro — Direção Visual.html` (19 telas).

**Bugs que estavam no ar (corrigidos):**
- Agenda → tocar no dia → **Horas** derrubava a tela ("Oops! Algo deu errado"). `Calendar.jsx` agora usa `handleQuickLogForEvent`. Teste: `e2e/regression/calendar-day-actions.spec.js`.
- Dinheiro → A receber → **Cobrar** não abria o WhatsApp (passava o evento no lugar do telefone). `AllAccessDinheiro.jsx` monta a mensagem com `buildChargeMessage`.

**Visual:**
- Fonte: Agenda, Dinheiro, Clientes, Despesas e ficha do cliente usavam `font-display` (não existe no Tailwind) → `font-poster` (Anton); `font-mono` → `font-tag` (Space Mono).
- Agenda: busca em pílula + botão "⋯" (vistas e ferramentas); filtros em pílulas que rolam para o lado; lembretes no estilo dos Avisos; números do mês no estilo dos números do topo; faixa "Hoje" some na grade (o cartão do dia já mostra hoje).
- Dinheiro: voltaram, no visual novo, funções que sumiram em 20/10 — **NF pendentes** e **Imposto de Renda** (aba Fiscal), **conferência de horas** (aba Análise), **previsão 30/60/90 dias** (aba A receber). Contagem de NF usa a regra oficial `isNfPendingEvent`. Mapa virou "Minha turnê" no visual novo.
- Esqueleto de carregamento (`ui/skeleton.jsx`) agora cinza All Access em todo o app.
- Ficha do cliente: avatar 72px (a classe `w-18` não existia).

**Fora do escopo, anotado:** números da Agenda não usam `financeMetrics` ("DIÁRIAS" mostra nº de eventos; "Receita estimada" ≠ "A receber"); MEI do ano (Fiscal) e Receita bruta do IR são calculados em lugares diferentes.

**Sem deploy.**

### 2026-10-09 — P0 números: modelo de competência + valor recebido (Claude Code)

**Pedido do usuário:** "números que não batem" entre Home, Metas e Relatórios. Implementado o modelo aprovado em 2026-08-28.

**O que mudou**
- **Novo `src/lib/financeMetrics.js`** — fonte única de: valor recebido de um evento (`paid_amount` → `actual_revenue` → valor de "A receber"), recebido por período (`paid_date`), previsto por período (data do show), despesas (`expense_date`), horas (dia trabalhado) e os payloads de marcar/desmarcar pago.
- **Leitura migrada:** `useHomeDashboard`, `useStats`, `useMeiStats`, `goalMetrics`, `Goals.jsx`, `Reports.jsx`, `MonthlyTrend`, `YearOverYear`, `IRSummary`, `ExportManager`/`exportReport`, `ClientDetailedTable`, `ClientDetailModal`, `ClientDetail`, `ClientInsightsModal`.
- **Gravação:** `usePaymentToggle`, `Calendar.handleMarkPaid` e os dois `markClientPaid` gravam `paid_date` (data local, não UTC) + `paid_amount`; desmarcar limpa os dois.
- **Home:** a query do cockpit passou a trazer também shows de outros meses pagos no mês atual.
- **Metas:** histórico, streak e painel anual usam o novo `usePaidEvents` (antes só eventos com `status='completed'` — 1 de 21 pagos na base real).
- **Relatórios:** "Faturamento" inclui pagos antigos sem `paid_date`; a projeção do próximo período agora é a soma da própria lista; modal do KPI mostra o valor recebido (antes vinha vazio sem `paid_amount`).
- **`PaymentConfirmModal`:** prefill pelo valor canônico; não envia `payment_method` quando a coluna não existe (era o que derrubava o update em produção).
- **Migration nova:** `supabase/migrations/034_events_payment_method.sql` (não aplicada).

**Verificação:** unit 112/112 · build ✅ · lint: só os 2 erros antigos (e2e/marketing) · E2E 66/66 (2 specs novos) · conferência read-only na base: Metas ia de R$ 0 / R$ 0 / R$ 0 para R$ 0 / R$ 2.000 / R$ 14.225,50 (jun/jul/ago).

**Sem deploy.** Nada disso está em produção ainda.

### 2026-10-09 — INFRA: projeto fora do OneDrive (Claude Code)

**Motivo:** com o OneDrive fechado, 1060 de 1201 arquivos do projeto (e 90 mil de `node_modules`) ficavam só na nuvem e nada abria; o OneDrive também já tinha causado lock no `git worktree prune` e bug no Supabase CLI.

**O que mudou:** clone novo em `C:\dev\backstage-pro` (mesmo commit `da2f390`), com `.env.local`, `.env.vercel*`, `.vercel/`, `supabase/.temp/`, `.agents/` e `.codex/` copiados da pasta antiga. `npm ci` limpo. Caminho do hook em `.codex/hooks.json` e os `cd` de `SETUP.md` / `GUIA_COMPLETO.md` apontam para a pasta nova.

**Verificação:** build ✅ · unit 81/81 ✅ · dev server responde ✅ · lint com 2 erros `no-unused-vars` que já existiam (`e2e/helpers/fakeGoogleCalendar.js`, `marketing/instagram-stories/marketingMocks.js`).

**Atenção:** abrir **a pasta nova** no Cursor/Codex — a antiga ainda existe e tem o hook de backup automático apontando para o mesmo `origin`. O worktree órfão `agent-abd00af5c51a7f7b6` ficou só na pasta antiga (o gitlink continua no índice).

### 2026-06-14 (sessões S69–S74) — Claude Code: insights, templates, PDFs, CRM e agenda

**S69 — SmartInsights:** 7 regras automáticas no topo de Relatórios → Visão Geral (inadimplência, agenda vazia/cheia, crescimento, concentração de cliente, melhor mês chegando, meta, taxa horária)

**S70 — EventTemplatesManager:** seção collapsível no Perfil para listar e deletar templates salvos (ciclo completo: criar → usar → gerenciar)

**S71 — ReceiptPDFDocument:** recibo de pagamento em PDF gerado direto do EventDetailModal para eventos pagos (botão `BadgeCheck` verde)

**S72 — InactiveClientsPanel + buildReactivationMessage:** painel âmbar na página de Clientes detecta clientes sem shows há ≥90 dias; botão "Reativar" abre WhatsApp com mensagem calorosa

**S73 — WeekdayBreakdown:** gráfico Dom–Sáb na aba Atividade de Relatórios; KPIs +Receita/+Shows/Mais Livre; grid 2 col com SeasonalityChart

**S74 — AvailabilityShareModal + buildAvailabilityMessage:** botão Share2 (verde) na Agenda abre modal de disponibilidade com navegação por mês, prévia e compartilhamento via WhatsApp/clipboard

**Deploy anterior:** `dpl_4Wbzu5zDdCQWB2Y9gqe6iMNmhVuJ` (S67–S69)

---

### 2026-06-13 (sessão S43) — Cursor: notificações, dedupe GCal, busca global, QA

**NotificationCenter:** editar/excluir evento real (`EventForm` + `ConfirmDialog` + `deleteEvent`) — commit `f67ab29`

**Google Calendar dedupe:**
- `src/lib/googleEventDedupe.js` + 4 unit tests
- `supabase/functions/_shared/googleEventDedupe.ts` — edge refatorada e redeployada
- Smoke E2E `google-calendar-sync.spec.js` (2 testes)

**Outros na sessão:** `GlobalSearch` TopBar, compartilhar resumo Goals/Reports, `.gitignore` playwright-report

**QA:** 26 unit + **28 smoke E2E** ✅ · Deploy Vercel `dpl_9Xvk7A1ANiF2RqNWcBWeGQAQ3NqY`

**Pendente:** checklist OAuth manual acima (itens A–E)

---

### 2026-06-13 (sessão S42) — Avaliação de cliente + heatmap atividade + observações

**Migration 031 — `client_rating` + `client_rating_notes` em `events`:**
- Colunas opcionais (smallint 1-5 com CHECK + text)

**EventDetailModal:**
- Widget de 5 estrelas para eventos com `status === 'completed'`; salva via `updateEvent` ao clicar; textarea de observação aparece após dar nota; label textual (Ruim / Regular / Bom / Ótimo / Excelente)
- Seção "Observações" exibe `observacoes_md` quando preenchida

**ClientDetail:**
- `avgRating` useMemo — média das avaliações de todos os eventos do cliente
- Card âmbar com estrelas preenchidas + valor numérico + contagem de avaliações

**Reports — ActivityHeatmap:**
- Nova aba "Atividade" com grade 52 semanas × 7 dias (estilo GitHub)
- Intensidade de cor por volume de shows; tooltip hover; legenda de escala
- `ActivityHeatmap.jsx` em `src/components/reports/`

**Build:** Vite ✅

---

### 2026-06-13 (sessão S41) — Próximos Shows + melhorias week view

**Calendar.jsx — Vista "Próximos Shows" (⚡):**
- 4º botão no toggle (Zap icon, cor âmbar); `viewMode === 'upcoming'`
- `upcomingGroups` useMemo — filtra `activeEvents` a partir de hoje, sem filtro de status, ordena cronologicamente; agrupa em: Hoje / Amanhã / Esta semana / Próxima semana / Próximos 30 dias / Mais adiante
- Cards com: countdown relativo ("Hoje", "Amanhã", "em Xd"), data dd/MM, horário, cliente, valor colorido por estado (âmbar=pendente, vermelho=vencido, verde=pago)
- Imports adicionados: `differenceInCalendarDays, isBefore` (date-fns); `Zap` (lucide)

**Calendar.jsx — Melhorias week view:**
- Cabeçalho de cada dia virou `<button>` clicável → `handleDayClick(day)` abre QuickActions para criar evento naquela data; hint "+" aparece no hover
- Build Vite ✅

---

### 2026-06-12 (sessão S40) — Vista Semanal na Agenda

**Calendar.jsx — Vista Semanal (Week View) + polish:**
- Novo modo `viewMode === 'week'` — terceiro botão no toggle (ícone `CalendarDays` entre Grade e Lista)
- `weekStart` state (dom a sáb, `weekStartsOn: 0`); `weekDays` + `weekEventsByDay` useMemos
- Navegação: botões ← → + botão "Hoje" recentra na semana atual; label "D de Mmm – D de Mmm AAAA"
- 7 colunas em `overflow-x-auto` + `min-w-[560px]` — scroll horizontal em mobile, legível em desktop
- Cabeçalho com dia curto (Dom/Seg…) + número; hoje destacado com borda `cyan`
- Eventos: `ev.color` como `border-left` colorida (estilo Google Calendar); horário abaixo do título; máx 3 por dia + "+N mais"; cancelados com `opacity-50` e tachado
- Banner "Hoje" com pulso cyan — aparece quando a semana exibida contém hoje e há shows ativos
- Card de resumo semanal: contagem de shows ativos + valor bruto da semana
- Clique em qualquer evento abre `EventDetailModal` via `handleEventClick`
- Build Vite ✅ zero erros

---

### 2026-06-12 (sessão S37) — UX polish: quick-pay, próximos eventos por cliente, ICS export

**Export ICS (iCal) na Agenda (S36):**
- `exportCalendarIcs` em `exportReport.js` — gera ICS válido (RFC 5545); eventos com/sem horário; DTEND correto; STATUS mapeado
- Botão `Download` ao lado do toggle Grid/Lista — exporta `filteredEvents` do momento; toast com orientação

**UX polish (S37):**
- `AlertsPanel` — fix: botão CTA agora usa cor correta para todos os tipos de alerta (indigo, purple, red estavam caindo em âmbar)
- `ClientDetail.jsx` — seção "Próximos Shows" aparece antes do Resumo Financeiro quando há eventos futuros com esse cliente
- `Calendar.jsx` (vista lista) — botão `BadgeCheck` inline em eventos concluídos/confirmados e não pagos; chama `handleMarkPaid` sem abrir modal; lista item refatorado de `<button>` inválido para `<div>` + buttons internos

**Build:** Vite ✅

---

### 2026-06-12 (sessão S35) — Busca + Vista Lista + Duplicar na Agenda

**Agenda — três melhorias de UX:**
- **Busca de eventos**: campo de texto com ícone Search + botão X acima dos filtros; filtra título, nome do cliente e local em tempo real
- **Lista de resultados**: quando busca está ativa, exibe resultados de todos os meses abaixo do grid em ordem cronológica com badge de status
- **Vista em lista**: toggle Grid/Lista no canto direito dos filtros — lista exibe eventos agrupados por mês com dia abreviado, título, cliente e badge status
- **Duplicar via EventDetailModal**: botão `Copy` adicionado no rodapé (ao lado do lixeira); prefill agora inclui campos de localização

**Build:** Vite ✅ (40s)

---

### 2026-06-11 (sessão S31) — Lapidação Sprint completa (8/8 páginas)

**Sprint lapidação** — todas as 8 rotas auditadas e polidas:
- Cursor: Home, Clientes, Despesas (`fe02530`), Relatórios (`adf337a`), Metas (`3b7e588`)
- Claude Code: Agenda (`85d0c2e`) — EventHeading TodayStrip + AlertsPanel break-words
- Claude Code: Despesas fix (`cad4b34`) — client lookup correto em `ExpenseListItem` (`event.clients` undefined → `useClients` + prop `client`)
- Claude Code: Perfil (`c43302b`) — pull-to-refresh adicionado (consistente com demais páginas)
- Claude Code: IA Mentor (`e26d418`) — `pb-safe` no input do chat (home indicator iOS)

**Build:** Vite ✅ · **Smoke:** 18/18 ✅ · **Deploy:** `e26d418` → https://backstage-pro-beta.vercel.app

---

### 2026-06-11 (sessão S27) — Correção de classes Tailwind dinâmicas + realtime sync

**Componentes corrigidos (Tailwind PurgeCSS):**  
- `FinancialSummary.jsx` — `bg-${color}-500/20` / `text-${color}-400` → `COLOR_CLASSES` mapa estático  
- `CategoryPicker.jsx` — `border-${color}-400`, `ring-${color}-500/50`, `shadow-${color}-500/20` → `selectedRingMap` literal  
- `ClientDetailModal.jsx` — `text-${color}-300/400` → `METRIC_COLOR_CLASSES` lookup  
**Micro-polish:**  
- `DailyWorkModal.jsx` — typo "saida" → "saída" no toast de validação  
**Realtime sync (Cursor):**  
- `RealtimeSyncProvider.jsx` + `realtimeBus.js` + `useRealtimeRefetch.js` — sync automático multi-device via Supabase postgres_changes  
- Migração `028_enable_realtime.sql` criada — pendente `supabase db push` para ativar no banco  
**Build:** Vite ✅ (21.70s)

---

### 2026-06-11 (sessão S26) — Lapidação profissional: 8 fixes de polish + 2 bugs timezone

**Páginas/componentes polidos:** ProfileSimple, Goals, Expenses, Clients, AI_Mentor, ExpenseListItem, ReportsChart  
**Fixes de polish:**  
- `ProfileSimple.jsx` — removido `overflow-hidden` do container do avatar (emoji da categoria estava sendo cortado)  
- `ProfileSimple.jsx` — footer "v1.0 MVP" → "v1.0" (linguagem profissional)  
- `Goals.jsx` — ícone `TrendingUp` em níveis já alcançados → `CheckCircle2` (semântica correta)  
- `Expenses.jsx` — `const CATEGORY_LABELS` movido para após todos os `import` (ES module correto)  
- `AI_Mentor.jsx` — textarea do chat faz auto-resize ao digitar (antes fixo em 1 linha; cresce até 120px, reseta ao enviar)  
- `Clients.jsx` — código WhatsApp duplicado substituído por `formatWhatsAppNumber()` de `@/lib/whatsapp`  
**Bugs de timezone corrigidos:**  
- `ExpenseListItem.jsx` — `new Date(expense.date)` → `parseISO(expense.date)`: no Brasil (UTC-3) as datas de despesas exibiam 1 dia a menos pois `new Date('YYYY-MM-DD')` interpreta como UTC midnight  
- `ReportsChart.jsx` — `new Date(Date.UTC(...))` → `parseISO(item.date)`: rótulos dos eixos do gráfico também exibiam data incorreta no Brasil  
**Build:** Vite ✅ (23.15s)

---

### 2026-06-11 (sessão S25) — Deep audit S25: Calendar/Reports/Clients/Expenses + 2 fixes

**Páginas auditadas:** Home.jsx (S24) ✅, Calendar.jsx ✅, Reports.jsx ✅, Clients.jsx ✅, Expenses.jsx ✅, ClientDetail.jsx ✅  
**Fixes:**  
- `Reports.jsx:518` — `e.paid_amount` sem guarda `|| 0` podia gerar NaN no modal "Clientes Ativos"; corrigido para `(e.paid_amount || 0)`  
- `src/components/hooks/useMediaQuery.jsx` — `matches` estava nas deps do `useEffect` → cleanup + re-registro do listener a cada resize; corrigido para deps `[query]` apenas (padrão idêntico ao já usado inline em Calendar.jsx)  
**Ausência de bugs críticos:** Calendar.jsx, Clients.jsx, Expenses.jsx, ClientDetail.jsx todos limpos  
**Build:** Vite ✅ (29.18s)

---

### 2026-06-11 (sessão S24) — Bugfix crítico: criar evento/selecionar/criar cliente

**Causa raiz:** `EventForm` abria via `useQueryAction` antes de `useClients()` terminar. Com `clients=[]` (estado inicial de loading) mostrava "Cadastre um cliente antes" — falso positivo que bloqueava o fluxo mesmo para quem já tinha clientes.  
**Fixes:**  
- `EventForm.jsx` + `Calendar.jsx` — prop `clientsLoading`; skeleton durante loading em vez de mensagem de erro prematura  
- `ClientQuickCreateDialog.jsx` — `razao_social` removido do payload de INSERT (coluna não existe em `clients`; já vai para `notes` via `buildCompanyNotes`)  
- `ClientForm.jsx` — botão submit era `type="submit"` fora do `<form>`; alterado para `type="button"` (comportamento correto em Safari/iOS)  
- `companies` RLS — `auth.role() = 'authenticated'` deprecated → `TO authenticated` (migration `023_fix_companies_rls.sql` aplicada)  
- Toasts sem acentos corrigidos em `ClientForm` e `EventForm`  
**Build:** Vite ✅ (24.81s) | **Deploy:** Vercel push `e00ee14` + migration 023 Supabase ✅

---

### 2026-06-10 (sessão 22) — Fixes client_type + EventForm + ClientDetail

**client_type display polish:** `ClientDetail.jsx` — avatar purple com ícone `User` para pessoa, avatar gradient neon + inicial para empresa; badge "Pessoa"/"Empresa" ao lado do nome; label "Empresa:" / "Contato:" dinâmico para `contact_person`.  
**EventForm placeholder:** "Usa o nome da empresa se vazio" → "Usa o nome do cliente se vazio" (neutro, cobre pessoa e empresa).  
**EventForm scroll fix (sessão 21):** `DialogContent` mudou de `max-h-[90dvh]` para `h-[95dvh] max-h-[95dvh]` — sem `h` explícito, `flex-1` no form não tinha referência de altura e `ScrollArea fill` não funcionava.  
**ClientCombobox bug fix:** item "Criar" aparecia e sumia — cmdk filtrava o `CommandItem` dinâmico; fix: `value={\`criar-${trimmedQuery}\`}` explícito; threshold `>= 1` char.  
**ClientQuickCreateDialog rewrite:** reescrito para suportar Empresa e Pessoa com toggle, `contact_person` para empresa de origem de pessoa.  
**Auditoria página a página:** concluída — todas as rotas 🟢 (exceto Google Calendar E2E manual pendente).  
**Build:** Vite ✅ (31.73s)  
**Deploy testes reais:** Vercel `dpl_CSCrk4jRwwdQwJaVUjAy7ie7wBiX` + Edge `ai-chat`/`analyze-receipt` ✅

---

### 2026-06-10 (sessão 21) — Meta diárias + backup git automático

**Meta diárias:** `countUniqueWorkDays` em `dateUtils.jsx`; `stats.diarias_count` em `useBackstageData.js`; labels em Goals, Home (`MetaMensalBar`, `QuickStats`), Perfil, Onboarding, `NotificationCenter`, `AI_Mentor`, `SmartSuggestions`, edge `ai-chat`. Campo DB continua `monthly_goal_events` (significado = dias únicos trabalhados).  
**Auto-git:** `.cursor/hooks.json` (`stop` + `sessionEnd`), script `auto-save-push.mjs`, regra `auto-git-backup.mdc`, `npm run git:backup`. Pausa via `.cursor/PAUSE_AUTO_GIT`.  
**Build:** Vite ✅ (25s) | **Smoke local:** 18/18 ✅

### 2026-06-10 (sessão 20) — Diferenciação Empresa / Pessoa nos clientes

**`022_clients_type.sql`:** coluna `client_type` (`'empresa'|'pessoa'`, default `'empresa'`) na tabela `clients` — aplicada no Studio ✅.  
**`ClientForm.jsx`:** toggle segmentado no topo do formulário; quando `pessoa` — oculta CNPJ/Razão Social e CompanySearchInput, labels se adaptam, `client_type` salvo no payload.  
**`ClientCombobox.jsx`:** ícone `Building2`/`User` ao lado de cada cliente na lista dropdown do EventForm.  
**`Clients.jsx`:** avatar com fallback `User` roxo + badge circular para pessoas; filtros "Empresas" e "Pessoas" adicionados.  
**`ClientDetailModal.jsx`:** badge "Pessoa"/"Empresa" no header; label "Contato" → "Empresa:" quando pessoa.  
**Build:** Vite ✅ (1m 29s)

### 2026-06-10 (sessão 19) — Fix categoria EventDetailModal + AlertsPanel cor CTA

**`EventDetailModal.jsx`:** seção de despesas inline exibia categoria bruta (`alimentacao`) — adicionado `EXPENSE_CATEGORY_LABELS` map igual ao de `ExpenseListItem`.  
**`AlertsPanel.jsx`:** botão CTA do alerta GPS check-in (cyan) herdava estilo amber — adicionada branch para `text-cyan-400`.  
**Auditoria**: `Calendar.jsx`, `DayQuickActions.jsx`, `AlertsPanel.jsx`, `EventDetailModal.jsx`, `ClientInsightsModal.jsx`, `Clients.jsx` — sem novos bugs.  
**Build:** Vite ✅ (26s)

### 2026-06-10 (sessão 18) — LiveClockBar em Reports/Goals/Expenses + fixes categoria + E2E

**`Reports.jsx`:** `LiveClockBar` adicionado na área de actions (ao lado do ExportManager); mojibake `â†'` → `→` corrigido.  
**`Goals.jsx`:** `LiveClockBar` adicionado no header (flex right).  
**`Expenses.jsx`:** `LiveClockBar` dual-visibility (mobile: linha do título; desktop: linha de botões); título encurtado para "Despesas".  
**`ExpenseListItem.jsx`:** badge de categoria exibia valor bruto (ex: `alimentacao`) — adicionado `CATEGORY_LABELS` map; campo `description` não era exibido na lista — corrigido para mostrar `description · notes` quando ambos preenchidos.  
**`e2e/regression/modal-overflow.spec.js`:** `strict mode violation` em `/E2E Show Demo/i` (2 elementos) — corrigido para `exact: true`.  
**Build:** Vite ✅ | **Testes:** `modal-overflow.spec.js` 4/4 ✅ (era 1 falhando)

### 2026-06-10 (sessão 17) — Migration is_reimbursable + fix description/notes em Expenses

**`supabase/migrations/021_expenses_reimbursable.sql`:** adiciona `is_reimbursable boolean DEFAULT false`, `reimbursed boolean DEFAULT false` e `description text` à tabela `expenses` — colunas usadas no UI (ExpenseForm, ExpenseListItem, Expenses.jsx, whatsapp.js) mas ausentes no banco.  
**`useExpenses.js` fix:** `mapPayloadToDb` salvava `notes` como fallback de `description` via `??` quebrado (strings vazias não disparam nullish coalescing); agora ambos salvos separadamente. `mapRowFromDb` também expõe `description` corretamente ao carregar despesa existente.  
**Build:** Vite ✅ (37.88s)  
**Migration aplicada:** 2026-06-10 — colunas confirmadas via `information_schema` ✅

### 2026-06-10 (sessão 16b) — Purge UI Shadcn + hooks órfãos + sistema toast legado

**Remoção adicional (~26 arquivos):** 16 componentes Shadcn nunca usados (`accordion`, `carousel`, `chart`, `drawer`, `form`, etc.), 5 UI customizados (`toggle`, `button-group`, `input-group`, `streak-badge`, `spinner`), sistema toast legado (`toast`, `toaster`, `use-toast`, `sidebar`), hooks `usePWA` + `use-mobile`, stub `generateNotifications`.  
**App.jsx:** `<Toaster>` legado removido — apenas Sonner ativo.  
**AppLayout.jsx:** import e chamada de `generateUserNotifications` removidos (stub vazio).  
**Reports.jsx:** encoding mojibake corrigido no comentário.  
**Build:** Vite ✅ (1m 3s)

### 2026-06-10 (sessão 16) — Purge de 42 componentes órfãos + bugfixes revenue/horários

**Remoção de código morto (42 arquivos):** Calendar (28), Dashboard (8), Reports (2), Auth/Notifications (2), Events/AI (3), Lib (1). Mais de 5.000 linhas removidas. Build continua ✅.  
**`whatsapp.js` `buildEventReport` — bug multi-dia:** fallback de cachê agora usa `getEventCacheAmount(event)` (considera `daily_cache_value × dias`) em vez de apenas `daily_cache_value` — eventos multi-dia tinham valor subestimado na mensagem WhatsApp.  
**`EventForm.jsx` — bug horários ignorados:** criar novo evento zerava `start_time` e `end_time` mesmo quando preenchidos — removida condicional `isNew ? null : ...`; horários agora salvos para todos os eventos.  

### 2026-06-10 (sessão 15) — Migração slate completa + busca Clients + fix ReportsChart ClientDetail

**Migração `gray-*` → `slate-*` finalizada:** todos os arquivos fora do Cursor migrados. Único remanescente intencional: `SocialLoginButtons.jsx` (branding Google/Apple).  
**Clients.jsx — busca expandida:** `searchTerm` agora pesquisa em `razao_social`, `email`, `phone` (normalizado) e `city`, além de `name` e `contact_person`.  
**ClientDetail.jsx — ReportsChart fix:** gráfico estava sempre vazio; `data` → `chartInput` com mapeamento correto de `{ realized, receivable, projected, expenses }`.  
**Receita consistente (3 componentes):** `ClientInsightsModal`, `PaymentAlerts`, `ClientDetailedTable` agora usam `getEventCacheAmount` como fallback, igual a `Clients.jsx` e `Reports.jsx`.  
**Expenses.jsx:** labels de categoria acentuados ("Alimentação" em vez de "alimentacao"); busca inclui `description`; placeholder atualizado.  
**EventDetailModal (calendar):** exibe `payment_due_date` na seção financeira quando preenchido e não pago.  
**ProfileSimple.jsx:** `handleSave` agora exibe `toast.error` quando falha (era silencioso).  
**Build:** Vite ✅ — deploy `8e78e07`

### 2026-06-10 (sessão 14) — Polish forms + paleta slate consistente

**EventForm:** label "Observações" corrigido; campo `payment_due_date` adicionado à UI (input date após "Modelo de pagamento").  
**ExpenseForm:** toast "título" e placeholder "Sem vínculo" acentuados.  
**ProximoShow + ProximosEventos:** `gray-*` → `slate-*` em toda a paleta (consistência visual); "Cliente sem nome" → `—`; ProximosEventos mostra até 6 eventos (era 5).

**Build:** pendente instrução de deploy.

---

### 2026-06-09 (sessão 11) — Scroll robustez: flex-shrink-0 + overflow responsivo + E2E regression

**`flex-shrink-0` em DialogHeader/DialogFooter (Claude Code):**
- `calendar/EventDetailModal.jsx` — header + footer agora não encolhem em telas pequenas
- `clients/ClientDetailModal.jsx` — idem
- `reports/EventListModal.jsx` — header corrigido
- Grep pós-fix: zero DialogHeader/DialogFooter sem `flex-shrink-0` em todo o projeto ✅

**Overflow responsivo + CSS (Claude Code):**
- `min-h-screen` → `min-h-full` em Home, Calendar, Goals, Profile
- `overflow-x-clip` em `NeonPageShell` + `[data-app-scroll]` no `index.css`
- Profile: grid categorias `grid-cols-1 min-[360px]:grid-cols-2` + `min-w-0` nos botões

**Auditoria `/client-detail` (Claude Code):**
- `NeonPageShell min-h-full pb-24` ✅ — scroll correto via `main[data-app-scroll]`
- `ReportEventList` com `ScrollArea h-[400px]` — inline card, correto ✅
- Todos os modais já corretos ✅

**E2E regression (Cursor):**
- Novo: `e2e/regression/overflow-responsive.spec.js` — 24 testes (7 rotas × 3 viewports + scroll vertical)
- Novo: `e2e/helpers/scrollAudit.js` — utilitários `auditPageOverflow` + `scrollMainContainer`
- `fakeAuth.js` aprimorado: mock Supabase profiles + addInitScript
- **Resultado:** 41/41 ✅ (1 flaky isolado de sequenciamento — pre-existente)

**Build:** ✅  
**Deploy:** pendente instrução do usuário

---

### 2026-06-09 (sessão 10) — Auditoria geral + features cadastro empresa + PDF fechamento + Goals/Expenses UX

**Auditoria completa scroll/modais — TODAS as páginas PASS:**
- `/calendar`, `/reports`, `/expenses`, `/goals`, `/clients`, `/`, `/profile` — 🟢
- Padrões corretos: `useAppScrollLock`, `bp-modal-scroll`, `ScrollArea fill`, `NeonPageShell pb-24`
- `StatDetailModal` confirmado órfão (`src/components/dashboard/`) — não importado em nenhuma rota ativa
- `NotificationCenter` usa `DropdownMenu` — scroll lock desnecessário para dropdown, comportamento correto

**CompanySearchInput — 3 abas:**
- **Pesquisar** (nome + cidade): busca paralela banco local + Edge Function; strip de acentos antes de enviar
- **CNPJ**: input formatado automaticamente; consulta direta BrasilAPI → muito mais confiável
- **NF-e XML**: upload e parse local (browser-only); extrai `<dest>` (contratante) e `<emit>` (emitente) do XML

**ClientForm — campos Razão Social / Nome Fantasia:**
- `razao_social` adicionado ao formulário (distinção clara para NF)
- `handleCompanySelect` popula os dois campos separadamente
- Razão Social inclusa nas `notes` ao salvar (sem migração necessária)
- `SelectedCompany` card compacto mostra ambos claramente

**Edge Function `search-company` — busca melhorada:**
- `stripAccents()` aplicado ao query antes de enviar à API
- Fallback: tenta com cidade → sem cidade → query original se não encontrar

**Goals.jsx — melhorias UX:**
- Mês atual (ex: "junho de 2026") visível no header "Progresso do Mês"
- 3° círculo de progresso: **A Receber** (pendente de pagamento)
- Cards de stats com sub-info contextual (% da meta, "tudo em dia", etc.)
- Empty state para "Próximos Shows": mensagem + botão "Agendar show"
- Mensagem de incentivo inteligente: considera receita E eventos; comemora quando ambas batidas

**Expenses.jsx — melhorias UX:**
- Agrupamento por mês (YYYY-MM) com seções colapsáveis (`MonthGroup`)
- Filtro por evento (Select com eventos que têm despesas)
- Ícone `Tag` nos filtros de categoria

**EventPDFDocument + Profile template de fechamento:**
- PDF profissional gerado via `@react-pdf/renderer` (dynamic import — não no bundle principal)
- Campos no Perfil: nome completo, subtítulo, cargo, chave PIX + tipo
- Download direto no `EventDetailModal`

**Build:** ✅ (sem erros)
**Deploy:** ✅ Vercel prod (`af786fe`) + `search-company` Supabase
**Smoke E2E:** 13/13 ✅

---

### 2026-06-09 (sessão 9) — Hotfix rotas + sistema de registro vivo

- **Bug crítico:** `React.lazy()` em rotas principais deixava páginas presas em "Carregando..." (módulo não resolvia)
- **Fix:** `routes.jsx` volta imports estáticos; deploy prod `ed46dfc`
- **Docs:** `CLAUDE.md`, `docs/AUDITORIA_PAGINAS.md`, `docs/IDEIAS_PENDENTES.md`
- **Testes:** smoke E2E 13/13 (calendar, bottom-nav, profile, auth routes)
- **Também no ar:** busca empresas Google-like (`6d7cd90`, `2e676fc`)

**Regra:** não reintroduzir lazy nas rotas até code-split seguro (subcomponentes ou error boundary).

---

### 2026-06-05 (sessão 8) — OAuth robustez + lazy routes + bundle

- `google-calendar-callback`: preserva `refresh_token` existente quando Google não reenvia (reconexão)
- `googleOAuthErrors.js`: mensagens pt-BR para erros OAuth no Perfil
- Lazy load: `Clients`, `Expenses`, `ClientDetail` (bundle principal ~402 KB)

**Checklist OAuth E2E (manual):** ver seção **Checklist OAuth Google Calendar** neste arquivo (pré-requisitos GCP + 10 passos no app).

---

### 2026-06-05 (sessão 7) — Alertas local + Modo Palco GPS + lazy routes

- `AlertsPanel` integrado na agenda (`Calendar.jsx`): alerta **Registrar local do evento** para shows de hoje sem `location`/coords; CTA chama `handleEventLocationCheckIn`
- `ProximoShow`: botão **Check-in no local (GPS)** no Modo Palco quando falta local; rota usa `mapsUrlForCoords` quando há lat/lng
- `useUpcomingEvent`: expõe `refetch` — Home atualiza card após GPS
- `routes.jsx`: lazy load de `Calendar`, `Reports`, `AI_Mentor` (chunks separados no build)

---

### 2026-06-05 (sessão 6) — UX local visível + scroll batch 4

- `EventLocationChip` em `AgendaView` e `DailyView` (local ou “não registrado”)
- Scroll: `RecurringEventActionModal`, loading do `DashboardCustomizer`, sheet de badge em `Goals`
- `LoadingSpinner` → `z-[100]` (acima da nav)
- `.gitignore`: `.env.vercel*`

---

### 2026-06-05 (sessão 5) — Local do evento + scroll modais

- `EventLocationSection`: autocomplete de endereço + botão **Check-in no local (GPS)** com reverse geocode
- `EventForm`: scroll `ScrollArea fill` + import `Select` corrigido
- `EventDetailModal` (calendar + reports): editar/salvar local; GPS salva automaticamente
- `EventActionSheet`: check-in GPS rápido no mobile
- Scroll: `KPIDetailModal`, `EventTemplateModal`, `FeedbackModal`, `PaymentConfirmModal`, `SourcesModal`, `DashboardCustomizer` → `bp-modal-scroll`

---

### 2026-06-05 (sessão 4) — Mapa SVG Brasil

- `BrazilVisitedMap.jsx`: paths reais por UF (`@svg-maps/brazil`), hover/click com tooltip
- Inferência de UF por `location_state` ou texto do endereço
- `Reports.jsx`: `React.lazy` + `Suspense` (skeleton)
- `vite.config.js`: chunk `vendor-brazil-map` (~64 KB gzip ~23 KB)

---

### 2026-06-05 (sessão 3) — Scroll batch 3 + UX clientes + OAuth

- `ClientDetailModal`: scroll `bp-modal-scroll`, badge rascunho
- Filtro **Rascunhos** em `Clients.jsx`
- `popover` / `select` / `LocationAutocomplete` → `z-[110]` (combobox e local dentro de modal)
- `GoogleCalendarSync`: reage a `?google_connected=1` após redirect OAuth
- `DrilldownModal`, `ReceiptAnalyzer`, `EventListModal`: `ScrollArea fill`

---

### 2026-06-05 (sessão 2) — Badge rascunho + scroll batch 2

**Commit:** `71bd732` — deploy prod

**Mudanças:**
- `ClientDraftBadge` nos cards de `Clients.jsx` quando `profile_complete === false`
- `alert-dialog`, `drawer`, Goals, AlertsNotifications, NotesSheet — z-index e scroll lock
- `ScrollArea fill` em StatDetailModal, ClientInsightsModal, DateInfoModal, DailyWorkModal, ExpenseForm
- CSS: trava scroll também para `role="alertdialog"`

**Para Claude Code ao retornar:** validar mobile em Goals, Despesas, alertas da agenda; depois OAuth Google E2E.

---

### 2026-06-05 — Scroll, z-index e relatório de vida

**Problema (testes reais):** rolagem do fundo continuava com modal aberto; scroll dentro do modal/form não respondia; cards/sheets apareciam acima de dialogs.

**Causa raiz:**
1. Scroll em `<main>`, não em `body` — Radix só trava `body`.
2. `z-50` compartilhado entre nav, sheets e dialogs.
3. `ScrollArea` sem `min-h-0` em layout flex (`flex-1` sem altura definida).

**Mudanças:**
- `useAppScrollLock.js` + CSS em `index.css`
- `data-app-scroll` no `AppLayout`
- Nav `z-30`; dialogs `z-[100]/[101]`
- Sheets mobile `z-[90]/[95]` + scroll lock
- `ScrollArea` prop `fill`; `.bp-modal-scroll`
- `ClientForm`, `EventDetailModal` (reports), sheets mobile atualizados

**Pendente validar:** Calendar completo, ExpenseForm, Goals modals, Clients page cards.

---

### 2026-06-05 — Google OAuth, combobox, legal, dedupe

**Commits:** `ecf5706`, `a6cd93c`

- Cor por empresa, `EventHeading`, sync Google sem duplicatas
- `ClientCombobox`, `LocationAutocomplete`, Nominatim BR
- Migrations `017`–`019`
- Edge functions `google-calendar` + callback; secrets GCP no Supabase
- Páginas `PrivacyPolicy`, `TermsOfService`
- Botão “Limpar duplicatas” no perfil
- `BrazilVisitedMap` em relatórios

**Deploy:** Vercel prod + Supabase functions redeployadas.

**Pendências:**
- [ ] Confirmar “Conectar Google” E2E após secrets
- [ ] Rotacionar `GOOGLE_CLIENT_SECRET` (exposto em chat/Downloads)
- [ ] Não commitar `client_secret_*.json`

---

### Sessões anteriores (resumo)

- Google Calendar: migrations `016`, edge functions OAuth, `GoogleCalendarSync` no perfil
- Scroll parcial: `min-h-0` no `AppLayout` main
- PWA / Vercel estável; hooks `useEvents`, `useClients`, etc.

---

## Backlog priorizado

### Alta (próxima sprint)
1. ~~Auditoria página a página~~ — ✅ sessão 11 (todas as rotas incluindo /ai-mentor)
2. ~~Validar scroll em todas as telas~~ — ✅ sessões 10–11
3. OAuth Google — checklist E2E manual (validar com sua conta real)
4. ~~Deploy sessão 11~~ — ✅ `0b666c7` em prod
5. Testar `CompanySearchInput` aba CNPJ com `42.993.331/0001-10` (Amarrok)
- ~~(2026-10-09) Aplicar migration 034 em produção~~ — ✅ aplicada (034–044 no ar)
- ~~(2026-10-09) Datas "hoje" em UTC~~ — ✅ conferido em 22/10: nenhum `new Date().toISOString()` de "hoje" sobrou; 29 arquivos usam `todayLocalISO()`
- (2026-10-09) Repositório GitHub está **público** e recebe o backup automático — decidir se fica privado
- (2026-10-21) Testar o Google Agenda v2 com a conta real: ligar "Trazer shows" e escolher a agenda dos shows no Perfil (vem desligado)
- (2026-10-21) Avisos no celular: a rodada das 8h (`send-push-digest`, 11:00 UTC) de 21/10 deu **500**; a das 18h deu 200. **22/10 8h: 200 (28 s)** — erro não repetiu; o timeout de 5 s do agendador ainda pode dar falso erro. O `net.http_post` do cron 027 usa o timeout padrão de 5 s (a função leva ~26 s) — olhar o log do 500 e subir o timeout
- (2026-10-21) Investigar o push desconhecido para `main` em 21/10 03:45
- ~~(2026-10-22) Publicar a revisão das telas~~ — ✅ publicado 22/10 (`03ee64a`, migração 045, `delete-account` v1, `send-push-digest` v6)
- (2026-10-22) Guih testar no iPhone: CHEGUEI/BATER SAÍDA num show de hoje (e sem sinal), "Ver todos" de Clientes em aberto, "Novo job" pelo cliente
- (2026-10-22) Agenda: `NotesSheet` ficou sem botão (o "Notas" saiu do menu do trabalho; notas seguem em Abrir › Resumo) — remover o código ou devolver o botão
- (2026-10-22) **Publicar as ideias novas** (`feat/ideias-novas`): 046 → `analyze-job` → push; depois testar no iPhone (modo ponto, colar mensagem, foto de credencial, km, equipamento, orçamento)
- (2026-10-22) Aviso de CSS no build (`-: .;`) vem de `src/lib/exportReport.js:191` (`/[-:.]/g` lido pelo Tailwind como classe) — antigo e inofensivo
- (2026-10-22) Sobras do visual antigo: props `primary/accent/glow` em `NeonGlass`/`NeonPageShell` e `userCategory` no `ProximoShow` não fazem nada — limpar quando mexer nessas telas
- (2026-10-22) Onboarding: área com emojis (Perfil usa barras coloridas) — alinhar se quiser

### Média
6. Animações financeiras / charts animados no dashboard (`vendor-charts` já bundlado)
7. ~~PWA offline~~ — ✅ S181–S183
8. **Auditoria mobile rigorosa** — ✅ S183–S189 (Agenda, Home, Relatórios, Clientes, Despesas, Metas)
9. ~~Expandir smoke E2E~~ — ✅ 46 testes (smoke + regression overflow + modal)

### Baixa / segurança
10. **Rotacionar `GOOGLE_CLIENT_SECRET`** (exposto em sessões passadas)
11. Publicar app OAuth (sair de “Testing”) quando E2E validado — precisa de domínio próprio (Hostinger → Vercel) + verificação dos escopos de agenda (ver § Checklist OAuth)
12. ~~`StatDetailModal`~~ — ✅ confirmado órfão; seguro remover quando quiser

---

## Como usar este documento (agentes IA)

1. **Antes de implementar:** ler “Estado atual” + “Backlog” + `IDEIAS_PENDENTES.md` + `AUDITORIA_PAGINAS.md`.
2. **Depois de implementar:** Changelog aqui + append em `AGENT_LOG.md` + marcar checkboxes nos outros docs.
3. **Se mudar z-index ou scroll:** atualizar seções “Camadas de UI” e “Scroll”.
4. **Claude Code:** ler `CLAUDE.md` na raiz.
5. **Não duplicar:** regras de negócio em docs antigos; este arquivo = estado técnico e histórico.

---

## Referências rápidas

```bash
npm run build
npx vercel --prod --yes
npx supabase functions deploy google-calendar --project-ref cwtallnetgodoacuoaow
```

**Arquivos sensíveis:** `.env.local`, `client_secret_*.json` — nunca commitar.
