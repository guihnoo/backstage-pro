# Relatório de Vida — Backstage Pro

> Documento vivo para Cursor, Claude Code e humanos.  
> **Atualize este arquivo a cada sessão significativa** (feature, fix, deploy, decisão de arquitetura).

**Última atualização:** 2026-06-11 (sessão S29)  
**Produção:** https://backstage-pro-beta.vercel.app  
**Último commit:** pendente nesta sessão — deploy testes reais  
**Último deploy:** 2026-06-10 — `dpl_CSCrk4jRwwdQwJaVUjAy7ie7wBiX` → https://backstage-pro-beta.vercel.app  
**Edge Functions:** `ai-chat` + `analyze-receipt` deployadas no Supabase ✅  
**Supabase ref:** `cwtallnetgodoacuoaow`

---

## Estado atual (resumo)

| Área | Status |
|------|--------|
| Core (eventos, clientes, despesas, horas) | Funcional |
| Clientes — Empresa vs Pessoa | `client_type` coluna DB; toggle visual em form/combobox/cards/modais ✅ sessão 20–22 |
| Google Calendar OAuth + sync | Configurado (modo Teste no GCP); validar E2E com usuário |
| UX cores / hierarquia empresa | Implementado (`brandColors`, `EventHeading`) |
| Combobox cliente + geocode local | Implementado; criar Pessoa inline ✅ |
| Local do evento (endereço + GPS check-in) | `EventLocationSection` — criar, detalhe, action sheet |
| Páginas legais OAuth | `/privacidade`, `/termos` |
| Scroll / modais / z-index | Corrigido (v1–v3); popovers/select `z-[110]` dentro de dialogs |
| Badge rascunho (clientes) | Cards + modal detalhe + filtro **Rascunhos** |
| OAuth Google callback | Redirect `/profile?google_connected=1`; toast ao detectar query |
| Mapa Brasil (relatórios) | SVG interativo `@svg-maps/brazil`, lazy load + chunk dedicado |
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
| Realtime sync multi-device | `RealtimeSyncProvider` + `realtimeBus` + `useRealtimeRefetch` — todos os hooks integrados; migração `028_enable_realtime.sql` criada (pendente `supabase db push`) |
| Classes Tailwind dinâmicas | Corrigidas em S27: `FinancialSummary`, `CategoryPicker`, `ClientDetailModal` — mapas estáticos substituem interpolação `bg-${color}-X` |
| Lapidação S28 | Auditoria completa: 10 componentes auditados, typo `PaymentConfirmModal` corrigido; todos componentes restantes confirmados limpos |
| Lapidação S29 | 38 componentes auditados; `GoogleCalendarSync` 3× `window.confirm()` → `ConfirmDialog`; `ReceiptAnalyzer` timezone bug (`toISOString` → `format`) |

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

## Changelog

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

**Checklist OAuth E2E (manual):**
1. Perfil → Conectar ao Google → autorizar → redirect `/profile?google_connected=1` + toast verde
2. Badge **Conectado** + e-mail Google visível
3. **Sincronizar Agora** / **Importar Eventos** sem erro 401
4. **Limpar duplicatas da agenda** (se houver dupes pós-import)
5. Desconectar → status **Desconectado**

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
