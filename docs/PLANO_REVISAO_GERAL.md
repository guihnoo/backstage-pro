# Plano de Revisão Geral — Backstage Pro

> Segundo eixo de auditoria: **clareza de produto e completude funcional**.
> A auditoria técnica (scroll/z-index/mobile) já está madura em `AUDITORIA_PAGINAS.md`.
> Este documento ataca: "isso funciona de verdade no meu dia a dia?" e "por que tem tanta coisa na tela?".

**Criado:** 2026-08-28 (Claude Code)
**Status:** 🔄 Trilha A em andamento — Home ✅ · **Agenda ✅ (2026-08-28)** · demais telas ⬜
**Prioridade P0 atual:** inconsistência de números Home × Metas × Relatórios (matriz abaixo)

---

## Fase 0 — Calibração (respostas do usuário, 2026-08-28)

| Pergunta | Resposta |
|---|---|
| Telas mais usadas | **Todas** — Agenda, Home, Relatórios, Metas |
| Telas onde se sente perdido | **Todas** — Relatórios, EventDetailModal, Home, Metas |
| O que não funciona / funciona pela metade | Google Calendar · Offline/sync · **Números que não batem** entre telas · Notificações push |
| Perfil de uso | **Os dois igualmente** — ciclo completo agenda → show → cobrança → fechamento |

**Leitura:** não dá para priorizar "a tela mais dolorida" — todas pesam. O sinal mais forte é
**densidade de informação em todo o app** + **inconsistência de números entre telas**.
Portanto: passagem sistemática, tela a tela, com dois focos fixos em cada uma —
(1) o que colapsar/esconder, (2) os números batem com as outras telas?

---

## Divisão de trabalho — Claude Code × Cursor

O conflito real entre os dois agentes não é de ideias — é de **arquivos editados ao mesmo tempo**
e de **backup git automático sobrescrevendo trabalho em andamento**.

| | Claude Code | Cursor |
|---|---|---|
| **Papel** | Diagnóstico, auditoria, navegar o app de verdade (browser/CDP), montar a lista de problemas, escrever specs de correção | Implementação: editar componentes, refatorar, aplicar os fixes |
| **Escreve em** | Só `docs/**` + `e2e/**` (quando o teste é diagnóstico) | `src/**` |
| **Não toca** | `src/**` durante uma rodada de auditoria | `docs/PLANO_REVISAO_GERAL.md` enquanto Claude está auditando aquela seção |
| **Git backup** | Não roda `git:backup` em sessão de auditoria pura; usa `.cursor/PAUSE_AUTO_GIT` | Dono do `git:backup` ao fim das sessões de código |
| **AGENT_LOG** | Append, assina "Claude Code" | Append, assina "Cursor" |

### Handoff (ciclo por tela)

1. **Claude audita** uma tela → preenche a tabela de itens abaixo com status `✅ 🔧 🌀 📦 ❌`.
   Para cada `🔧`/`🌀`, escreve uma linha de spec: *o que muda · arquivo · resultado esperado*.
2. **Usuário passa a seção ao Cursor.** Cursor implementa, marca `[x]` na coluna "Feito", commita.
3. **Claude re-audita** só os itens marcados feitos → atualiza `AUDITORIA_PAGINAS.md` e o status aqui.

### Regras anti-colisão

- Uma tela por vez. Nunca Claude auditando Home enquanto Cursor edita Home.
- Enquanto Cursor está num arquivo `src/`, Claude fica em modo leitura/browser.
- `.cursor/PAUSE_AUTO_GIT` ligado durante auditoria pura (sem mudança de código).
- Deploy Vercel só com pedido explícito do usuário (regra do `CLAUDE.md` mantida).

---

## Trilhas (rodam em paralelo)

- **Trilha A — Inventário & clareza** (Claude) — tela a tela, tabela de itens + o que colapsar.
- **Trilha B — Correções** (Cursor) — pega os `🔧` da Trilha A por ordem de dor.
- **Trilha C — Integrações "quase funciona"** (Usuário + Claude) — checklist manual em produção.

---

## Legenda de status por item

| Símbolo | Significado | Ação |
|---|---|---|
| ✅ | Funciona + claro + uso frequente | Manter |
| 🔧 | Quebrado ou incompleto | Corrigir (spec para Cursor) |
| 🌀 | Funciona mas confuso | Simplificar / esconder atrás de "ver mais" |
| 📦 | Funciona mas raro | Mover para overflow / colapsar por padrão |
| ❌ | Redundante | Remover ou fundir com outro item |

---

## Trilha A — Inventário tela a tela

Ordem (ciclo completo de uso, não por "dor"):

1. Home
2. Agenda + EventForm
3. EventDetailModal (calendar + reports) — o mais denso
4. Relatórios
5. Metas
6. Clientes + ClientDetailModal
7. Despesas
8. Perfil + IA Mentor

### 1. Home `/` — 🔄 auditada 2026-08-28 (Claude Code, via código)

Estrutura: Header → Bloco **Palco** (ProximoShow + AlertasBastidao) → Bloco **Financeiro**
(AReceber + QuickStats + MetaMensalBar + PipelineFinanceiro + ForecastWidget) → Bloco **Agenda** (ProximosEventos) → FAB.

**Leitura geral:** o Bloco Financeiro concentra ~5 widgets que repetem os mesmos 3 números
("recebido", "a receber", "% da meta") com nomes diferentes. É a maior fonte de "coisa demais na tela".

| # | Item | Func. | Claro | Uso | Status | Spec de correção (para Cursor) |
|---|---|---|---|---|---|---|
| H1 | Header: LiveClockBar + label categoria + saudação | ✅ | ✅ | alto | ✅ | Manter |
| H2 | Header: frase motivacional (`getCategoryMotivation`, itálico mono) | ✅ | 🌀 | nenhum | 📦 | Decorativo, rouba atenção no topo. Remover, ou mover para um lugar discreto / mostrar só no empty state |
| H3 | `ProximoShow` — card do próximo evento | ✅ | 🌀 | alto | 🌀 | Card muito alto: emoji+badges+heading+"ver cliente"+grid 4 células+ModoPalco+GPS+countdown grande+data+descrição 4 linhas+3 botões. Enxugar para modo "glance": heading + data/hora + local + cachê + 1 CTA. Countdown grande e descrição só quando `isToday`/`isOnStage` |
| H4 | `ProximoShow` empty state "Palco Limpo" | ✅ | ✅ | — | ✅ | Manter |
| H5 | `pickProximoEvento` só considera `status ∈ {pending, confirmed}` | 🔧 | — | alto | 🔧 | Evento `scheduled` nunca vira "Próximo Show" (some da Home), mas o botão "Confirmar" do card trata `pending\|scheduled`. Incluir `scheduled` no filtro de `pickProximoEvento` (`useHomeDashboard.js:88` e `:98`) |
| H6 | `AlertasBastidao` — pagamentos atrasados/pendentes | ✅ | 🌀 | médio | 🌀 | Sobrepõe `AReceber` (mesmos clientes/valores). Nome "Bastidão" confunde. Fundir com `AReceber` OU reduzir a um resumo de 1 linha ("2 pagamentos atrasados →") |
| H7 | `AReceber` — total pendente + até 6 clientes, cada um expansível + painel pagar inline | ✅ | 🌀 | alto | 🌀 | Bom conteúdo, densidade alta. Colapsar lista por padrão (só total + "ver N clientes"); painel de confirmação de valor inline pode virar passo único |
| H8 | `AReceber` "Cobrar" sem telefone → toast + `hardNavigate('/clients')` | 🔧 | 🔧 | médio | 🔧 | Navegação abrupta pra fora da Home. Trocar por abrir modal/sheet de edição do cliente, ou link "Adicionar telefone" no próprio row |
| H9 | `QuickStats` — 2 cards (Horas no Mês → /reports, Diárias no Mês → /goals) | ✅ | ✅ | médio | 📦 | Destinos inconsistentes para stats parecidas. Ambas poderiam ir para /reports ou /goals. Considerar fundir na MetaMensalBar |
| H10 | `MetaMensalBar` — faturamento + diárias vs meta + ritmo do mês + projeção | ✅ | 🌀 | alto | 🌀 | Bom, mas "projeção" e "% do mês" duplicam o ForecastWidget. Manter como o único lugar de "meta vs realizado" na Home |
| H11 | `MetaMensalBar` empty state "Defina sua meta" | ✅ | ✅ | — | ✅ | Manter |
| H12 | `PipelineFinanceiro` "Dinheiro nos Trilhos" — barra + Recebido/A Receber + Total Pipeline (3xl) + Despesas + Resultado | ✅ | 🌀 | baixo | ❌ | Repete Recebido (=MetaMensalBar) e A Receber (=AReceber card). "Total Pipeline" em 3xl é o número mais destacado da tela e é o menos acionável. Remover da Home; mover "Resultado líquido do mês" (único dado novo) para dentro da MetaMensalBar ou QuickStats |
| H13 | `ForecastWidget` "Próximos 30 dias" — receita projetada + % da meta | ✅ | 🌀 | baixo | 📦 | "% da meta" duplica MetaMensalBar; "receita projetada" ≈ soma de ProximosEventos (Bloco Agenda logo abaixo). Colapsar em 1 linha dentro do Bloco Agenda: "Próximos 30 dias: N shows · R$ X" |
| H14 | `ProximosEventos` — até 6, agrupados Hoje/Amanhã/Semana, com Confirmar + Marcar pago inline | ✅ | ✅ | alto | ✅ | Manter. É o bloco mais útil e mais limpo |
| H15 | `FloatingActions` FAB — Novo evento / cliente / despesa | ✅ | ✅ | alto | ✅ | Manter |
| H16 | Nomenclatura: "A receber"/"A Receber"/"Total pendente"/"Dinheiro nos Trilhos"/"Bastidão" | — | 🔧 | — | 🔧 | Padronizar rótulos: um conceito = um nome. Sugestão: "A receber", "Recebido no mês", "Meta do mês", "Agenda" |
| H17 | 5× links "Ver relatório"/"Ver agenda" no Bloco Financeiro | — | 🌀 | — | 📦 | Reduzir para 1 "Ver relatório completo" ao fim do bloco |

**Resumo da Home — proposta de simplificação (Trilha B):**
Bloco Financeiro passa de 5 widgets para 3: **A receber** (colapsado) · **Meta do mês** (com resultado líquido embutido) · **Agenda / próximos 30 dias**.
Remover: PipelineFinanceiro (H12), frase motivacional (H2). Colapsar: ForecastWidget→linha (H13), AlertasBastidao→resumo (H6).

**Bugs para corrigir já (Trilha B, prioridade):**
- H5 — `scheduled` some da Home
- H8 — "Cobrar" sem telefone joga pra fora da Home
- **NÚMEROS — competência de "Recebido" diferente entre Home e Metas** (ver matriz abaixo)

### 2. Agenda `/calendar` — ✅ auditada 2026-08-28 (Claude Code, via código)

Auditoria completa (READ-ONLY, sem alteração de `src/`) na seção dedicada
**[Auditoria — Agenda](#auditoria--agenda-calendar)** mais abaixo. Resumo: 12 partes, ~55 itens,
ranking P0–P3, tabela de handoff para o Cursor.

### 3. EventDetailModal — 🔄 parcial (coberto na Auditoria — Agenda; falta ClientDetail/Goals)

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

### 4. Relatórios `/reports` — ⬜

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

### 5. Metas `/goals` — ⬜

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

### 6. Clientes `/clients` — ⬜

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

### 7. Despesas `/expenses` — ⬜

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

### 8. Perfil + IA Mentor — ⬜

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

---

## Auditoria — Agenda `/calendar`

> **READ-ONLY.** Concluída 2026-08-28 (Claude Code, via leitura de código — sem browser).
> Arquivos lidos: `pages/Calendar.jsx` (2109 linhas), `EventForm.jsx`, `components/reports/EventDetailModal.jsx`,
> `components/calendar/EventDetailModal.jsx` (parcial), `CalendarPageHeader.jsx`, `BackstageCalendarGrid.jsx` (parcial),
> `DayQuickActions.jsx`, `AlertsPanel.jsx`, `CalendarTodayStrip.jsx` (via prop), `mobile/EventActionSheet.jsx`,
> `DailyWorkModal.jsx`, `ClientCombobox.jsx`, `ClientQuickCreateDialog.jsx`, `lib/useEvents.js`,
> `lib/eventFinance.js`, `lib/dateUtils.jsx`, `lib/useBackstageData.js`.
> Nada em `src/**` foi alterado.

Legenda de ação por item: **MANTER · MELHORAR · SIMPLIFICAR · CORRIGIR · INVESTIGAR · POSSÍVEL REMOÇÃO**
(“POSSÍVEL REMOÇÃO” = candidato a discussão, **não autoriza remover nada**).

### 1. Inventário funcional (item a item)

| # | Item | O que é / faz hoje | Ação | Nota |
|---|---|---|---|---|
| A1 | **CalendarPageHeader** — título "Agenda" + subtítulo | Texto fixo | MANTER | — |
| A2 | Badge "N fora de sinc" (Google) | Só aparece se `google_calendar_connected`; leva a `/profile?tab=google` | MANTER | Depende do OAuth real (Trilha C) |
| A3 | LiveClockBar no header | Relógio ao vivo + "AO VIVO" quando turno aberto | MANTER | Também aparece em Relatórios, Metas, Home — 4 telas |
| A4 | Navegação de mês `‹ M ›` + botão "Hoje" | `subMonths`/`addMonths` + `closeModals()` a cada troca | MANTER | Só afeta a vista **grid** e **week**; nas vistas upcoming/list/kanban o `‹ ›` continua visível mas **não faz nada perceptível** |
| A5 | Botão "Registrar Horas" (header) | `handleQuickWorkEntry()` → hoje → se sem evento hoje, toast com CTA "Criar Evento" | MELHORAR | Duplicado: existe também no `CalendarTodayStrip`, em `AlertsPanel`, e no menu de dia |
| A6 | Botão "Novo Evento" (header) | Abre `EventForm` sem data | MANTER | — |
| A7 | Alerta "cadastre um cliente antes" | Só quando `clients.length === 0` | MANTER | — |
| A8 | Alerta de erro (eventsError) | Banner vermelho | MANTER | — |
| A9 | **AlertsPanel** — até ~9 cards de alerta empilhados | 8 regras: check-in, local, check-out 12h, show amanhã, até 3 "dias sem horas" + 1 resumo, horas pendentes 14d, pagamento vencido, follow-up | SIMPLIFICAR | Densidade alta no topo da página (ver §8). Cada card tem CTA + "Dispensar" + X (3 formas de dispensar) |
| A10 | **CalendarTodayStrip** | Faixa com shows de hoje + CTA registrar horas / novo evento | MANTER | Redundante com o card "Hoje" da vista upcoming e com AlertsPanel |
| A11 | **4 StatCards**: Eventos / Dias / Horas / Receita | Clicáveis → `DrilldownModal` com lista | MELHORAR | "Receita" = "estimada no mês" (5ª definição de receita no app — ver P0). Drilldowns usam `daily_work.date` cru (N4) |
| A12 | Campo de busca | Filtra título / cliente / local em tempo real | MANTER | Só mostra resultados em lista **na vista grid** (`viewMode === 'grid'`) — nas outras a busca filtra mas não há lista de resultados |
| A13 | **Chips de filtro de status**: Todos · Pendentes · Confirmados · Concluídos · Pagos | Conta por `event.status` cru (exceto "Pagos" = `payment_status`) | CORRIGIR | `scheduled`, `tentative`, `archived` **não têm chip** → ao filtrar "Pendentes" um evento `scheduled` **some** (ver §11). Contagens divergem dos badges (que usam `getEventStatus`) |
| A14 | **Toggle de vistas**: Grid + Upcoming (Zap) + `···` (Semanal / Lista / Kanban) | `localStorage['backstage:calendar-view-mode']` | MELHORAR | 5 vistas para uma agenda pessoal. Upcoming e Lista têm ~90% de overlap. Kanban tem outro público (negociação) |
| A15 | 3 ícones soltos: Calculadora de cachê · Compartilhar disponibilidade · Exportar ICS | Cada um abre modal/ação | POSSÍVEL REMOÇÃO | Toolbar lotada em mobile (`flex-wrap` → 2ª/3ª linha). Calculadora e Disponibilidade são de uso raro; ICS idem. Candidatos a menu `···` |
| A16 | **Vista Grid** (`BackstageCalendarGrid`) | ARIA grid completo, roving tabindex, setas do teclado (S138); dots coloridos (máx 4/dia) + "+N"; barras multi-dia com lanes | MANTER | Ver A17 |
| A17 | Dia do grid com **vários eventos** | Clicar num evento abre o **primeiro** (`events?.[0]`); clicar no dia abre `DayQuickActions` (só "Evento"/"Horas") | CORRIGIR | Não há como abrir o 2º/3º evento de um dia cheio a partir do grid. `multipleEventsModal` só existe para *registrar horas*, não para *ver* |
| A18 | **Vista Semana** | 7 colunas scroll-x (`min-w-[560px]`); cabeçalho do dia clicável (+); banner "Hoje"; resumo semanal | MANTER | Eventos multi-dia aparecem só no `start_date` (não nos dias intermediários) — conhecido desde S160 |
| A19 | **Vista Próximos Shows** (upcoming) | Lista agrupada Hoje/Amanhã/Esta semana/... a partir de hoje, **sem filtro de status** | MANTER | É a vista mais limpa e útil. Não passa pelos chips de filtro (`activeEvents` direto) |
| A20 | **Vista Lista** | Eventos por mês; badge via `getEventStatus`; botão quick-pay | MELHORAR | `canQuickPay` tem branch morto (`getEventStatus` nunca retorna `'confirmed'`) |
| A21 | **Vista Kanban** (lazy) | 4 colunas Negociando/Confirmado/A Receber/Pago; filtro de período próprio | MANTER | Público diferente das outras vistas |
| A22 | **DrilldownModal** (StatCard → lista) | Lista de eventos/dias/horas do mês | MANTER | — |
| A23 | **DayQuickActions** (popover desktop) | 2 botões: Evento / Horas | MANTER | Ancoragem por `offsetTop/offsetLeft` absoluto pode desalinhar em scroll (mobile) |
| A24 | **EventForm** (criar/editar) | Ver §1 detalhado abaixo | MELHORAR | Horários escondidos em evento novo mas gravados 09:00–18:00 silenciosamente (§ Riscos) |
| A25 | **Criar cliente durante o evento** (`ClientCombobox` → `ClientQuickCreateDialog`) | Digitar nome → "Criar X" → dialog aninhado (Empresa/Pessoa) → volta com cliente selecionado | MANTER | ~5–7 toques; funciona. `showCreate` pode sumir se um nome de empresa compartilhada bate com o digitado |
| A26 | **EventDetailModal** — Calendar usa `components/reports/EventDetailModal` | 3 abas (Resumo/Trabalho/Fiscal) + LifecycleBar + footer 1 CTA + `···` | CORRIGIR | **Modal diferente do da Home** (ver §5/§6). Sem CTA "Confirmar evento", sem painel CRM "Próximos Passos" |
| A27 | **EventActionSheet** (mobile) | Bottom sheet com **até 11 botões** full-height | SIMPLIFICAR | Caminho primário no mobile. "Ver Detalhes" abre ainda outro modal fullscreen → 2 camadas |
| A28 | **DailyWorkModal** (desktop) / **EventHoursSheet** (mobile) / **Aplicar 12h** / **FloatingTimer** | 4 caminhos para lançar trabalho | MELHORAR | Ver §1 (horas) |
| A29 | **CacheCalculator** (modal) | dias × cachê × modelo + extras; "Copiar" / "Criar Evento" | MANTER | Uso raro; candidato a mover para `···` |
| A30 | **AvailabilityShareModal** | Lista dias livres/ocupados do mês → WhatsApp/clipboard | MANTER | Uso raro |
| A31 | **Exportar ICS** | Gera `.ics` dos `filteredEvents` | MANTER | Uso raro |
| A32 | Swipe left/right (touch) | Navega mês (grid) ou semana (week) | MANTER | Só grid/week |
| A33 | Empty states (upcoming "Agenda limpa", list "Nenhum evento encontrado") | Ícone + CTA "Criar evento" | MANTER | Bom |
| A34 | Loading (`CalendarSkeleton`) | Skeleton estruturado; carregamento progressivo (S184) | MANTER | Bom |
| A35 | Error state | Bloqueia só se `!offline && sem cache` | MANTER | Bom (S184) |
| A36 | Offline / sync | `useConnectivity`; carregamento não trava offline; alias de hooks p/ fila IDB | INVESTIGAR | Ver §9 |

### 2. Mapa de componentes (o que a Agenda carrega)

```
CalendarPage (pages/Calendar.jsx)
├── hooks: useEvents (CRUD, select '*', SEM join cliente) · useClients · useDailyWork · useExpenses
│         useUserSettings · useConnectivity · useQueryAction · useMediaQuery(local)
├── enrichEventsWithClients(events, clients)   ← recompõe o join que useEvents não faz
├── CalendarPageHeader ── LiveClockBar
├── AlertsPanel ── fetchPendingFollowUps · getEventStatus · getEventsForDate/getWorkForDate
├── CalendarTodayStrip (EventHeading, getEventCacheAmount)
├── 4× StatCard → DrilldownModal
├── viewMode:
│   ├── grid  → BackstageCalendarGrid (ARIA grid, EventLanesOverlay, DayCell, dots)
│   ├── week  → markup inline (7 col)
│   ├── upcoming → markup inline (grupos)
│   ├── list  → markup inline (grupos por mês)
│   └── kanban → KanbanPipeline (lazy)
├── DayQuickActions (popover)
├── CacheCalculator (lazy) · AvailabilityShareModal (lazy)
├── EventForm ── ClientCombobox ── ClientQuickCreateDialog ── CompanySearchInput
│            └── EventLocationSection · EventTemplateModal (via @/api/entities EventTemplate)
├── DailyWorkModal ── timerStore · useDailyWork
├── EventDetailModal (components/reports/) ── NFeAttachment · PaymentConfirmModal · EventLocationSection
├── ExpenseForm
├── multipleEventsModal (markup inline)
├── EventActionSheet (mobile) · EventHoursSheet (mobile) · NotesSheet (mobile)
└── 2× ConfirmDialog (excluir evento / excluir horas)
```

Contagem: **~22 componentes/modais** ligados direta ou indiretamente à Agenda.

### 3. Jornadas (dentro da Agenda)

| Jornada | Passos hoje | Fricção |
|---|---|---|
| **Criar evento rápido** | Header "Novo Evento" → EventForm (cliente + data obrigatórios) → Criar | Baixa se já tem cliente. Times 09:00–18:00 entram sem o usuário ver o campo |
| **Criar evento com cliente novo** | EventForm → combobox → digitar → "Criar X" → dialog (Empresa/Pessoa, opcional busca Receita) → Criar → volta → preencher resto → Criar | ~5–7 toques + 2 dialogs aninhados. Funciona, mas é o ponto mais pesado |
| **Registrar horas de hoje** | 3 pontos de entrada (header / TodayStrip / AlertsPanel) → se 1 evento: DailyWorkModal já preenchido 09:00–18:00 → Salvar. Se vários eventos no dia: `multipleEventsModal` para escolher | Média. Precisa entrar/saída mesmo para cachê fixo. "Aplicar 12h" é atalho separado |
| **Confirmar um evento (pending→confirmed)** | **Não é possível pela Agenda** — nem no EventDetailModal (reports), nem no ActionSheet, nem no EventForm (sem seletor de status) | **Bloqueio.** Só dá para confirmar via widgets da Home |
| **Marcar realizado** | EventDetailModal → CTA "Marcar Realizado" (só se passado + status scheduled/confirmed) | OK |
| **Marcar pago** | EventDetailModal → "Confirmar Recebimento" (PaymentConfirmModal) · ou ActionSheet "Marcar como Pago" · ou quick-pay na vista Lista | Vários caminhos; o rápido não grava `paid_amount` (P0/N2) |
| **Abrir 2º evento de um dia cheio (grid)** | Não há caminho direto — precisa ir para vista Semana/Lista | Fricção |
| **Emitir NF-e** | EventDetailModal aba Fiscal (só após "realizado") → card com dados → "Emitir NF-e" abre `nfse.gov.br` | OK; mas `nf_number` (EventForm) e `nfe_numero` (NFeAttachment) são campos paralelos |

### 4. Problemas encontrados (bugs / comportamento errado)

| # | Problema | Arquivo | Evidência |
|---|---|---|---|
| P-1 | **Eventos `scheduled` somem dos filtros e do "Próximo Show"** | `Calendar.jsx:1272-1277` (chips) · `useHomeDashboard.js` `pickProximoEvento` · `useBackstageData.js:147,163` `useUpcomingEvent` | Chips só contam `pending/confirmed/completed`; `pickProximoEvento`/`useUpcomingEvent` filtram `in ['pending','confirmed']`. `EventForm` grava `pending` em evento novo, mas import/seed/duplicação podem gerar `scheduled` |
| P-2 | **Não há como confirmar um evento pela Agenda** | `components/reports/EventDetailModal.jsx` (usado por Calendar) — `primaryCTA` não tem branch para `pending→confirmed`; `EventActionSheet` idem; `EventForm` sem seletor de status | `components/calendar/EventDetailModal.jsx` (usado pela Home) **tem** `confirmEvent` via `useStatusToggle` — a Agenda usa o outro |
| P-3 | **Dois `EventDetailModal` com features diferentes** | Home/Goals → `calendar/EventDetailModal` (Confirmar evento + CRM "Próximos Passos" + `onMarkPaid` direto) · Calendar/Reports/ClientDetail → `reports/EventDetailModal` (star rating + NFeAttachment card + PaymentConfirmModal, **sem** Confirmar/CRM) | O mesmo "clicar num evento" abre modais diferentes conforme a tela de origem |
| P-4 | **StatCard "Receita" e `monthStats.received/pending`** | `Calendar.jsx:872-955` | 3 definições de receita só na Agenda (`totalRevenue` "estimada", `received`, `pending`); `received`/`pending` passados a `CalendarPageHeader` que **não os usa** (props mortas) |
| P-5 | **Chip de status vs badge de status discordam** | `Calendar.jsx` chips (cru) vs vista Lista badge (`getEventStatus`) | Evento passado `status='confirmed'`: chip "Confirmados" conta; badge mostra "Concluído" |
| P-6 | **`getEventStatusConfig` não tem `icon`** mas `EventActionSheet` faz `StatusIcon = statusConfig.icon` | `dateUtils.jsx:207-243` · `EventActionSheet.jsx:65` | `StatusIcon` sempre `undefined` → ícone do badge nunca renderiza (silencioso) |
| P-7 | **`canQuickPay` branch morto** | `Calendar.jsx:1714` | `(evStatus === 'completed' \|\| evStatus === 'confirmed')` — `getEventStatus` nunca retorna `'confirmed'` |
| P-8 | **Projeção do modal de Reports filtra `\|\| 'confirmed'`** que nunca ocorre | `Reports.jsx:1404` | idem P-7 |
| P-9 | **"Registrar entrada" (AlertsPanel) dispara para evento cancelado hoje** | `AlertsPanel.jsx:61` usa `getEventsForDate` (não filtra status) | Regra `checkin_suggestion` conta cancelados |
| P-10 | **`executeAction` (AlertsPanel) dispensa o alerta mesmo se o usuário cancelar o modal** | `AlertsPanel.jsx:327-332` | Ação + dismiss juntos; alerta não volta na sessão |
| P-11 | **Horários 09:00–18:00 gravados em todo evento novo sem o campo estar visível** | `EventForm.jsx:91,463` | Campo de horário oculto em evento novo; seed default `'09:00'/'18:00'`; payload envia. "Próximo Show" mostra "09:00" para eventos onde o usuário nunca digitou hora |
| P-12 | **`cache_valor_base` no payload/defaultState mas sem input** | `EventForm.jsx:44,97,297` | Modelo "Meio Cache e Dobra" (`DailyWorkModal.calculateCache`) depende de `cache_valor_base` que o usuário não consegue definir → cai em `baseValue` |
| P-13 | **`useEvents` (CRUD) não faz JOIN de cliente** | `useEvents.js:72` `select('*')` | Cada tela recompõe o cliente à mão (`enrichEventsWithClients`, `clientMap`); risco de "Sem empresa" onde faltar (histórico S156/S158) |
| P-14 | **`onMarkPaid` passado ao `reports/EventDetailModal` é prop morta** | `Calendar.jsx:1935` | `reports/EventDetailModal` não aceita `onMarkPaid`; usa `PaymentConfirmModal` interno |
| P-15 | **Nº de diárias filtra `daily_work.date` cru** | `Calendar.monthStats` · `useStats` · `useHomeDashboard` | Registro só com `work_date` preenchido não conta (N4) |
| P-16 | **Repetição de evento**: loop `await createEvent` N vezes, sem rollback em falha parcial | `EventForm.jsx:318-325` | Falha no 3º de 12 → 3 eventos + erro |

### 5. Redundâncias (informação/controle repetido)

| Onde | Repetição |
|---|---|
| "Registrar horas" | Header · CalendarTodayStrip · AlertsPanel (check-in) · DayQuickActions · EventDetailModal · EventActionSheet — **6 pontos** |
| "Novo evento" | Header · DayQuickActions · empty states (×2) · CacheCalculator ("Criar Evento") · FAB global — **6 pontos** |
| Shows de hoje | CalendarTodayStrip · AlertsPanel · vista upcoming (grupo "Hoje") · banner "Hoje" da vista Semana |
| Receita do mês | StatCard "Receita" · `monthStats.received`/`pending` (mortos) · também Home e Relatórios (P0) |
| Status do evento | chip de filtro (cru) · badge da lista (calculado) · ícone nos cards (cru) · LifecycleBar (calculado) |
| "Ver detalhes / editar" | ActionSheet tem "Ver Detalhes" **e** "Editar"; o modal aberto por "Ver Detalhes" também tem "Editar" no CTA e no `···` |
| NF | `nf_number`/`nf_issued_at` (EventForm, manual) **vs** `nfe_numero`/`nfe_arquivo_url`/`nfe_analise` (NFeAttachment, IA) — dois rastreios paralelos |
| 3 ícones da toolbar + `···` de vistas + 5 chips + 2 botões do header | tudo na mesma faixa → 2–3 linhas em mobile |

### 6. Inconsistências

| Tipo | Detalhe |
|---|---|
| **Status** | 2 sistemas (cru vs `getEventStatus`); chips usam um, badges outro; `pending/tentative/scheduled/confirmed` sem tratamento uniforme (P-1, P-5, P-6, P-7, P-8) |
| **Datas** | 3 colunas (`event_date` legada, `start_date`, `end_date`); `completed_at` não existe; competência financeira varia por tela (P0) |
| **Financeiras** | 5+ fórmulas de "receita" (P0 + P-4); `paid_amount` opcional gera divergência (N2) |
| **Modais** | 2 `EventDetailModal` divergentes (P-3); mobile = ActionSheet, desktop = modal, para a mesma ação |
| **Multi-dia** | grid mostra barra contínua; week/upcoming/list mostram só no `start_date`; `daily_work` permite qualquer dia do intervalo |
| **Cancelados** | `isCancelledEvent` cobre `'cancelled'` e `'cancelado'`; `getEventStatus` só `'cancelled'`; AlertsPanel check-in ignora status (P-9) |

### 7. Oportunidades de simplificação

1. **Toolbar da Agenda**: reduzir a linha de controles. Chips de status → dropdown "Filtrar"; 3 ícones soltos (Calc/Disponibilidade/ICS) → dentro do `···`; manter visíveis só Grid/Upcoming + busca.
2. **Vistas 5 → 3**: Grid + Próximos + Kanban. Fundir "Lista" em "Próximos" (Próximos já é uma lista agrupada); "Semana" vira zoom do Grid ou entra no `···`.
3. **AlertsPanel**: no máx. 2 cards visíveis + "ver mais (N)"; um card compacto por tipo; 1 só forma de dispensar.
4. **CalendarTodayStrip vs AlertsPanel vs card "Hoje"**: escolher 1 lugar para "o que é hoje".
5. **Header**: "Registrar Horas" só quando há evento hoje (senão o botão leva a um toast de erro).
6. **StatCards**: "Receita" da Agenda deveria ser a mesma métrica da Home (após P0); ou remover e deixar em Relatórios.
7. **EventDetailModal**: unificar os dois em um só componente com props de feature-flag.

### 8. Problemas mobile (específicos)

| # | Problema |
|---|---|
| M-1 | **Caminho primário = EventActionSheet com 11 botões**; ver detalhes exige 2ª camada de modal fullscreen |
| M-2 | Toolbar (`flex-wrap`) quebra em 2–3 linhas: 5 chips + toggle + 3 ícones |
| M-3 | Vista Semana e Grid exigem **scroll horizontal** (`min-w-[560px]` / `min-w-[320px]`) |
| M-4 | `DayQuickActions` ancora via `offsetTop/offsetLeft` absoluto — risco de desalinhar com o dedo após scroll |
| M-5 | `AlertsPanel` empurra o calendário para baixo da dobra num dia movimentado |
| M-6 | Não há como confirmar evento no mobile (P-2) nem abrir 2º evento de dia cheio no grid (A17) |
| M-7 | `isMobile = useMediaQuery('(max-width: 768px)')` decide o caminho — tablets em retrato (768–1024) usam o caminho desktop (modal), não o sheet |

### 9. Riscos técnicos

| # | Risco | Gravidade |
|---|---|---|
| T-1 | 4 implementações paralelas de "stats do mês" (P0/N7) — corrigir competência exige mexer em 4 lugares | Alta |
| T-2 | `useEvents` sem JOIN (P-13) — regressões recorrentes de "Sem empresa" (S156, S158) | Média |
| T-3 | `EventForm` usa `EventTemplate` de `@/api/entities` (camada de compat Base44) — verificar se persiste em `event_templates` real | Média (INVESTIGAR) |
| T-4 | Coluna legada `event_date` NOT NULL sincronizada manualmente — qualquer INSERT que não passe por `mapPayloadToDb` quebra | Média |
| T-5 | `backfillEventLocations` roda 1× no mount de `useEvents` e faz `update` silencioso — efeito colateral em toda carga da Agenda | Baixa |
| T-6 | Repetição de evento sem transação (P-16) | Baixa |
| T-7 | Offline: alias de `@/lib/useEvents` → wrapper offline (S181); `Calendar.jsx` importa `@/lib/useEvents` direto (linha 8) — confirmar que o alias do Vite realmente intercepta | Média (INVESTIGAR) |
| T-8 | `AnimatePresence` envolvendo os modais da Agenda — histórico de "tela preta" (S158) exige cuidado com navegação durante animação | Alta (não regredir) |

### 10. Ranking P0 / P1 / P2 / P3

**P0 — trava o uso ou os números**
- P0-a: Inconsistência de números (seção P0 dedicada) — competência financeira + `paid_amount` opcional + 4 stats paralelas.
- P0-b: **Não dá para confirmar um evento pela Agenda** (P-2). Fluxo pending→confirmed sem botão.
- P0-c: Eventos `scheduled` desaparecem de filtros e do "Próximo Show" (P-1).

**P1 — fricção séria / confusão frequente**
- P1-a: Dois `EventDetailModal` divergentes (P-3).
- P1-b: Não abrir 2º/3º evento de um dia cheio no grid (A17).
- P1-c: EventActionSheet com 11 botões + 2 camadas de modal no mobile (M-1).
- P1-d: AlertsPanel com até 9 cards no topo (A9 / §8-M5).
- P1-e: Horários 09:00–18:00 invisíveis mas gravados (P-11).
- P1-f: Chip de status ≠ badge de status (P-5).

**P2 — ruído / redundância / limpeza**
- P2-a: `monthStats.received/pending` mortos + StatCard "Receita" 5ª definição (P-4).
- P2-b: 6 pontos de "Registrar horas" / 6 de "Novo evento" (§5).
- P2-c: Toolbar lotada; 5 vistas; 3 ícones soltos (A14, A15, §7).
- P2-d: `nf_number` vs `nfe_numero` paralelos.
- P2-e: `cache_valor_base` sem input (P-12).
- P2-f: `‹ M ›` visível mas inerte nas vistas upcoming/list/kanban (A4).

**P3 — cosmético / código morto**
- P3-a: `getEventStatusConfig` sem `icon` → `StatusIcon` sempre undefined (P-6).
- P3-b: branches mortos `|| 'confirmed'` (P-7, P-8).
- P3-c: `onMarkPaid` prop morta no reports/EventDetailModal (P-14).
- P3-d: AlertsPanel check-in ignora status cancelado (P-9); dismiss ao cancelar modal (P-10).
- P3-e: unused imports/args (ver seção ESLint).

### 11. Recomendações (ordem sugerida — NÃO implementar nesta fase)

1. **P0-a primeiro** (números): decidir a regra de competência → helper único → só depois mexer nas telas. É pré-requisito de qualquer simplificação de Home/Metas/Relatórios.
2. **P0-b / P0-c juntos** (status): decidir se `scheduled`/`tentative` continuam existindo. Se sim: (a) chips e badges usam `getEventStatus`; (b) `pickProximoEvento`/`useUpcomingEvent` passam a considerar `scheduled`; (c) adicionar CTA "Confirmar" no `reports/EventDetailModal`. Se não: migração para normalizar `status` (fora de escopo agora).
3. **P1-a** (unificar EventDetailModal) — reduz superfície de bug e a divergência Home/Agenda.
4. **P1-b/A17** — na vista grid, clicar num dia com N eventos abre um seletor (reusar `multipleEventsModal` em modo "ver").
5. **P1-c/M-1** — ActionSheet: 3–4 ações primárias + `···`; "Ver Detalhes" como ação padrão do toque no evento (sem sheet intermediário).
6. **P1-d** — AlertsPanel colapsável.
7. **P1-e** — mostrar o campo de horário no EventForm de evento novo (ou não gravar default e deixar "a definir").
8. **P2** — limpeza de toolbar / vistas / código morto, depois que P0/P1 estabilizarem.

### 12. Tabela de handoff para o Cursor

> Só entra na fila do Cursor **após revisão estratégica do usuário**. Um item por vez, commit antes de trocar.

| ID | Título | Arquivos | Tipo | Prioridade | Depende de |
|---|---|---|---|---|---|
| AG-01 | Helper único de receita/competência (`paidRevenueInPeriod` etc.) em `src/lib/` | novo `src/lib/financePeriod.js` (ou similar) | refactor de lógica | P0 | decisão de regra (usuário) |
| AG-02 | `useHomeDashboard` / `useStats` / `useMeiStats` / `Calendar.monthStats` passam a usar AG-01 | `useHomeDashboard.js`, `useBackstageData.js`, `Calendar.jsx` | refactor | P0 | AG-01 |
| AG-03 | `Reports.processForPeriod` usa AG-01 (remove exigência de `paid_date` não-nulo, ou documenta) | `Reports.jsx` | refactor | P0 | AG-01 |
| AG-04 | Incluir `scheduled` (e decidir `tentative`) em `pickProximoEvento` e `useUpcomingEvent` | `useHomeDashboard.js`, `useBackstageData.js` | fix | P0 | decisão de status |
| AG-05 | Chips de filtro da Agenda usam `getEventStatus`; adicionar tratamento de `scheduled` | `Calendar.jsx` | fix | P0/P1 | decisão de status |
| AG-06 | CTA "Confirmar evento" no `reports/EventDetailModal` + `EventActionSheet` | `components/reports/EventDetailModal.jsx`, `mobile/EventActionSheet.jsx` | feature | P0 | decisão de status |
| AG-07 | Unificar os dois `EventDetailModal` num componente com props de feature | `components/reports/` + `components/calendar/EventDetailModal.jsx` | refactor grande | P1 | AG-06 |
| AG-08 | Vista grid: seletor de eventos ao clicar num dia com N>1 | `Calendar.jsx`, `BackstageCalendarGrid.jsx` | fix/UX | P1 | — |
| AG-09 | EventActionSheet: 3–4 ações + `···`; toque no evento abre detalhe direto | `Calendar.jsx`, `mobile/EventActionSheet.jsx` | UX | P1 | — |
| AG-10 | AlertsPanel colapsável / máx 2 visíveis + "ver mais" | `AlertsPanel.jsx` | UX | P1 | — |
| AG-11 | EventForm: mostrar campo de horário em evento novo OU não gravar 09:00–18:00 default | `EventForm.jsx` | fix | P1 | — |
| AG-12 | Remover `monthStats.received/pending` mortos + props mortas p/ `CalendarPageHeader` | `Calendar.jsx`, `CalendarPageHeader.jsx` | limpeza | P2 | — |
| AG-13 | Toolbar: chips→dropdown, 3 ícones→`···`, revisar 5 vistas | `Calendar.jsx` | UX | P2 | P0/P1 estáveis |
| AG-14 | `getEventStatusConfig` ganha `icon` OU `EventActionSheet` para de ler `.icon` | `dateUtils.jsx` / `EventActionSheet.jsx` | fix | P3 | — |
| AG-15 | Remover branches mortos `\|\| 'confirmed'` (canQuickPay, projeção) + `onMarkPaid` morto | `Calendar.jsx`, `Reports.jsx` | limpeza | P3 | — |
| AG-16 | AlertsPanel: check-in ignora cancelados; não dispensar ao cancelar modal | `AlertsPanel.jsx` | fix | P3 | — |
| AG-17 | `cache_valor_base`: adicionar input no EventForm OU remover do payload | `EventForm.jsx` | decisão | P2 | — |
| AG-18 | INVESTIGAR: `EventTemplate` (`@/api/entities`) persiste em tabela real? alias offline de `useEvents` funciona? | `src/api/entities.js`, `vite.config.js` | investigação | P2 | — |

---

## Auditoria — Home `/` (resumo — detalhe na seção "1. Home" acima)

Concluída 2026-08-28. 17 itens. Bloco Financeiro 5→3 widgets. Bugs H5 (`scheduled`), H8 (cobrar sem telefone).
Ver tabela de handoff embutida na seção "1. Home".

---

## Estado do repositório & ESLint (verificado 2026-08-28)

### Git

- Branch `main`, sincronizada com `origin/main` em **`e9e600f`** (commit criado nesta sessão para preservar `docs/AGENT_LOG.md` + `docs/PLANO_REVISAO_GERAL.md`).
- `npm run git:backup` **falhou silenciosamente** ("nada para salvar") porque `git status` está quebrado — commit + push foram feitos manualmente (`git add` dos 2 docs → `git commit` → `git push`, que funcionam apesar do erro).
- **`git status` retorna `fatal: not a git repository: .../.git/worktrees/agent-abd00af5c51a7f7b6`** — metadados de worktree corrompidos (`gitdir`, `commondir`, `HEAD` = 0 bytes, timestamp 2026-08-28 02:48).

### Worktree órfão — evidência de abandono (instrução #3)

| Evidência | Resultado |
|---|---|
| `git worktree list --porcelain` | Lista **só** o repo principal — o worktree **não está mais registrado** |
| `git worktree prune -n` (dry-run) | `Removing worktrees/agent-abd00af5c51a7f7b6: gitdir file does not exist` — o próprio git marca como stale |
| `git worktree prune` (real) | `error: failed to delete '.git/worktrees/agent-abd00af5c51a7f7b6': Permission denied` — diretório **bloqueado por outro processo** (harness / OneDrive) |
| `rm` direto em `.git/worktrees/...` | Bloqueado pelo classificador (mutação em `.git/`) |
| Branch `worktree-agent-abd00af5c51a7f7b6` | Último commit `ea10afd` — "wip backup **15/06/2026**" (74 dias) |
| `.claude/worktrees/agent-abd00af5c51a7f7b6/` | Cópia completa do repo de 15/06; working tree limpo |
| `git fsck` | Object DB íntegro (só dangling blobs, normal) |

**Conclusão:** o worktree É abandonado, mas **não pôde ser removido** — `.git/worktrees/agent-abd00af5c51a7f7b6` está com lock de S.O. **Ação para o usuário:** reiniciar a sessão / fechar outras instâncias do Claude Code / OneDrive, depois `git worktree prune`. Enquanto não for removido, `git status` fica quebrado (mas `add`/`commit`/`push` funcionam).

### ESLint — `npm run lint` está contaminado

`eslint.config.js` **não ignora `.claude/**`**, então `eslint .` varre também a cópia do repo no worktree órfão.

**A. Erros gerados pelo worktree / `.claude/` (ruído — ignorar):** ~1100 erros. Ex.: `tailwind.config.js 'module' is not defined`, `vite.config.js '__dirname' is not defined`, `e2e/helpers/*` sem globals, `marketing/*`. Todos com caminho `.claude/worktrees/agent-abd00af5c51a7f7b6/...`. **Não são erros do código-fonte.**
Correção estrutural (P2, para o Cursor): adicionar `'.claude/**'` (e `'**/worktrees/**'`) aos `ignores` de `eslint.config.js` — **depois** de o worktree ser removido.

**B. Erros reais em `src/` (7) — correções triviais (unused vars/args):**

| Arquivo | Linha | Erro |
|---|---|---|
| `src/lib/useHomeDashboard.js` | 2, 2, 12 | `differenceInDays`, `parseISO`, `daysSinceEventEnd` importados e não usados |
| `src/pages/Calendar.jsx` | 84 | `haptics` importado e não usado (S186 deixou) |
| `src/components/layout/RouteSkeleton.jsx` | 93, 162 | arg `primary` não usado (2×) |
| `src/lib/offline/connectivityStore.js` | 63 | arg `silent` não usado |

**C. Warnings reais em `src/` (9):**

| Arquivo | Regra | Nota |
|---|---|---|
| `src/lib/offline/createOfflineHook.js` | `react-hooks/exhaustive-deps` × 7 | **ATENÇÃO — não mexer automaticamente.** Ver abaixo |
| `src/lib/offline/OfflineSyncProvider.jsx` | `react-refresh/only-export-components` | co-export de constante — `eslint-disable` cirúrgico é aceitável |
| `src/lib/profileOfflineContext.jsx` | `react-refresh/only-export-components` | idem |

**Análise semântica dos 7 `exhaustive-deps` em `createOfflineHook.js` (NÃO adicionar deps):**

Todos os 7 avisos são do tipo *"unnecessary dependency"* — o ESLint reclama que `entity`, `storeName`, `mapRowFromDb`, `sortRows` estão nas dep arrays mas são **valores de escopo externo / props do factory** (`createOfflineHook(entity, storeName, ...)`), não estado que dispara re-render. O próprio texto do aviso diz: *"Outer scope values like 'storeName' aren't valid dependencies because mutating them doesn't re-render the component."*

- **`entity` / `storeName`**: são os argumentos do factory `createOfflineHook`. São **constantes** durante toda a vida do hook (cada entidade tem seu wrapper: `useOfflineEvents`, `useOfflineClients`...). Removê-los das deps é **seguro e correto** — não há como mudarem.
- **`mapRowFromDb` / `sortRows`**: funções passadas ao factory. Também estáveis por construção (definidas uma vez por wrapper). Seguras de remover.
- **RISCO se alguém "corrigir errado"**: se em vez de *remover* essas deps alguém *adicionar* `events`/`data`/`refetch` para "satisfazer" o linter, pode criar: (a) loop de sync (refetch → setstate → novo refetch), (b) re-subscrição repetida ao canal realtime, (c) requests duplicados ao reconectar, (d) perda da fila offline entre renders.
- **Recomendação**: `eslint-disable-next-line react-hooks/exhaustive-deps` em cada um dos 7, com comentário explicando "args do factory — estáveis por construção". **Nenhuma mudança de dependency array.** Prioridade P3.

---

Cada jornada = fluxo end-to-end. Critério de sucesso: completar sem "cadê isso?" ou "e agora?".

| # | Jornada | Telas | O que validar | Status |
|---|---|---|---|---|
| J1 | Primeiro uso | Login → Onboarding → Home vazia → 1º evento | Tour faz sentido? Empty states guiam? | ⬜ |
| J2 | Dia do show | Home (Próximo Show) → Modo Palco → Horas → Realizado | GPS, timer, registro de horas fluem? | ⬜ |
| J3 | Fechar o mês | Agenda → EventDetail → Pago → Metas → Relatórios | **Números batem entre telas?** Meta vs recebido? | ⬜ |
| J4 | Cliente novo → cobrança | Clientes → Evento → WhatsApp/PIX → NF-e | CRM + cobrança + fiscal fecham o ciclo? | ⬜ |
| J5 | Offline → volta online | Sem internet → editar → reconectar | Sincroniza? Perde algo? | ⬜ |

---

## P0 — Inconsistência de números (Home × Metas × Relatórios × Agenda)

> **Prioridade ALTA.** Pedido explícito do usuário. Nenhuma correção ainda — primeiro a matriz completa abaixo.
> Auditoria de código concluída 2026-08-28: `Reports.jsx`, `Goals.jsx`, `Calendar.jsx`,
> `useHomeDashboard.js`, `useBackstageData.js`, `goalMetrics.js`, `eventFinance.js`, `dateUtils.jsx`.

### Campos de data no evento (o que existe no DB)

| Campo | Papel real | Observações |
|---|---|---|
| `event_date` | Coluna **legada NOT NULL**; `useEvents.mapPayloadToDb` mantém em sincronia com `start_date` | Nunca exibida; `mapRowFromDb` faz `start_date = start_date \|\| event_date` |
| `start_date` | Data de início do show (competência "operacional") | Fonte primária de data em quase toda a UI |
| `end_date` | Data de fim (eventos multi-dia); igual a `start_date` para 1 dia | `EventForm` grava `end_date = start_date` quando vazio |
| `completed_at` | **NÃO EXISTE** no schema | "Realizado" é `status='completed'` (manual) OU calculado por data (`getEventStatus`) |
| `paid_date` | Data em que o pagamento entrou | Setado por `handleMarkPaid` (=hoje) e `PaymentConfirmModal`. **Fica NULL se o pagamento vier de import/seed** |
| `payment_status` | `unpaid` (default form) / `pending` / `partial` / `paid` | `eventFinance.UNPAID_STATUSES = {pending, unpaid, partial}` |

### Dois sistemas de status (raiz de várias inconsistências)

| Sistema | Valores possíveis | Onde vem | Quem usa |
|---|---|---|---|
| **`event.status` (cru, DB)** | `pending` · `tentative` · `scheduled` · `confirmed` · `completed` · `cancelled` · `archived` | `EventForm` grava sempre `pending` em evento novo; import/seed pode gravar qualquer um | Filtros de chip da Agenda; `pickProximoEvento`; `useUpcomingEvent`; ícones de status nas listas |
| **`getEventStatus(event)` (calculado, `dateUtils`)** | `scheduled` · `in_progress` · `completed` · `cancelled` · `archived` — **nunca retorna `pending`/`tentative`/`confirmed`** | Deriva de datas: futuro→`scheduled`, hoje↔fim→`in_progress`, passado→`completed`; `completed`/`archived`/`cancelled` manuais têm prioridade | `isReceivableEvent`; badges de Relatórios (`calculatedStatus`); LifecycleBar; CTAs dos EventDetailModal; badge da vista Lista |

**Consequência:** um evento passado com `status='confirmed'` no DB é contado no chip "Confirmados" da Agenda,
mas seu badge (vista Lista, via `getEventStatus`) mostra "Concluído". Chip e badge discordam.

### Matriz: TELA/COMPONENTE → MÉTRICA → FONTE → FILTRO → COMPETÊNCIA → STATUS → FÓRMULA

| Tela / componente | Métrica exibida | Fonte (hook/fn) | Filtro | Data de competência | Status considerados | Fórmula do valor |
|---|---|---|---|---|---|---|
| **Home** · MetaMensalBar / 3º círculo (via `useBackstageData.useStats`) | "Recebido no mês" | `useStats` (query Supabase direta) | eventos cujo intervalo `[start_date, end_date]` intersecta o mês; `payment_status='paid'`; não cancelado | **data do show** (`start_date`/`end_date`) | qualquer (não filtra `status`) | `Σ paid_amount \|\| eventValue(e)` — `eventValue = actual_revenue > estimated_revenue > daily_cache_value×dias` |
| **Home** · cockpit (`useHomeDashboard.computeStats`) | idem "Recebido" | `useHomeDashboard` (2ª implementação, quase idêntica) | idem | **data do show** | qualquer | idem `paid_amount \|\| eventValue(e)` |
| **Home** · AReceber card + PipelineFinanceiro "A Receber" | "A receber" | `useHomeDashboard` / `sumReceivableAmount` | `payment_status ∈ {pending,unpaid,partial}` **e** `getEventStatus==='completed'` | all-time (sem filtro de data) | `getEventStatus==='completed'` | `Σ calculateEventReceivableAmount` (Σ `daily_cache` do work se >0, senão `getEventCacheAmount`) |
| **Home** · PipelineFinanceiro "Resultado" | receita − despesas do mês | `computeStats.faturamento_pago` − `despesasMes` | despesas: `expense_date \|\| date` no mês | mistura: recebido = data do show; despesa = data da despesa | — | `faturamento_pago − Σ amount` |
| **Metas** · círculos "Recebido" / "A Receber" / "Diárias" | idem Home | `useBackstageData.useStats` | idêntico à Home | **data do show** | — | idêntico à Home ✅ |
| **Metas** · streak, "X shows p/ meta", histórico 4 meses, painel anual | "receita paga do mês N" | `goalMetrics.paidRevenueInMonth` | `payment_status='paid'` **e** `(paid_date \|\| start_date)` no mês | **data do pagamento** (fallback `start_date`) | qualquer | `Σ Number(paid_amount) \|\| 0` — **sem fallback `eventValue`** |
| **Metas** · MeiDashboard (`useMeiStats`) | faturamento anual MEI | `useMeiStats` (3ª implementação) | `start_date` no ano; `payment_status='paid'` | **data do show** (`start_date`) | qualquer | `Σ paid_amount>0 ? paid_amount : eventValue(e)` |
| **Relatórios** · KPI "Faturamento" (`processForPeriod.realizedRevenue`) | receita realizada no período | `Reports.jsx` inline | `payment_status='paid'` **e** `paid_date` presente **e** `paid_date` no range | **data do pagamento ESTRITO** — evento pago sem `paid_date` é **excluído** | qualquer (via `paid`) | `Σ paid_amount \|\| calculateRealEventValue` (work Σ, senão `getEventCacheAmount`) |
| **Relatórios** · KPI "A Receber" | a receber | `Reports.jsx` / `isReceivableEvent` | `getEventStatus==='completed'` **e** `payment_status ∈ {pending,unpaid,partial}` | all-time (sem range) | `getEventStatus==='completed'` | `Σ calculateEventReceivableAmount` |
| **Relatórios** · KPI "Lucro Líquido" | lucro | `Reports.jsx` | `realizedRevenue + receivableRevenue − totalExpenses` | mistura de 3 competências | — | soma acima |
| **Relatórios** · "Projeção do Próximo Período" (headline) | receita projetada | `processForPeriod.projectedRevenue` | `calculatedStatus==='scheduled'` (= futuro por data) — **sem filtro de range** | nenhum | `getEventStatus==='scheduled'` | `Σ calculateRealEventValue` — **igual em current/previous/next**; o número não muda com o período |
| **Relatórios** · MonthlyTrend / IRSummary | receita mensal | `paid_date \|\| start_date` (S121/S122) | `payment_status='paid'` | **data do pagamento** | qualquer | `Σ paid_amount` |
| **Agenda** · StatCard "Receita" | "estimada no mês" | `Calendar.monthStats.totalRevenue` | `monthEvents` (intervalo intersecta o mês) — **todos**, pagos ou não | **data do show** | qualquer não-cancelado | `Σ (work Σ daily_cache se >0, senão getEventCacheAmount)` |
| **Agenda** · `monthStats.received` / `.pending` | recebido / pendente do mês | `Calendar.monthStats` | `monthEvents` por `payment_status` | **data do show** | qualquer | received: `paid_amount \|\| getEventCacheAmount`; pending: `getEventCacheAmount` — **computados e passados só para `CalendarPageHeader`, que ignora (props mortas)** |
| **Agenda** · vistas/cards (grid, week, upcoming, list, search) | cachê do evento | `getEventCacheAmount(ev)` | — | — | — | `actual_revenue > estimated_revenue > daily_cache_value×dias > daily_cache` |
| **EventDetailModal** (ambos) · "Receita Bruta" | receita do evento | `stats` inline | `dailyWork` do evento | — | — | `fromWork > 0 ? fromWork : getEventCacheAmount(event)` |

### Achados

| # | Achado | Impacto |
|---|---|---|
| N1 | **"Recebido no mês" tem 3 regras de competência** simultâneas: data do show (Home, Metas círculos, MEI, Agenda) vs data do pagamento (Metas streak/anual, Relatórios "Faturamento", MonthlyTrend, IRSummary) | Home e Metas círculos concordam entre si, mas **divergem de Relatórios** e do próprio painel de streak/anual da tela Metas |
| N2 | **Valor de "recebido" difere entre helpers**: `paid_amount \|\| eventValue(e)` (Home/Metas círculo/MEI) vs `Number(paid_amount) \|\| 0` (goalMetrics) vs `paid_amount \|\| calculateRealEventValue` (Reports) | Evento pago via "Marcar pago" rápido → `paid_date=hoje`, `paid_amount=NULL`. Metas streak/anual conta **R$ 0**; Home conta o valor estimado; Relatórios conta o cachê. Mesmo evento, 3 valores |
| N3 | **Relatórios "Faturamento" exige `paid_date` não-nulo**; eventos pagos sem `paid_date` somem do KPI e do gráfico "Realizado" | Toda base migrada / paga antes do fluxo `paid_date` fica invisível em Relatórios |
| N4 | **Nº de diárias** filtra `daily_work.date` cru (não normaliza `work_date`); registros com só `work_date` preenchido são invisíveis | Possível subcontagem de diárias em Home/Metas/Agenda |
| N5 | **"A Receber"** é consistente entre Home e Relatórios (mesmo helper), mas é **all-time** nas duas (nunca filtrado por período) mesmo quando a tela mostra um período específico | Em Relatórios, trocar o período não muda "A Receber" |
| N6 | **Projeção "Próximo Período"** (Relatórios): headline = todos os eventos futuros (qualquer período); a lista abaixo é filtrada pelo período. Headline ≠ soma da lista | Número não confere com a lista dele mesmo |
| N7 | **4 implementações paralelas** de "stats do mês": `useHomeDashboard.computeStats`, `useBackstageData.useStats`, `useBackstageData.useMeiStats`, `Calendar.monthStats` | Manutenção: corrigir uma regra exige corrigir 4 lugares |
| N8 | **`monthStats.received`/`.pending`** em `Calendar.jsx` são calculados e passados a `CalendarPageHeader` que **não os usa** — computação 100% morta | Custo de render sem benefício; confusão para quem lê o código |

### Direção de correção (para depois da revisão estratégica — NÃO implementar agora)

1. **Definir uma regra oficial de competência financeira** (recomendação: **data do pagamento** `paid_date`, com fallback explícito documentado).
2. **Um helper compartilhado** `paidRevenueInPeriod(events, {start, end})` + `receivableInPeriod` + `projectedInPeriod` em `src/lib/` — todas as telas consomem.
3. **Garantir `paid_date` sempre preenchido** ao marcar pago (já ocorre em `handleMarkPaid`); backfill dos eventos antigos: `paid_date := start_date` onde `payment_status='paid' AND paid_date IS NULL` (migração — **fora de escopo desta fase**).
4. **Unificar os dois sistemas de status** ou documentar claramente qual usar onde (chips de filtro deveriam usar `getEventStatus` como os badges).
5. Remover as 3 implementações redundantes de stats; manter `useHomeDashboard` como única e derivar Metas/Agenda dela.

---

## Trilha C — Integrações "quase funciona"

| Item | Status atual | Ação | Quem |
|---|---|---|---|
| Google Calendar OAuth real | 🟡 UI ok, app em Testing no GCP | Checklist § OAuth do `RELATORIO_VIDA_APP.md` (passos A–E + 10 no app) | Usuário (Claude guia) |
| Rotacionar `GOOGLE_CLIENT_SECRET` | ⬜ | Segurança, não UX — fazer junto do OAuth | Usuário |
| Push notifications | ✅ infra, precisa reativar no Perfil pós-deploy | Testar recebimento real 8h/18h BRT | Usuário |
| PWA offline — conflitos | 🟡 sync silencioso ok | Testar: editar mesmo evento em 2 devices offline → reconectar | Usuário + Claude |
| NF-e upload + IA | ✅ testado em prod | Validar fluxo completo do usuário 1×/mês | Usuário |

---

## Ritmo sugerido (sessão ~1h)

1. Usuário (ou Claude via browser) navega a tela/jornada da vez.
2. Claude lista cada item com `✅/🔧/🌀/📦/❌` + spec para os problemas.
3. Escolhem 3 fixes prioritários → viram tarefa do Cursor.
4. Docs atualizados: este arquivo + `AUDITORIA_PAGINAS.md` + `AGENT_LOG.md`.

---

## Log de progresso

| Data | Fase / tela | Agente | Resultado |
|---|---|---|---|
| 2026-08-28 | Fase 0 + estrutura do plano | Claude Code | Plano criado, calibração feita |
| 2026-08-28 | Trilha A — Home (via código) | Claude Code | 17 itens mapeados; achado principal: `useHomeDashboard` calcula "recebido" por data do show, `goalMetrics` por data do pagamento → Home ≠ Metas. Proposta: Bloco Financeiro 5→3 widgets |
| 2026-08-28 | P0 — matriz de números (Home×Metas×Relatórios×Agenda) | Claude Code | Matriz completa TELA→MÉTRICA→FONTE→FILTRO→COMPETÊNCIA→STATUS→FÓRMULA. 8 achados (N1–N8). 3 regras de competência simultâneas, 4 stats paralelas, `paid_amount` opcional |
| 2026-08-28 | Trilha A — Agenda `/calendar` (READ-ONLY, via código) | Claude Code | 12 partes; ~55 itens; 16 problemas (P-1..P-16); ranking P0–P3; 18 itens de handoff (AG-01..AG-18). Sem alteração de `src/`. Achados-chave: não dá p/ confirmar evento pela Agenda; `scheduled` some; 2 EventDetailModal divergentes; ActionSheet 11 botões |
| 2026-08-28 | Estado repo + ESLint | Claude Code | `git status` quebrado por worktree órfão com lock de S.O. (evidência de abandono documentada). ESLint: A (~1100 ruído do worktree) / B (7 erros triviais src) / C (9 warnings — 7 exhaustive-deps em createOfflineHook analisados: NÃO adicionar deps, usar disable) |
