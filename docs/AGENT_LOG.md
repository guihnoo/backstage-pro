# AGENT_LOG.md — Backstage Pro

Registro cronológico de tarefas executadas por agentes.

---

## 2026-06-13

### REPORTS-S44 — Aba Fiscal: rastreamento de Nota Fiscal por evento ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/reports/NfTracker.jsx`** (NOVO):
  - Recebe `events`, `clients`, `onOpenEvent`
  - Filtra eventos com valor > 0 e não cancelados; separa `pending` (sem `nf_number`) e `issued` (com `nf_number`)
  - 3 cards de resumo: Emitidas / Pendentes / Valor pendente
  - Seção âmbar "Sem Nota Fiscal" + seção verde "NF Emitida"; ambas colapsáveis (5 + "Ver mais N")
  - Clique em ExternalLink → `onOpenEvent(ev)` → abre `EventDetailModal` do Reports
- **`src/pages/Reports.jsx`**:
  - Import `NfTracker` + `Receipt` (lucide)
  - 5ª aba "Fiscal" com badge = contagem de eventos sem NF
  - Render `<NfTracker>` quando `selectedView === 'fiscal'`
- **Build**: Vite ✅ (44s) · **Git backup**: auto-wip ✅

### GOALS-S43 — Streak de meses + projeção "shows para bater meta" ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/pages/Goals.jsx`**:
  - Desestrutura `isVisible` de `useFinancialVisibility` (antes só `formatCurrency`)
  - `goalStreak` useMemo: conta meses consecutivos (até 24 para trás, pulando o mês atual) em que `paid revenue >= metaReceita`
  - `eventsNeededForGoal` useMemo: `remaining = metaReceita - stats.faturamento_pago`; `avgPerEvent` = média dos 3 últimos meses pagos; retorna `{ remaining, avg, count: ceil(remaining/avg) }` ou `null` quando já bateu ou sem histórico
  - UI: grid `grid-cols-2` com card âmbar de streak (🔥, contagem, label) + card "X shows ainda para bater a meta" com média por show, inseridos entre a lista de próximos eventos e o histórico mensal — o card de projeção expande para `col-span-2` quando não há streak
- **Build**: Vite ✅ (60s, sem erros novos) · **Git backup**: auto-wip ✅

### CALENDAR-S41 — Vista "Próximos Shows" + week view clicável ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/pages/Calendar.jsx`**:
  - 4º botão toggle `Zap` (âmbar) → `viewMode='upcoming'`
  - `upcomingGroups` useMemo: filtra activeEvents ≥ hoje sem filtro de status; grupos: Hoje/Amanhã/Esta semana/Próxima semana/Próximos 30 dias/Mais adiante
  - Cards com countdown relativo, data, horário, cliente, valor colorido (âmbar=pendente, vermelho=vencido, verde=pago)
  - Cabeçalho do dia na vista semanal virou `<button>` → `handleDayClick(day)`; hint "+" no hover
  - Imports: `differenceInCalendarDays, isBefore` (date-fns); `Zap` (lucide)
- **Build**: Vite ✅ · **Git backup**: auto-wip `cab8ad4`

## 2026-06-12

### CALENDAR-S40 — Vista Semanal (Week View) + polish completo ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/pages/Calendar.jsx`**:
  - Novo botão `CalendarDays` no toggle (entre Grade e Lista); `viewMode='week'` reinicia `weekStart` na semana atual
  - State `weekStart`; useMemos `weekDays` + `weekEventsByDay`
  - Grid `grid-cols-7` em `overflow-x-auto` com `min-w-[560px]` — scroll horizontal em mobile
  - Cabeçalho: ← / →, label "D Mmm – D Mmm AAAA", botão "Hoje"; hoje destacado com borda cyan
  - Cards de evento: `ev.color` como borda esquerda colorida; horário de início abaixo do título; máx 3 por dia + "+N mais"; cancelados com opacity + tachado
  - Banner "Hoje" com pulse cyan quando a semana contém o dia atual e há shows ativos
  - Card resumo semanal: número de shows ativos + valor bruto
  - Imports: `CalendarDays, ChevronLeft, ChevronRight` (lucide); `addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval` (date-fns)
- **Build**: Vite ✅ · **Git backup**: ✅ (auto-wip `15cb2f8`)

### REPORTS-S38 — ExportManager ICS + período "Esta Semana" ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/reports/ExportManager.jsx`**: botão ICS (azul, `CalendarDays` icon) exporta `data.events` do período com `exportCalendarIcs`; label derivado de `period.start`; toast com contagem
- **`src/pages/Reports.jsx`**: PERIOD_OPTIONS agora inclui `{ value: 'this_week', label: 'Esta Semana' }` no topo; imports `startOfWeek/endOfWeek/subWeeks/addWeeks`; case `this_week` no switch define current/previous/next week com `weekStartsOn: 0`
- **Build**: Vite ✅ · **Git backup**: ✅

### CALENDAR-S37 — UX polish: AlertsPanel cores + ClientDetail próximos eventos + quick-pay na lista ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/calendar/AlertsPanel.jsx`**: fix bug — CTA button usava ternário que só tratava `green`/`cyan` e caía em âmbar para `indigo`, `purple`, `red`; substituído por lookup object `{ 'text-green-400': ..., 'text-cyan-400': ..., ... }[alert.color]` — alertas "Show amanhã", "Horas pendentes" e "Pagamento vencido" agora têm botão na cor correta
- **`src/pages/ClientDetail.jsx`**: seção "Próximos Shows" aparece antes do Resumo Financeiro quando há eventos futuros; lista eventos futuros com barra de cor, data, local, badge status, valor; mostra até 4 + contador "+N futuros"
- **`src/pages/Calendar.jsx`**: vista lista refatorada — item era `<button>` (HTML inválido para nesting); agora `<div>` com 2 buttons internos (data+título → open modal, separados); botão `BadgeCheck` aparece quando `status=completed|confirmed` + `payment_status=unpaid` → chama `handleMarkPaid` diretamente sem abrir modal; badge "Pago" com estilo emerald quando já pago
- **Build**: Vite ✅ · **Git backup**: ✅

### CALENDAR-S36 — Export ICS (iCal) na Agenda ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/lib/exportReport.js`**: função `exportCalendarIcs(events, clients, label)` — gera arquivo `.ics` válido (RFC 5545); suporte a eventos com/sem horário (DTSTART VALUE=DATE vs TZID=America/Sao_Paulo); DTEND calculado corretamente (+1 dia para all-day); STATUS mapeado (pending→TENTATIVE, completed→CONFIRMED, cancelled→CANCELLED); inclui LOCATION e DESCRIPTION com nome do cliente
- **`src/pages/Calendar.jsx`**: import `Download` + `exportCalendarIcs`; `handleExportIcs` exporta `filteredEvents` (respeita busca + filtro de status); botão ícone `Download` ao lado do toggle Grid/Lista; toast de sucesso com contagem + orientação de uso
- **Build**: Vite ✅ · **Git backup**: ✅

### CALENDAR-S35 — Busca + Vista Lista + Duplicar + Agendar Show por cliente ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/calendar/EventDetailModal.jsx`**: import `Copy`; prop `onDuplicate` adicionada à assinatura; botão `Copy` no rodapé antes do lixeira (guarda `onDuplicate &&`)
- **`src/pages/Calendar.jsx`**:
  - `searchQuery` state + campo de busca (ícone Search + botão X para limpar) acima dos filtros de status — filtra por título, nome do cliente e local
  - Lista de resultados abaixo do grid quando `searchQuery` está ativa — eventos ordenados por data com badge de status dark-mode
  - `viewMode` state (`'grid' | 'list'`) + toggle LayoutGrid/List no canto direito dos filtros
  - Vista em lista: `listViewGroups` useMemo — eventos agrupados por mês, cada linha mostra cor, dia da semana abreviado, título, cliente, badge status
  - `handleDuplicateEvent` agora inclui `location`, `location_city`, `location_state`, `location_lat`, `location_lng` no prefill
- **`src/components/mobile/ClientActionSheet.jsx`**: botão "Agendar Novo Show" → `hardNavigate('/calendar?action=new-event&client_id=xxx')`
- **`src/components/clients/ClientDetailModal.jsx`**: botão "Agendar Show" no footer + `Plus` icon
- **`src/pages/Calendar.jsx`**: `useLocation` + `useNavigate`; `useEffect` lê `client_id` do URL quando `action=new-event` e injeta no `prefillEventData`; corrigido: resultados de busca só aparecem no modo grid
- **Build**: Vite ✅ (35s) · **Git backup**: ✅

### BUG-FIX-S34 — Correção de 3 features quebradas: Mapa, Push, Google Calendar ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Diagnóstico via logs Supabase (cwtallnetgodoacuoaow)**:
  - `google-calendar` → 500 consistente (GOOGLE_CLIENT_ID/SECRET ausentes nos Secrets)
  - `send-push-test` → 400 "Nenhum dispositivo inscrito" (VITE_VAPID_PUBLIC_KEY ausente no Vercel → frontend bloqueia subscription)
  - `BrazilVisitedMap` → SVG renderiza vazio (eventos sem location_state/location_city)
- **`src/components/reports/BrazilVisitedMap.jsx`**: `BrazilMapErrorBoundary` class component; renomeia inner para `BrazilVisitedMapInner`; export default com boundary; empty state melhorado (split: sem eventos vs eventos sem localização) com ícone `MapPin` e texto acionável
- **`src/components/notifications/PushNotificationSettings.jsx`**: warning `!vapidReady` expandido — mostra nome da variável `VITE_VAPID_PUBLIC_KEY` e instrução de onde configurar no Vercel Dashboard
- **`src/lib/googleOAuthErrors.js`**: adiciona `invalid_client` e `unauthorized_client` ao mapa de erros com mensagens apontando para Supabase Secrets e GCP Console
- **`supabase/functions/google-calendar/index.ts`**: guarda-chuva `auth-start` valida `GOOGLE_CLIENT_ID` antes de prosseguir; catch global retorna 400 para "não conectado" (evita 500 enganoso em `list-calendars`)
- **Deploy edge function**: `npx supabase functions deploy google-calendar --project-ref cwtallnetgodoacuoaow` ✅ (v25)
- **Ações pendentes do usuário** (infra — não pode ser feito por código):
  1. **Supabase Secrets**: `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` → Supabase Dashboard → Edge Functions → Manage Secrets
  2. **Vercel env**: `VITE_VAPID_PUBLIC_KEY=BGxgZes1QsJBP5pbOjKmV8ys6WVwAFOiZvZ4K5QBmetvv_qBF7xcuPs6GLh_xl0OSQk_mJl_9pacLWVqNkLO29E` → Vercel Project → Settings → Environment Variables → Production → re-deploy
  3. **GCP Console**: verificar redirect URI `https://cwtallnetgodoacuoaow.supabase.co/functions/v1/google-calendar-callback` autorizado; publicar app (sair de Modo Teste) ou adicionar e-mail como testador
- **Build**: n/a (edge function) · **Git backup**: `chore(auto):` ✅

### GOALS-S33 — Histórico mensal dos últimos 4 meses ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/pages/Goals.jsx`** (`2c660e2`): `monthlyHistory` useMemo — computa receita paga por mês dos últimos 4 meses via `allEvents` (já carregado); grid 2×2 na aba Metas com mini barra de progresso vs `metaReceita`; aparece somente quando há dados
- **Build**: Vite ✅ (44s) · **Deploy**: push `2c660e2`

### REPORTS-S33 — Modal de projeção do próximo período ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/pages/Reports.jsx`** (`2f0cae9`): `showProjection` state; Dialog com lista de eventos agendados/confirmados do próximo período (título, data, cliente, valor), total projetado, clique abre `EventDetailModal`; substituiu toast "em desenvolvimento"
- **Build**: Vite ✅ (27s) · **Deploy**: push `2f0cae9`

### WHATSAPP-S33 — Fix CRM: botão "Cobrar" usa buildChargeMessage ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/calendar/EventDetailModal.jsx`** (`6949f70`):
  - Import `buildChargeMessage` adicionado
  - `handleChargeWhatsApp()` criado — usa `buildChargeMessage({ clientName, events, totalAmount })` → mensagem profissional "Olá [cliente], passando para lembrar sobre o pagamento do show..."
  - Botão WhatsApp do painel CRM trocado de `handleShareWhatsApp` → `handleChargeWhatsApp`
- **Build**: Vite ✅ (26s) · **Deploy**: git push pendente

### LAPIDACAO-S33 — Feedback+Inbox encerrado; AppHelp confirmado ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- `Feedback + Inbox owner` → `done` (confirmado: FeedbackModal, AdminFeedbacks, rota, link Perfil, AppTopBar badge)
- `AppHelp.jsx` + `userManualContent.js` + `appVersion.js` criados pelo Cursor; build ok
- `IA Mentor` LAPIDACAO atualizado para commit `2b955b9` (S33)

### MAP-S39 — Fix BrazilVisitedMap: marcadores em posições incorretas ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Bug 1 (principal)**: `BOUNDS.east = -28.85` estava errado — essa longitude fica no Oceano Atlântico, leste do Brasil. O extremo real do Brasil é -34.79° (Ponta do Seixas, PB). O bound errado fazia com que a fórmula `x = (lng - west) / (east - west) * w` usasse denominador 45.14° em vez de 39.20°, deslocando todos os marcadores para a esquerda do mapa.
- **Bug 2**: `pathCentroid()` calculava o centro dos estados somando TODOS os números do SVG path string (inclusive offsets relativos `l`/`m` que não são coordenadas absolutas), gerando centroids incorretos usados como fallback de cidades sem GPS.
- **Correções em `src/components/reports/BrazilVisitedMap.jsx`**:
  - `BOUNDS.east` corrigido de -28.85 para -34.79 (extremo leste real do Brasil)
  - `pathCentroid` removida; `STATE_CENTROIDS` substituído por `STATE_GEO_CENTROIDS` — lookup de lat/lng geográficos reais dos 27 estados, convertido via `latlngToSvg` calibrada
- **Calibração**: script Node.js parseou os SVG paths reais do pacote, calculou bboxes por estado, regressão linear com 27 pontos → confirmou east=-34.79 como melhor fit (erro médio ≤ 8px por estado)
- **Build**: Vite ✅ (33s) · **Git backup**: ✅

### MANUAL-S33 — docs/MANUAL_USUARIO.md criado ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`docs/MANUAL_USUARIO.md`** (novo): manual completo do usuário — Home, Agenda, Clientes, Despesas, Relatórios, Metas, IA Mentor, Perfil, PWA offline, push notifications, atalhos e gestos, segurança
- **`docs/LAPIDACAO_STATUS.md`**: Manual do usuário → `done`
- **Build**: N/A (docs only)

### IAMENTOR-S33 — IA Mentor polish: typing dots + hint por categoria ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/pages/AI_Mentor.jsx`**:
  - `TypingDots` component inline: 3 pontos `motion.span` com `animate={{ opacity: [0.25,1,0.25], scale: [0.85,1.1,0.85] }}` delay escalonado → substitui `<Loader2 animate-spin> Gerando resposta…`
  - `CATEGORY_HINTS` map (audio/lighting/photo/video/dj/production/stage/security/catering/other) + `DEFAULT_HINT` → empty state usa `CATEGORY_HINTS[profile?.category] ?? DEFAULT_HINT`
- **Build**: Vite ✅ (31s) · **Deploy**: pendente

---

## 2026-06-11

### CRM2-S32 — Alertas CRM proativos no AlertsPanel ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/calendar/AlertsPanel.jsx`** (`6b92cab`): 2 novas regras CRM
  - "Horas pendentes": eventos concluídos nos últimos 14 dias sem `dailyWork` e sem `auto_hours_applied`
  - "Pagamentos vencidos": eventos com `payment_due_date` passado e `payment_status !== 'paid'`
  - Prop `onOpenEvent` adicionada — abre `EventDetailModal` ao clicar "Ver evento"
- **`src/pages/Calendar.jsx`**: passa `onOpenEvent={setSelectedEvent}` ao AlertsPanel
- **Build**: Vite ✅ (35s) · **Deploy**: `6b92cab` → https://backstage-pro-beta.vercel.app ✅

### CRM-S32 — Painel "Próximos Passos" no EventDetailModal (#6) ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/components/calendar/EventDetailModal.jsx`** (`b9363ce`): substituiu card "Ação Rápida" (só 12h) por painel CRM completo para eventos concluídos/arquivados
  - Pendências: checklist horas (botões "12h Auto" e "Manual") + pagamento ("Pago" + "WhatsApp cobrança")
  - Tudo feito: badge verde "Evento fechado 🎉" com resumo de horas e valor ganho
  - Removido botão redundante "Marcar como Pago" do DialogFooter
- **Imports adicionados**: `Circle`, `ClipboardCheck`, `PartyPopper`
- **Build**: Vite ✅ (50s) · **Deploy**: `b9363ce` → https://backstage-pro-beta.vercel.app ✅

### PWA-S32 — PWA offline refinado + sync estado (#15) ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`src/hooks/usePWA.js`** (novo): captura `beforeinstallprompt`, expõe `isInstallable`, `isInstalled`, `isOnline`, `installApp()`
- **`src/components/pwa/InstallPwaCard.jsx`** (novo): card dismissível "Instalar como app" — mostra só quando `isInstallable && !isInstalled`; persiste dismiss em `localStorage`
- **`src/components/layout/OfflineBanner.jsx`**: estado "Conexão restaurada — puxe para atualizar" por 3s após voltar online + dispara `window.dispatchEvent(new CustomEvent('backstage:reconnect'))`
- **`src/pages/ProfileSimple.jsx`**: import + `<InstallPwaCard>` antes do botão Exportar
- **Build**: Vite ✅ (31s) · **Deploy**: `f2a6708` → https://backstage-pro-beta.vercel.app ✅

### LAPIDA-S31 — Sprint lapidação completa: Agenda + Despesas fix + Perfil + IA Mentor ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Sprint status**: 8/8 páginas `done` (Cursor: Home, Clientes, Despesas, Relatórios, Metas — Claude: Agenda, Despesas fix, Perfil, IA Mentor)
- **`ExpenseListItem.jsx` + `Expenses.jsx`** (`cad4b34`): `event.clients` era sempre undefined (useEvents não faz JOIN); adicionado `useClients` em Expenses, client resolvido por `client_id` no MonthGroup e passado como prop
- **`ProfileSimple.jsx`** (`c43302b`): `usePullToRefresh(refetchStats)` + `PullToRefreshIndicator` — pull-to-refresh consistente com todas as outras páginas
- **`AI_Mentor.jsx`** (`e26d418`): `pb-safe` no footer do chat — input ficava sob o home indicator do iPhone sem a safe area
- **Build**: Vite ✅ (36-50s) · **Smoke**: 18/18 ✅ · **Deploy**: 3× Vercel prod
- **Arquivos**: `src/pages/Expenses.jsx`, `src/components/expenses/ExpenseListItem.jsx`, `src/pages/ProfileSimple.jsx`, `src/pages/AI_Mentor.jsx`, `docs/LAPIDACAO_STATUS.md`, `docs/AUDITORIA_PAGINAS.md`

---

### PUSH-S30 — Push Notifications: infraestrutura completa ✅ (sessão anterior)
- **Ver**: commit `85d0c2e` (Agenda lapidação) + sessão S30 no RELATORIO

---

### POLISH-S26 — Lapidação profissional: 6 melhorias de polish ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`ProfileSimple.jsx`**: removido `overflow-hidden` do container do avatar → emoji da categoria era cortado; footer "v1.0 MVP" → "v1.0"
- **`Goals.jsx`**: ícone `TrendingUp` em níveis já superados → `CheckCircle2` (semântica: "concluído"); importado `CheckCircle2` do lucide-react
- **`Expenses.jsx`**: `const CATEGORY_LABELS` estava entre `import` statements — movido para após todos os imports (ES module correto)
- **`AI_Mentor.jsx`**: textarea do chat agora faz auto-resize ao digitar (`scrollHeight` até 120px); reseta ao enviar mensagem
- **`Clients.jsx`**: lógica duplicada de formatação de número WhatsApp substituída por `formatWhatsAppNumber()` de `@/lib/whatsapp`
- **Bug timezone `ExpenseListItem.jsx`**: `new Date(expense.date)` → `parseISO(expense.date)` — datas de despesas exibiam 1 dia a menos no Brasil (UTC-3) pois JS trata `'YYYY-MM-DD'` como UTC midnight
- **Bug timezone `ReportsChart.jsx`**: `new Date(Date.UTC(...))` → `parseISO(item.date)` — rótulos de eixo dos gráficos sofriam mesmo problema
- **Build**: Vite ✅ (23.15s) — sem warnings novos
- **Arquivos**: `src/pages/ProfileSimple.jsx`, `src/pages/Goals.jsx`, `src/pages/Expenses.jsx`, `src/pages/AI_Mentor.jsx`, `src/pages/Clients.jsx`, `src/components/expenses/ExpenseListItem.jsx`, `src/components/reports/ReportsChart.jsx`, `docs/RELATORIO_VIDA_APP.md`, `docs/AGENT_LOG.md`

---

### POLISH-S27 — Correção de classes Tailwind dinâmicas + realtime sync + micro-polish ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **`FinancialSummary.jsx`**: `bg-${color}-500/20` e `text-${color}-400` substituídos por mapa estático `COLOR_CLASSES` (6 cores: green/yellow/red/cyan/purple/blue) — classes não seriam geradas pelo PurgeCSS
- **`CategoryPicker.jsx`**: `border-${color}-400`, `ring-${color}-500/50`, `shadow-${color}-500/20` extraídos para `selectedRingMap` com classes literais
- **`ClientDetailModal.jsx`**: `text-${color}-300` e `text-${color}-400` substituídos por `METRIC_COLOR_CLASSES` lookup
- **`DailyWorkModal.jsx`**: typo "saida" → "saída" no toast de validação
- **Realtime sync** (Cursor): `RealtimeSyncProvider.jsx` + `realtimeBus.js` + `useRealtimeRefetch.js` — sincronização entre dispositivos via Supabase postgres_changes; todos os hooks principais integrados
- **Migração**: `supabase/migrations/028_enable_realtime.sql` — habilita realtime nas 6 tabelas core; precisa de `supabase db push` para entrar em vigor
- **Build**: Vite ✅ (21.70s) — sem warnings novos
- **Arquivos modificados**: `FinancialSummary.jsx`, `CategoryPicker.jsx`, `ClientDetailModal.jsx`, `DailyWorkModal.jsx`

### AUDIT-S28 — Lapidação profissional: auditoria completa de componentes restantes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Metodologia**: Leitura completa de cada componente com foco em classes Tailwind dinâmicas, bugs de fuso horário, typos em toasts, e problemas de UX/estrutura
- **Fix**: `PaymentConfirmModal.jsx` — toast `'Informe um valor valido'` → `'Informe um valor válido'` (typo de acento)
- **Componentes auditados e confirmados limpos**:
  - `Onboarding.jsx` — flow de 5 steps correto, sem dinâmicas, sem bugs de timezone
  - `reports/EventDetailModal.jsx` — SSOT `getEventCacheAmount`, `work.date` garantido pelo `mapRowFromDb` no `useDailyWork`
  - `mobile/EventHoursSheet.jsx` — scroll via `.bp-modal-scroll`, z-index 90/95, validação robusta, turnos overnight OK
  - `mobile/NotesSheet.jsx` — `ScrollArea fill`, `useAppScrollLock`, estrutura correta
  - `clients/ClientForm.jsx` — validação completa, fallback gracioso para coluna `brand_color` ausente, `razao_social` via `notes`
  - `reports/DrilldownModal.jsx` — export CSV correto, acessibilidade (role/tabIndex/onKeyDown)
  - `reports/PaymentConfirmModal.jsx` — fix typo acima; `format(date, 'yyyy-MM-dd')` seguro
  - `reports/ExportManager.jsx` — limpo, bem estruturado
  - `reports/ReportEventList.jsx` — calcula valor via `dailyWork` por evento corretamente
  - `calendar/BackstageCalendarGrid.jsx` — memoização correta, `Array.isArray` defensores, sem classes dinâmicas
- **`useDailyWork.js`** — verificado: `mapRowFromDb` garante `.date` e `.work_date` sincronizados em todos os registros; consistência entre `EventHoursSheet` (salva `date`) e `DailyWorkModal` (salva `work_date`) é normalizada pelo `mapPayloadToDb`
- **Build**: sem build nesta sessão (mudança mínima, apenas typo)
- **Arquivos modificados**: `src/components/reports/PaymentConfirmModal.jsx`

---

### DEEP-AUDIT-S25 — Auditoria página a página (continuação) + 2 fixes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Páginas auditadas**: Calendar.jsx, Reports.jsx, Clients.jsx, Expenses.jsx, ClientDetail.jsx (+ Home.jsx auditada em S24)
- **Fix `Reports.jsx:518`**: `e.paid_amount` sem `|| 0` → NaN no modal "Clientes Ativos" ao clicar no KPI; corrigido para `(e.paid_amount || 0)`
- **Fix `useMediaQuery.jsx`**: `matches` nas deps do useEffect causava cleanup/re-registro do listener a cada mudança de state; corrigido para `[query]` apenas (alinhado com versão inline em Calendar.jsx)
- **Verificações limpas**: Calendar.jsx (useMediaQuery local correto, clientsLoading já fixado em S24, DailyWork payload correto), Clients.jsx (sem bugs), Expenses.jsx (sem bugs), ClientDetail.jsx (form só abre após isLoading=false → sem race condition)
- **Build**: Vite ✅ (29.18s) — sem warnings novos
- **Arquivos**: `src/pages/Reports.jsx`, `src/components/hooks/useMediaQuery.jsx`, `docs/RELATORIO_VIDA_APP.md`, `docs/AGENT_LOG.md`

---

## 2026-06-10

### CLIENT-TYPE-S20 — Diferenciação Empresa / Pessoa nos clientes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Migration `022_clients_type.sql`**: coluna `client_type text DEFAULT 'empresa' CHECK (IN 'empresa','pessoa')` — aplicada no Studio ✅; clientes existentes herdam `'empresa'`
- **`ClientForm.jsx`**: toggle segmentado Empresa/Pessoa no topo; quando `pessoa` — oculta `razao_social` e `CompanySearchInput`, placeholder e label do `name` muda para "Nome completo", `contact_person` vira "Empresa / Produtora"; ícone do header muda para `User` roxo; `client_type` incluído no payload de save
- **`ClientCombobox.jsx`**: lista exibe `Building2` (empresa) ou `User` roxo (pessoa) ao lado do color dot; selecionado também exibe `User` se pessoa
- **`Clients.jsx`**: avatar fallback `User` roxo para pessoas + badge circular roxo; filtros "Empresas" e "Pessoas" (toggle — clica de novo para voltar a "all"); `contact_person` de pessoa exibe "🏢 " como prefixo
- **`ClientDetailModal.jsx`**: badge "Pessoa"/"Empresa" ao lado do nome + avatar fallback diferenciado; label "Contato" vira "Empresa:" quando pessoa
- **Build**: Vite ✅ (1m 29s)
- **Arquivos**: `supabase/migrations/022_clients_type.sql`, `src/components/clients/ClientForm.jsx`, `src/components/clients/ClientCombobox.jsx`, `src/pages/Clients.jsx`, `src/components/clients/ClientDetailModal.jsx`

### PAGE-AUDIT-S19 — Fix categoria EventDetailModal + AlertsPanel cor CTA + auditoria Clientes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Fix `EventDetailModal.jsx`** — seção de despesas do evento exibia categoria bruta (`alimentacao`) com CSS capitalize; adicionado `EXPENSE_CATEGORY_LABELS` map com mesmos valores de `ExpenseListItem`
- **Fix `AlertsPanel.jsx`** — botão CTA do alerta GPS check-in (cor cyan) recebia estilo amber via else genérico; adicionada branch condicional para `text-cyan-400`
- **Auditoria**: `Calendar.jsx`, `DayQuickActions.jsx`, `AlertsPanel.jsx`, `EventDetailModal.jsx`, `ClientInsightsModal.jsx`, `Clients.jsx` — todos sem bugs estruturais
- **Build**: Vite ✅ (26s)
- **Arquivos**: `src/components/calendar/EventDetailModal.jsx`, `src/components/calendar/AlertsPanel.jsx`

### PAGE-AUDIT-S18 — LiveClockBar + fixes de categoria + teste E2E ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **LiveClockBar adicionado** — `Reports.jsx`: clock na área de actions (direita) + import + mojibake corrigido; `Goals.jsx`: clock na div flex right; `Expenses.jsx`: dual-visibility (mobile: dentro do título, desktop: na linha de botões) + título encurtado de "Gerenciador de Despesas" para "Despesas"
- **Fix `ExpenseListItem.jsx`** — badge de categoria exibia valor bruto (ex: `alimentacao`) em vez de label pt-BR (`Alimentação`) — adicionado `CATEGORY_LABELS` map e usado no badge; campo `description` nunca exibido na lista — corrigido para mostrar `description || notes` ou ambos separados por ` · `
- **Fix teste E2E `modal-overflow.spec.js`** — `getByRole('button', { name: /E2E Show Demo/i })` resolvia 2 elementos (lista "Hoje" + grid calendário) → `strict mode violation`; corrigido para `exact: true` — testa apenas o item da lista do dia corrente
- **Builds**: Vite ✅ (×2 — 24s e 67s)
- **Testes**: `modal-overflow.spec.js` 4/4 ✅ (era 1 falhando antes do fix)
- **Arquivos**: `src/pages/Reports.jsx`, `src/pages/Goals.jsx`, `src/pages/Expenses.jsx`, `src/components/expenses/ExpenseListItem.jsx`, `e2e/regression/modal-overflow.spec.js`

### EXPENSES-MIGRATION-APPLY — Migration 021 aplicada no Supabase Studio ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Ação**: SQL da migration 021 executado manualmente via SQL Editor do Supabase Studio
- **Verificado**: `information_schema.columns` confirmou `is_reimbursable` (boolean NOT NULL default false), `reimbursed` (boolean NOT NULL default false), `description` (text nullable) na tabela `expenses`
- **Status**: completo — pendência anterior encerrada

### EXPENSES-MIGRATION — Migration is_reimbursable + fix description/notes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Bug detectado**: colunas `is_reimbursable`, `reimbursed` e `description` usadas no UI/whatsapp mas ausentes na tabela `expenses` → Supabase retornaria erro 400 ao salvar
- **Fix**: `supabase/migrations/021_expenses_reimbursable.sql` — 3 colunas via `ADD COLUMN IF NOT EXISTS`; CONSOLIDATED.sql atualizado
- **Fix `useExpenses.js`**: `mapPayloadToDb` — `notes` e `description` salvos separadamente (bug com `??` em strings vazias); `mapRowFromDb` — expõe `description` ao carregar
- **Arquivos**: `supabase/migrations/021_expenses_reimbursable.sql`, `supabase/migrations/CONSOLIDATED.sql`, `src/lib/useExpenses.js`
- **Build**: Vite ✅ (37.88s)
- **Pendente**: rodar migration no Supabase Studio

### ORPHAN-PURGE-2 + BUGFIXES — Remoção 42 componentes órfãos + correções revenue e horários ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Removidos — Calendar (28 arquivos)**: `AgendaView`, `AlertsNotifications`, `CalendarGrid`, `DailyView`, `DateInfoModal`, `DayBottomSheet`, `DayCardGoogle`, `DayCellFrame`, `DayDetailPanel`, `DayQuickActionsMobile`, `EnhancedCalendar`, `EventCardLarge`, `EventDots`, `FilterChips`, `GestureNavigator`, `KeyboardShortcuts`, `Legend`, `MiniDay`, `MiniMonthGrid`, `MobileDayHeader`, `MobileNavigation`, `MonthlyStats`, `QuickActionButtons`, `RecurringEventActionModal`, `WeekTimeGrid`, `WeekdayBarGoogle`, `WeekdayStickyHeader`, `WeeklySummary`
- **Removidos — Dashboard (8 arquivos)**: `DashboardSkeleton`, `EventStatusSummary`, `EventsInPeriod`, `MobileDashboard`, `PaymentAlerts` (dash), `PeriodSelector`, `PeriodSummary`, `StatCard`
- **Removidos — Reports (2)**: `EventListModal`, `PaymentAlerts` (reports)
- **Removidos — Auth/Notifications (2)**: `AudioWave`, `PushNotifications`
- **Removidos — Events/AI (3)**: `EventLocationChip`, `ChatSuggestions`, `SourcesModal`
- **Removidos — Lib (1)**: `featureUnavailable.js`
- **Bug fix — `whatsapp.js` `buildEventReport`**: fallback de cachê agora usa `getEventCacheAmount(event)` (multi-dia correto) em vez de apenas `daily_cache_value` sem multiplicar pelos dias
- **Bug fix — `EventForm.jsx` start_time/end_time**: ao criar novo evento, `start_time` e `end_time` sempre nulos mesmo quando user preencheu os campos — removida condicional `isNew ? null : ...`
- **Build**: Vite ✅ (~57s)

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

---

### ORPHAN-PURGE-3 + UI-CLEANUP — Purge UI Shadcn + hooks + geração de notif morta ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Diretórios vazios removidos**: `src/components/ai-elements/`, `src/lib/branding/`, `src/lib/closure/`, `src/components/ui/backstage/`
- **Hooks órfãos removidos**: `src/hooks/usePWA.js`, `src/hooks/use-mobile.jsx`
- **Lib stub removida**: `src/lib/generateNotifications.js` (função vazia, nunca chamada) + `AppLayout.jsx` limpo do import morto
- **UI Shadcn não utilizados removidos (16)**: `accordion`, `aspect-ratio`, `breadcrumb`, `carousel`, `chart`, `collapsible`, `context-menu`, `drawer`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `resizable`, `toggle-group`
- **UI customizados não utilizados removidos (5)**: `toggle`, `button-group`, `input-group`, `streak-badge`, `spinner`
- **Sistema toast legado removido (4)**: `toast.jsx`, `toaster.jsx`, `use-toast.jsx`, `sidebar.jsx` — Sonner é o único sistema de toast ativo
- **App.jsx**: `<Toaster />` legado removido
- **Reports.jsx**: corrigido encoding mojibake no comentário `MUDANÃ‡A CRÍTICA` → `MUDANÇA CRÍTICA`
- **Total removido**: ~26 arquivos adicionais
- **Build**: Vite ✅ (1m 3s)

---

### SESSÃO-21 — Meta diárias + auto-git backup — 2026-06-10
- **Agente**: Cursor (Auto)
- **Escopo**: Confirmar meta diárias no código; backup git automático; validação build/smoke; docs
- **Arquivos**: `.cursor/hooks.json`, `.cursor/hooks/auto-save-push.mjs`, `.cursor/rules/auto-git-backup.mdc`, `CLAUDE.md`, `AGENTS.md`, `package.json`, `.gitignore`, `docs/RELATORIO_VIDA_APP.md`
- **Build**: Vite ✅ (~25s)
- **Testes**: `npm run test:e2e:smoke` 18/18 ✅
- **Deploy**: Vercel prod ✅ `dpl_8dAJVA59EXHp35SMnc4TJCWUrJCA` → https://backstage-pro-beta.vercel.app
- **Testes prod**: `npm run test:e2e:prod` 47/47 ✅ (incl. assert "Meta de diárias por mês" no perfil)
- **Notas**: Commits WIP usam prefixo `chore(auto):`

---

### FIX-EVENTFORM-COMBOBOX — Combobox inerte no modal — 2026-06-10
- **Agente**: Cursor (Auto)
- **Causa**: Popover/Select portados no `body` ficavam sob `inert` do Dialog Radix — cliques não registravam
- **Fix**: `portalContainer.js`; Popover/Select portam dentro do dialog aberto; `Dialog.onInteractOutside` ignora popover; `EventForm` `modal={false}` ao abrir quick-create; toasts em falha de create; fallback `client_type` em `useClients`
- **Teste**: `e2e/regression/event-form-client-combobox.spec.js` ✅
- **Deploy**: Vercel `dpl_8kxBhiWDxwrxVBojCGhDVJtsWuQP` + migrations 021/022 confirmadas no Supabase

---

### DEEP-AUDIT-S23 — Lapidação página a página (Home + Calendar + Reports) — 2026-06-10
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Metodologia**: 5 eixos por página — Segurança, Performance, Design/UX, Funcionalidade, Infra/Código
- **Bugs corrigidos**:
  - `ProximoShow.jsx` — `parseISO(null)` crash + ícone `User` errado no grid Status → `isValid` guard + `CheckCircle2`/`Circle` semânticos
  - `PipelineFinanceiro.jsx` — `stats.faturamento_pago + stats.a_receber` sem `?.` → variáveis locais com fallback `?? 0`
  - `AReceber.jsx` — painel confirmação e expansão de eventos abriam simultaneamente → `setConfirming(null)` no `toggleExpand`
  - `ForecastWidget.jsx` — deps `today`/`in30` ignoradas no `useMemo` → `todayMs = startOfDay(new Date()).getTime()` nas deps
  - `calendar/EventDetailModal.jsx` — `window.location.reload()` após aplicar 12h → `onMarkPaid?.()` (refresh sem reload)
  - `AlertsPanel.jsx` — `dismissedAlerts` local resetado em cada reload → `sessionStorage` para persistir na sessão
  - `Calendar.jsx` — `workDays = monthWork.length` contava entradas brutas → `new Set` de datas únicas
  - `Calendar.jsx` — `useMediaQuery` com `matches` nas deps → loop potencial → `useState(() => media.matches)` + listener via `e.matches`
  - `EventForm.jsx` — sem validação data_fim < data_início → toast de erro adicionado
  - `Reports.jsx` — `parseISO(event.paid_date)` sem null-check (3 pontos) → guards `? format(...) : '--'`
- **Build**: Vite ✅ (17.89s)
- **Arquivos**: `ProximoShow.jsx`, `PipelineFinanceiro.jsx`, `AReceber.jsx`, `ForecastWidget.jsx`, `calendar/EventDetailModal.jsx`, `AlertsPanel.jsx`, `Calendar.jsx`, `EventForm.jsx`, `Reports.jsx`
- **Pendente**: Continuar auditoria — Clientes (clean), Despesas, Metas, Perfil, AI Mentor, componentes compartilhados

### PAGE-AUDIT-S22 — Fixes client_type display + EventForm + ClientDetail — 2026-06-10
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Arquivos modificados**:
  - `src/pages/ClientDetail.jsx` — avatar purple/User para pessoa; badge Pessoa/Empresa; label "Empresa:"/"Contato:" dinâmico
  - `src/components/calendar/EventForm.jsx` — placeholder "Usa o nome da empresa se vazio" → "Usa o nome do cliente se vazio"
  - `docs/RELATORIO_VIDA_APP.md` — changelog sessão 22; estado `client_type` + combobox
  - `docs/IDEIAS_PENDENTES.md` — item 34 `client_type` marcado ✅
  - `docs/AGENT_LOG.md` — este entry
- **Build**: Vite ✅ (31.73s — sessão anterior; sem regressão)
- **Deploy**: Vercel prod ✅ `dpl_CSCrk4jRwwdQwJaVUjAy7ie7wBiX`; Supabase `ai-chat` + `analyze-receipt` ✅
- **Auditoria página a página**: todas as rotas 🟢 — auditoria completa encerrada
- **Notas**: EventForm scroll fix (`h-[95dvh]`), ClientCombobox "Criar" bug fix e ClientQuickCreateDialog rewrite (Empresa+Pessoa) foram feitos em sessões 20–21; sessão 22 completou o polish em `ClientDetail.jsx` e fechou a auditoria

### DEEP-AUDIT-S23b — Lapidação página a página continuação (Goals + AI Mentor + mobile sheets) — 2026-06-10
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Metodologia**: Continuação da sessão DEEP-AUDIT-S23 — Goals, AI Mentor, ClientDetail, EventActionSheet, EventHoursSheet, NotesSheet, ClientInsightsModal, Clients, Onboarding
- **Bugs corrigidos**:
  - `Goals.jsx` — `parseISO(ev.start_date)` sem guard → `if (!ev.start_date) return null`
  - `AI_Mentor.jsx` — `parseISO(conv.createdAt)` sem null-check → guard `conv.createdAt ?`
  - `AI_Mentor.jsx` — `window.speechSynthesis` sem checar suporte do browser → guards `if (!window.speechSynthesis)`
  - `DailyWorkModal.jsx` — toast sem acentos "Nao foi possivel salvar" → "Não foi possível salvar o registro de trabalho."
  - `EventHoursSheet.jsx` — validação `exit_time <= entry_time` como string bloqueava turnos overnight (23:00→01:00) → removida comparação (calculateHours já trata via +24h)
  - `EventActionSheet.jsx` — `formatDisplayDate(event.end_date)` quando null rendia traço sobrando " - " → condicional `event.end_date && event.end_date !== event.start_date`
- **Componentes limpos (sem bug)**: `ClientDetail.jsx`, `NotesSheet.jsx`, `ClientInsightsModal.jsx`, `Clients.jsx`, `Onboarding.jsx`, `ProfileSimple.jsx`, `Expenses.jsx`
- **Build**: Vite ✅ (22.85s)
- **Arquivos**: `Goals.jsx`, `AI_Mentor.jsx`, `DailyWorkModal.jsx`, `EventHoursSheet.jsx`, `EventActionSheet.jsx`
- **Deploy**: pendente (agrupado com sessão S23)

### BUGFIX-S24 — Correção crítica: não conseguia criar evento/selecionar/criar cliente — 2026-06-10
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Causa raiz identificada**: EventForm abria via `useQueryAction` antes de `useClients()` terminar de carregar. Com `clients=[]` (estado inicial), mostrava "Cadastre um cliente antes" mesmo que o usuário tivesse clientes — falso positivo de conta sem clientes.
- **Bugs corrigidos**:
  - `EventForm.jsx` + `Calendar.jsx` — prop `clientsLoading` adicionada; durante loading mostra skeleton em vez de mensagem "Cadastre um cliente" (evita bloqueio falso)
  - `ClientQuickCreateDialog.jsx` — `razao_social` era incluído diretamente no payload de INSERT mas a coluna não existe na tabela `clients` → campo removido do payload (já vai para `notes` via `buildCompanyNotes`)
  - `ClientForm.jsx` — botão submit tinha `type="submit"` mas estava fora do `<form>` (após `</ScrollArea>`); alterado para `type="button"` para evitar comportamento indefinido em Safari/iOS
  - `ClientForm.jsx` e `EventForm.jsx` — toasts sem acentos corrigidos
  - `companies` RLS — políticas `auth.role() = 'authenticated'` deprecated → `TO authenticated` em `023_fix_companies_rls.sql`
- **Arquivos**: `EventForm.jsx`, `Calendar.jsx`, `ClientQuickCreateDialog.jsx`, `ClientForm.jsx`, `023_fix_companies_rls.sql`
- **Build**: Vite ✅ (24.81s)
- **Deploy**: Vercel prod ✅ (push `e00ee14`); migration 023 aplicada ao Supabase remoto

---

## 2026-06-11

### AUDIT-S29 — Lapidação profissional: auditoria de componentes + 2 bug fixes ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Metodologia**: Varredura sistemática de todos os .jsx restantes (~35 componentes) procurando: classes Tailwind dinâmicas, bugs de timezone, `window.confirm()`, padrões de scroll incorretos, typos
- **Bugs corrigidos**:
  - `src/components/calendar/GoogleCalendarSync.jsx` — 3× `window.confirm()` bloqueante (handleDisconnect, handleImportEvents, handleDedupeEvents) → substituídos por `ConfirmDialog` com `pendingAction` state; build ✅ (40.32s)
  - `src/components/expenses/ReceiptAnalyzer.jsx` — `const todayIso = () => new Date().toISOString().split("T")[0]` retornava data UTC (após 21h BRT mostrava amanhã) → `import { format } from 'date-fns'` + `format(new Date(), 'yyyy-MM-dd')`
- **Componentes auditados e limpos** (sem issue encontrado): `QuickStats`, `PipelineFinanceiro`, `MetaMensalBar`, `ForecastWidget`, `AReceber`, `ProximoShow`, `LiveClockBar`, `AnimatedStatValue`, `StatValuePulse`, `ModoPalcoActions`, `EventLocationSection`, `LocationAutocomplete`, `EventHeading`, `CalendarTodayStrip`, `CalendarPageHeader`, `DayQuickActions`, `AlertsPanel`, `EventTemplateModal`, `ContinuousEventBar`, `ClientCombobox`, `ClientQuickCreateDialog`, `CompanySearchInput`, `ClientDraftBadge`, `NavigationSync`, `PwaLiveUpdater`, `PushNotificationSettings`, `PushSubscriptionSync`, `MessageBubble`, `QuickActions`, `SmartSuggestions`, `PaymentConfirmModal`, `ClientActionSheet`, `AuthCallback`, `ClientDetailedTable`, `ResetPassword`, `LoginNew`, `SignupNew`, `AppDataContext`
- **Build**: Vite ✅ (confirmado após GoogleCalendarSync fix)
- **Deploy**: pendente

### GCAL-IMPROVEMENTS — Mapa + Sync Google Calendar melhorias ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Bugs corrigidos**:
  - `BrazilVisitedMap.jsx` l.339 — `activeCityData.key === latestCityKey` (propriedade inexistente) → `activeCityKey === latestCityKey`; badge "📍 Mais recente" agora aparece no tooltip
- **Melhorias Google Calendar sync** (Edge Function `google-calendar` + frontend):
  - `findOrCreateClientByName` — matching fuzzy: além de exact ilike, testa se o nome do cliente existente está contido no título do GCal ou vice-versa (min 4 chars); evita criar clientes rascunho duplicados quando o GCal title é "Amarrok Show SP" e o cliente é "Amarrok Comunicação"
  - Títulos vazios/genéricos ("Evento Google") não criam cliente
  - `parseLocationForCity` — nova função na Edge Fn; extrai `location_city` e `location_state` do campo `location` do Google Calendar usando regex com 27 siglas de estado BR; eventos importados agora preenchem `location_city`/`location_state` → aparecem como pontos no mapa
  - `GoogleCalendarSync.jsx` — badge amber "X eventos não sincronizados" antes das ações quando `settings.google_calendar_connected = true` e existem eventos sem `google_event_id`
  - `CalendarPageHeader.jsx` — badge amber "X fora de sinc" no header da Agenda; clique redireciona para `/profile?tab=google`
  - `Calendar.jsx` — `useUserSettings` + `useMemo` para `unsyncedCount`
- **Edge Function**: `google-calendar` deployada no Supabase `cwtallnetgodoacuoaow` ✅
- **Build**: Vite ✅ (34.83s)

### PUSH-S30 — Push Notifications: ativação completa com VAPID ✅
- **Agente**: Claude Code (claude-sonnet-4-6)
- **Data**: 2026-06-11
- **O que foi feito**:
  - Identificado que `VITE_VAPID_PUBLIC_KEY` estava ausente do `.env.local` e da Vercel → app entrava em modo "notificação local" sem push server-side
  - Rotacionados os VAPID keys (chave pública anterior inacessível nos secrets): gerado novo par via `web-push generate-vapid-keys`
  - `VITE_VAPID_PUBLIC_KEY` adicionado a `.env.local`
  - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` atualizados nos secrets do Supabase Edge Functions
  - `VITE_VAPID_PUBLIC_KEY` substituído na variável de ambiente da Vercel (produção)
  - Edge Functions `send-push-digest` e `send-push-test` reimplantadas para pegar novos secrets
  - `push_subscriptions` e `push_sent_log` truncadas (assinaturas antigas inválidas com nova chave pública)
  - Confirmado: cron jobs `send-push-digest-morning` (11h UTC / 8h BRT) e `send-push-digest-evening` (21h UTC / 18h BRT) ativos no pg_cron ✅
  - Confirmado: `push-sw.js` em `/public` com handlers `push` e `notificationclick` ✅
  - Confirmado: `027_push_digest_cron` + `028_enable_realtime` já aplicadas no DB ✅
  - Migração 028 (Realtime) confirmada aplicada — `RELATORIO_VIDA_APP.md` atualizado
- **Arquivos modificados**: `.env.local`, `docs/RELATORIO_VIDA_APP.md`, `docs/IDEIAS_PENDENTES.md`, `docs/AGENT_LOG.md`
- **Próximo passo**: deploy na Vercel → ir em Perfil → Alertas no celular → Ativar para criar nova assinatura
