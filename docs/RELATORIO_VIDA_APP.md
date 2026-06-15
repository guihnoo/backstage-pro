# Relatório de Vida — Backstage Pro

> Documento vivo para Cursor, Claude Code e humanos.  
> **Atualize este arquivo a cada sessão significativa** (feature, fix, deploy, decisão de arquitetura).

**Última atualização:** 2026-06-15 (sessões S88–S94 — Claude Code)  
**Produção:** https://backstage-pro-beta.vercel.app  
**Último deploy:** 2026-06-15 — deploy em andamento (commit semântico S90-S94)  
**Edge Functions:** `ai-chat` + `analyze-receipt` + `google-calendar` (dedupe refatorado) deployadas no Supabase ✅  
**Smoke E2E:** 28/28 passando (`npm run test:e2e:smoke`)  
**Supabase ref:** `cwtallnetgodoacuoaow`

---

## Estado atual (resumo)

| Área | Status |
|------|--------|
| Core (eventos, clientes, despesas, horas) | Funcional |
| Clientes — Empresa vs Pessoa | `client_type` coluna DB; toggle visual em form/combobox/cards/modais ✅ sessão 20–22 |
| Google Calendar OAuth + sync | UI + dedupe + smoke E2E mock ✅; **OAuth real pendente** (GCP Testing → Production + reconectar no Perfil) |
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
| CRM automatizado (S32) | Painel "Próximos Passos" em `EventDetailModal` para eventos concluídos: checklist horas (12h auto / manual) + pagamento (marcar pago / WhatsApp cobrança); badge "Evento fechado 🎉" quando tudo ok; remove botão redundante do footer |
| Alertas CRM proativos (S32) | `AlertsPanel`: 2 novas regras — "Horas pendentes" (eventos últimos 14 dias sem horas) + "Pagamentos vencidos" (payment_due_date passado + unpaid); botão "Ver evento" abre `EventDetailModal` via `onOpenEvent` prop |
| IA Mentor polish (S33) | `TypingDots` component: 3 pontos animados Framer Motion substituem spinner+texto; `CATEGORY_HINTS` map: empty state hint dinâmico por categoria (audio/lighting/photo/video/dj/…) usando `profile.category` |
| Manual do usuário (S33) | `docs/MANUAL_USUARIO.md` + rota `/help` in-app (`AppHelp.jsx` + `userManualContent.js`); link no Perfil → "Abrir manual do app" |
| Fix CRM WhatsApp (S33) | `handleChargeWhatsApp` no `EventDetailModal` — usa `buildChargeMessage` profissional em vez de lista genérica de detalhes do evento (`6949f70`) |
| Projeção detalhada (S33) | `Reports.jsx` (`2f0cae9`): Dialog "Projeção do Próximo Período" — lista eventos agendados com valor, data, cliente; clique abre EventDetailModal |
| Histórico mensal metas (S33) | `Goals.jsx` (`2c660e2`): grid 2×2 na aba Metas mostrando receita paga + barra de progresso vs meta dos últimos 4 meses |

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
| Toasts | `z-[100]`+ | Sonner |

**Regra:** nunca usar `z-50` em cards/sheets customizados — conflitava com dialogs e com a nav.

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

### Fluxo E2E no app (15 min)

1. Abrir https://backstage-pro-beta.vercel.app/profile (logado)
2. Rolar até **Sincronização com Google Calendar** → **Conectar ao Google**
3. Autorizar no Google (aceitar escopos de calendário + e-mail)
4. Esperar redirect para `/profile?google_connected=1` + toast verde
5. Confirmar badge **Conectado** + e-mail Google visível
6. **Sincronizar Agora** — toast com contadores (importados / vinculados / enviados)
7. **Importar Eventos** — confirmação → toast de sucesso
8. Se houver duplicatas pós-import: **Limpar duplicatas da agenda** → confirmar → toast com `N duplicata(s) removida(s)`
9. Na **Agenda**, verificar badge âmbar “eventos não sincronizados” some após sync
10. **Desconectar** → status **Desconectado**; reconectar deve funcionar sem `missing_refresh_token`

### Erros comuns → mensagem no app

| Sintoma | Causa provável | Fix |
|---------|----------------|-----|
| `invalid_client` | Secrets ausentes no Supabase | Passo A |
| `redirect_uri_mismatch` | URI errada no GCP | Passo C |
| `unauthorized_client` / `access_denied` | App em Testing sem testador | Passo D |
| `missing_refresh_token` | Reconexão sem revogar antes | Desconectar, aguardar 10s, conectar de novo |
| 400 "não conectado" em list-calendars | Token expirado / desconectado | Reconectar no Perfil |

### Automação existente

- Smoke mock: `e2e/smoke/google-calendar-sync.spec.js` (UI conectada + dedupe)
- Unit dedupe: `src/lib/googleEventDedupe.test.js` (4 casos)

---

## Changelog

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

### Média
6. Animações financeiras / charts animados no dashboard (`vendor-charts` já bundlado)
7. PWA offline refinado + pre-fetch crítico
8. Code-split seguro para `vendor-charts` (~421 KB) — `vite.config.js` LOCKED
9. ~~Expandir smoke E2E~~ — ✅ 46 testes (smoke + regression overflow + modal)

### Baixa / segurança
10. **Rotacionar `GOOGLE_CLIENT_SECRET`** (exposto em sessões passadas)
11. Publicar app OAuth (sair de “Testing”) quando E2E validado
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
