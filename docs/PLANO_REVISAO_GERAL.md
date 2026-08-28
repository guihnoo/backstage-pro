# Plano de Revisão Geral — Backstage Pro

> Segundo eixo de auditoria: **clareza de produto e completude funcional**.
> A auditoria técnica (scroll/z-index/mobile) já está madura em `AUDITORIA_PAGINAS.md`.
> Este documento ataca: "isso funciona de verdade no meu dia a dia?" e "por que tem tanta coisa na tela?".

**Criado:** 2026-08-28 (Claude Code)
**Status:** 🔄 Trilha A — Home ✅ · Agenda ✅ · **Clientes + `/client-detail` ✅ (2026-08-28)** · demais ⬜
**Decisões estratégicas aprovadas (2026-08-28):** ver §"Modelo oficial de competência" e §"Status de Negócio × Status Temporal" — **aprovadas, NÃO autorizam implementação ainda**
**Prioridades P0:** (1) competência/valor de dinheiro; (2) semântica de pagamentos parciais; (3) duas dimensões de status confundidas

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

Ordem aprovada pelo usuário (2026-08-28) — não imutável se a arquitetura revelar dependências:

| # | Tela / área | Status |
|---|---|---|
| — | Home `/` | ✅ 2026-08-28 |
| — | Agenda `/calendar` | ✅ 2026-08-28 |
| 1 | Clientes `/clients` | ✅ 2026-08-28 |
| 2 | Detalhe do Cliente `/client-detail` | ✅ 2026-08-28 (junto de Clientes) |
| 3 | EventDetailModal (componente transversal — calendar + reports) | 🔄 parcial (Agenda) |
| 4 | Registro de Horas / DailyWork | 🔄 parcial (Agenda) |
| 5 | Despesas `/expenses` | ⬜ |
| 6 | Metas `/goals` | ⬜ |
| 7 | Relatórios `/reports` | ⬜ (leitura financeira parcial já feita no P0) |
| 8 | IA Mentor | ⬜ |
| 9 | Perfil / Configurações | ⬜ |
| 10 | Google Calendar | ⬜ (Trilha C) |
| 11 | Push Notifications | ⬜ (Trilha C) |
| 12 | Offline / Sync / Realtime | ⬜ (Trilha C) |
| 13 | Onboarding | ⬜ |
| 14 | Login / Cadastro / Recuperação | ⬜ |
| 15 | Navegação global / Bottom Nav / "Mais" | ⬜ |
| 16 | PWA / instalação | ⬜ |
| 17 | Empty states (varredura transversal) | ⬜ |
| 18 | Loading / error states (varredura transversal) | ⬜ |
| 19 | Acessibilidade (varredura transversal) | ⬜ |
| 20 | Experiência mobile global (varredura transversal) | ⬜ |

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

### 6. Clientes `/clients` + `/client-detail` — ✅ auditada 2026-08-28 (Claude Code, via código + 4 SELECTs de produção)

Detalhe completo na seção **[Auditoria — Clientes](#auditoria--clientes-clients--client-detail)** mais abaixo:
20 partes, 53 itens de inventário, problemas CL-1..CL-20, ranking P0–P3, tabela de handoff CLI-01..CLI-16.
Achados-chave: `paid_amount` NULL em 100% dos pagos (Metas e "Faturamento Real" = R$ 0); sem coluna CNPJ;
4 implementações de "stats do cliente" divergentes; 3 modais/telas de "ver cliente" quase idênticos.

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

### Direção de correção (substituída pelas decisões aprovadas abaixo)

Ver **"Modelo oficial de competência — decisão aprovada"** e **"Regra do valor recebido"** logo a seguir.
A sugestão anterior "chips e badges devem usar `getEventStatus()`" foi **PROIBIDA pelo usuário** — ver §Status.

---

## MODELO OFICIAL DE COMPETÊNCIA — decisão aprovada (2026-08-28)

> Aprovada pelo usuário. **NÃO autoriza implementação em `src/**` ainda.** Direção obrigatória para a fase de implementação.

O domínio financeiro tem **competências diferentes por tipo de valor**. Não existe "uma data que rege tudo".

| Métrica | Competência (data que a "coloca no mês/período") | Observação |
|---|---|---|
| **RECEBIDO** (dinheiro que entrou) | **`paid_date`** | Fonte oficial. Todo novo pagamento marcado como recebido **precisa ter `paid_date`** |
| **PROJETADO / PREVISTO** | **período do evento** (`start_date` / `end_date`) | Ainda não aconteceu financeiramente — competência é quando o show ocorre |
| **DESPESAS** | **`expense_date`** | — |
| **HORAS / DIÁRIAS** | **data efetivamente trabalhada** (`work_date` / campo canônico equivalente — hoje resolve para `daily_work.date`) | Ver nota sobre `work_date` vs `date` em §Registro de Horas |
| **A RECEBER** | **NÃO usa `paid_date`** (pagamento não ocorreu). Regra de período a definir na auditoria de Relatórios/Financeiro | Provisoriamente all-time; decisão adiada de propósito |

**Implicações para a fase de implementação (não fazer agora):**
- `Reports.processForPeriod.realizedRevenue` já usa `paid_date` — mas **exclui** eventos pagos sem `paid_date`. Precisa de guarda/backfill (ver §Legado).
- `useHomeDashboard.computeStats` / `useBackstageData.useStats` / `useMeiStats` usam **data do show** para "recebido" — divergem da regra. Migrar para `paid_date`.
- `goalMetrics.paidRevenueInMonth` já usa `paid_date || start_date` — manter `paid_date`, revisar o fallback.
- Um helper compartilhado (`src/lib/`): `receivedInPeriod` (por `paid_date`), `projectedInPeriod` (por evento), `expensesInPeriod` (por `expense_date`), `hoursInPeriod` (por dia trabalhado). Todas as telas consomem.

### Regra do valor recebido — direção aprovada

Acabar com as 3 fórmulas: `paid_amount || eventValue` · `Number(paid_amount) || 0` · `paid_amount || calculateRealEventValue`.
Durante a implementação, **determinar o valor canônico** de "quanto foi recebido num evento".

**ATENÇÃO TÉCNICA (aprovada):** `0` é valor monetário válido; `||` trata `0` como falso. A implementação deve usar
**nullish (`??`)** onde apropriado: `paid_amount ?? valorRealDoEvento` — **não** `paid_amount || valorRealDoEvento`.
Também aplicar `?? 0` (e não `|| 0`) em somas de `paid_amount`.

**Isto NÃO é autorização para alterar código.**

### LEGADO — eventos pagos sem `paid_date` (levantamento 2026-08-28)

Consulta read-only à base de produção (`cwtallnetgodoacuoaow`, dados de 1 usuário, 29 eventos):

| Situação | Contagem | Detalhe |
|---|---|---|
| `payment_status='paid'` | **21** | 18 vieram do Google Calendar, 3 manuais |
| `paid` **sem `paid_date`** | **0** | ✅ nenhum evento pago sem data hoje |
| `paid` **sem `paid_amount`** | **21 (100%)** | 🔴 **nenhum evento pago tem `paid_amount` preenchido** |
| `paid` com `paid_amount = 0` | 0 | — |
| `payment_status='unpaid'` | 8 | 7 sem `paid_date` (esperado), 1 do Google |
| `payment_status='partial'` | **0** | não existe na base |

**Achados:**
- O risco "legado pago sem `paid_date`" **não está ativo nesta base** (0 registros). Mas o *código* de Relatórios ainda descarta esses eventos se existirem (ex.: import futuro, outro usuário). Recomendação: guarda `paid_date ?? start_date` **apenas na leitura**, não migration.
- 🔴 **`paid_amount` é NULL em 100% dos eventos pagos.** Consequência **ativa hoje**:
  - `goalMetrics.paidRevenueInMonth` (`Σ Number(paid_amount) || 0`) → **R$ 0** → **a tela Metas mostra streak/histórico/anual zerados** mesmo com 21 shows pagos.
  - `ClientDetailModal` "Faturamento Real" (`paid && paid_amount > 0`) → **R$ 0 para todo cliente**.
  - `Home`/`useStats`/`Reports` usam fallback (`|| eventValue` / `|| calculateRealEventValue`) → mostram valor, mas **um valor estimado, não o recebido real**.
- **Origem**: o fluxo `PaymentConfirmModal` grava `paid_amount`, mas os caminhos rápidos (`usePaymentToggle`, `handleMarkPaid`, `useReceivable`) e o **import do Google Calendar** gravam `payment_status='paid'` + `paid_date` **sem `paid_amount`**. 18/21 pagos vieram do Google.
- **Estratégia (documentar, não executar):**
  1. Todo caminho de "marcar pago" deve capturar/estimar `paid_amount` (ou assumir explicitamente `paid_amount = valorRealDoEvento` no momento).
  2. Leitura deve usar `paid_amount ?? valorRealDoEvento` (nullish) em todas as métricas de "recebido".
  3. Backfill opcional futuro: `paid_amount := <valor real calculado>` onde `paid AND paid_amount IS NULL` — **plano separado, fora desta fase**.

---

## P0 — Semântica de pagamentos parciais (`payment_status = 'partial'`)

> Investigação READ-ONLY concluída 2026-08-28. **Nenhuma proposta de migration.**

### Onde `partial` aparece no código

| Arquivo | Uso | Tipo |
|---|---|---|
| `src/lib/eventFinance.js:4` | `UNPAID_STATUSES = {'pending','unpaid','partial'}` — `isReceivableEvent` trata partial como não-pago | leitura |
| `src/lib/useBackstageData.js:63, 297` | query `.in('payment_status', ['pending','unpaid','partial'])` | leitura |
| `src/lib/useHomeDashboard.js:64, 182` | filtro `['pending','unpaid','partial'].includes(...)` | leitura |
| `src/lib/useReceivable.js:28` | query `.in(..., ['pending','unpaid','partial'])` | leitura |
| `src/pages/Calendar.jsx:1052` | drilldown "Receita": `payment_status === 'partial' ? 'Parcial' : ...` | exibição (label) |
| `src/components/clients/ClientDetailModal.jsx` | `totalPending` filtra **só `'unpaid'`** → partial **NÃO** conta | leitura (inconsistente) |
| `src/pages/ClientDetail.jsx` | `unpaidAmount` filtra `!== 'paid'` → partial **conta como cheio** | leitura (inconsistente) |
| `src/components/clients/ClientInsightsModal.jsx` | `pendingAmount` filtra `!== 'paid' && completed` → partial conta se completed | leitura (inconsistente) |

### Onde `partial` é CRIADO / EDITADO

**Em lugar nenhum.** Busca por `payment_status: 'partial'` / `'partial'` como valor de escrita → **zero ocorrências**.
- `PaymentConfirmModal` → só grava `'paid'` (valida `Number(paidAmount) > 0`, sem opção de parcial).
- `usePaymentToggle` / `handleMarkPaid` (Calendar) → alterna `'paid'` ↔ `'unpaid'`.
- `EventForm` → grava `'unpaid'` (default) / `'pending'` (fallback morto).
- `useReceivable.markClientPaid` → grava `'paid'`.
- Nenhuma UI de "registrar pagamento parcial" / parcelas / histórico de pagamentos.

### Semântica atual (respostas à investigação pedida)

| Pergunta | Resposta |
|---|---|
| Onde `partial` é criado? | **Nenhuma UI.** Só pode vir de: edição manual no banco, import do Google Calendar, ou dado legado Base44 |
| Onde é editado? | Nenhuma UI |
| `paid_amount` quando status = partial? | **Indefinido.** Nenhum código lê `paid_amount` especificamente para partial. A base de produção tem 0 eventos partial |
| `paid_date` em partial? | Não garantido (nenhum código grava) |
| Primeiro/último pagamento? | Não há conceito — o app guarda **apenas o estado atual**, sem histórico de parcelas |
| Histórico de parcelas? | **Não existe.** Nenhuma tabela de `payments`/`installments` |
| Quanto aparece como "Recebido"? | **R$ 0** — partial não entra em nenhum cálculo de "recebido" (todos filtram `=== 'paid'`) |
| Quanto aparece como "A Receber"? | **O valor CHEIO do evento** (`calculateEventReceivableAmount`), não `total − pago`. Em `isReceivableEvent` partial = não-pago integral |
| Como Home trata? | `partial` → conta em "A Receber" pelo valor cheio; R$ 0 em "Recebido" |
| Como Metas trata? | `goalMetrics.paidRevenueInMonth` só olha `=== 'paid'` → partial = R$ 0 recebido |
| Como Relatórios trata? | `realizedRevenue` só `=== 'paid'` → R$ 0; `receivableRevenue` via `isReceivableEvent` → valor cheio |
| Como Agenda trata? | Chip "Pagos" só `=== 'paid'`; label "Parcial" no drilldown de receita; card usa `getEventCacheAmount` (valor cheio) |
| Como PaymentConfirmModal trata? | Não gera partial; ao confirmar, força `'paid'` |

### Conclusão

`partial` é um **estado órfão**: reconhecido por 8 pontos de leitura, criável por nenhum, sem `paid_amount`/`paid_date`/histórico,
e quando existe **distorce os números** (valor cheio em "A Receber", R$ 0 em "Recebido").
**Decisão a tomar na fase de implementação:** (a) implementar pagamento parcial de verdade (campo `paid_amount` + `partial` calcula `resta = total − pago`), ou (b) remover `partial` do domínio e tratar como `unpaid` até quitação total. **Não decidir agora.**

---

## DECISÃO 2 — STATUS: Status de Negócio × Status Temporal (aprovada 2026-08-28)

> Aprovada. **NÃO autoriza implementação.** Direção conceitual obrigatória.

### O que continua existindo (NÃO normalizar, NÃO remover)

`event.status` persistido: **`tentative` · `pending` · `scheduled` · `confirmed` · `completed` · `cancelled` · `archived`** — todos mantidos.

### PROIBIDO até redesenho semântico

❌ **NÃO** aplicar automaticamente "chips e badges devem usar `getEventStatus()`".
Motivo comprovado pela auditoria: são **duas dimensões diferentes** que hoje estão misturadas.

### Modelo conceitual (nomes finais a definir depois)

**A) STATUS DE NEGÓCIO / EVENTO** — persistido (`event.status`), decisão comercial do usuário:

| Valor | Significado |
|---|---|
| `tentative` | pré-reserva / hold / possibilidade ainda não garantida |
| `pending` | aguardando confirmação / negociação |
| `scheduled` | agendado válido, sem info/necessidade de confirmação explícita |
| `confirmed` | explicitamente confirmado |
| `completed` | realizado |
| `cancelled` | cancelado |
| `archived` | arquivado |

**B) STATUS TEMPORAL** — calculado pelas datas (hoje é `getEventStatus`):

| Valor | Significado |
|---|---|
| `upcoming` / `future` | data ainda não chegou |
| `in_progress` | hoje está dentro de `[start_date, end_date]` |
| `past` | data já passou |

O **temporal complementa** o de negócio — **não substitui**. Um evento `confirmed` cuja data passou continua
comercialmente `confirmed`; a situação temporal apenas diz "já aconteceu".

### Objetivo agora

Descobrir **todos os lugares onde as duas dimensões estão confundidas** (mapa abaixo, na auditoria de Clientes e na de Agenda).
**Sem** modificar schema, renomear helper ou criar migration.

### Regras já aprovadas (direção futura — registrar, não implementar)

- `scheduled` **precisa aparecer** em "Próximo Show".
- `scheduled` **precisa aparecer corretamente** na Agenda.
- `tentative` **precisa continuar visível e identificável** (badge próprio).
- Um evento `confirmed` **não deixa de ser** "confirmed" comercialmente só porque a data passou.
- Situação temporal **complementa**, não substitui silenciosamente.
- A Agenda **precisa ter** caminho para `pending → confirmed`.
- Os dois `EventDetailModal` **serão revisados** para futura unificação.

### Achado de dados relevante (2026-08-28, base de produção)

`event.status` real na base (29 eventos): `confirmed` 13 · `pending` 10 · **`confirmado` 5 (valor em português!)** · `completed` 1.
**`scheduled` = 0, `tentative` = 0** hoje. Os 5 `'confirmado'` (pt) **vieram todos do Google Calendar** — o import
grava valores fora da convenção (`'confirmado'` em vez de `'confirmed'`). `isCancelledEvent` cobre `'cancelado'`/`'cancelled'`
mas nada cobre `'confirmado'` → qualquer código que compara `=== 'confirmed'` (chips, `pickProximoEvento`, `useUpcomingEvent`,
badges de card, Kanban) **ignora esses 5 eventos**. `getEventStatus` também não trata `'confirmado'` → cai na lógica de data.
**O bug "status desaparece" já está ativo — via `'confirmado'`, não via `'scheduled'`.**

---

## Auditoria — Clientes `/clients` + `/client-detail`

> **READ-ONLY.** Concluída 2026-08-28 (Claude Code, via leitura de código + 4 consultas SELECT à base de produção).
> Arquivos lidos: `pages/Clients.jsx`, `pages/ClientDetail.jsx`, `components/clients/{ClientForm, ClientDetailModal,
> ClientInsightsModal, CompanySearchInput, InactiveClientsPanel, ClientInteractionLog, ClientDraftBadge, CompanyAvatar}`,
> `components/mobile/ClientActionSheet.jsx`, `lib/{useClients, useCompanies, companyService, useClientInteractions,
> usePaymentToggle, useReceivable, useDailyWork}`, `components/reports/PaymentConfirmModal.jsx`.
> Nada em `src/**` foi alterado.

### 1. Inventário completo

| # | Item | Hoje | Ação | Nota |
|---|---|---|---|---|
| C1 | Título "Clientes" + subtítulo "Base de clientes e relacionamento" | fixo | MANTER | — |
| C2 | Botão "Novo Cliente" (header) | abre `ClientForm` | MANTER | — |
| C3 | Alerta de erro de sync (com cache) | banner | MANTER | — |
| C4 | Busca | filtra nome, `contact_person`, `razao_social`, email, phone (só dígitos), city | MELHORAR | `razao_social` **não é coluna** (é linha em `notes`) — busca por razão social quase nunca acha |
| C5 | Filtros: Todos · Ativos · Inativos · Rascunhos · Empresas · Pessoas | 6 botões, 2 grupos | SIMPLIFICAR | "Empresas/Pessoas" alternam (clicar de novo volta a "all"); os outros não. Comportamento misto. `pessoa` = 0 na base → filtro "Pessoas" hoje sempre vazio |
| C6 | Ordenação: A–Z · Maior pendência · Mais shows · Mais recente | 4 chips | MANTER | — |
| C7 | `InactiveClientsPanel` (90+ dias sem show) | painel âmbar colapsável, só no filtro "Todos" | MANTER | 4º bloco competindo por atenção no topo (depois de busca+filtro+sort) |
| C8 | Card do cliente — avatar/logo | `AvatarImage src={logo_url}` + fallback iniciais (empresa) / ícone User (pessoa) | MANTER | — |
| C9 | Card — nome + `ClientDraftBadge` (rascunho) | truncate | MANTER | Badge de rascunho aparece **2×** no card (linha do nome + linha de status) |
| C10 | Card — `contact_person` com prefixo "🏢 " para pessoa | truncate | MELHORAR | Emoji hardcoded; para empresa mostra sem prefixo |
| C11 | Card — badge Ativo/Inativo (6 meses) **OU** `ClientDraftBadge` | | MANTER | "Ativo" = evento nos últimos 6 meses; "Inativo" senão |
| C12 | Card — dot colorido de "último show" (verde ≤30d / âmbar ≤90d / vermelho >90d ou sem histórico) | `title` tooltip | MELHORAR | 3ª sinalização de atividade no mesmo card (badge Ativo + dot + InactivePanel). Sem legenda visível |
| C13 | Card — badge "H.E." / "M&D" (`policy_default_payment_model`) | | MANTER | Sigla sem explicação |
| C14 | Card — 2 mini-stats: **Shows** · **A Receber** | grid 2 col | MANTER | "A Receber" = `completed && payment_status==='unpaid'` (ver §12 inconsistências) |
| C15 | Card — "Próx. show hoje/amanhã/em Xd" | quando há evento futuro | MANTER | — |
| C16 | Card — barra "Confiabilidade" (% pagos dos concluídos) | animada | MANTER | 4ª métrica no card |
| C17 | Card — rodapé: ícones Email / Ligar / WhatsApp | quando há email/phone | MANTER | WhatsApp vira "Cobrar R$ X" (âmbar + dot) quando há pendência |
| C18 | Card — botão `···` → `ClientInsightsModal` | canto sup. direito | POSSÍVEL REMOÇÃO | Abre um **3º modal** de dados do cliente que duplica ~80% do `ClientDetailModal` (ver §9) |
| C19 | Clicar no card → `ClientDetailModal` (desktop) **ou** `ClientActionSheet` (mobile) | `useMediaQuery(max-width:768px)` | MELHORAR | Experiências divergentes; tablet retrato usa desktop |
| C20 | Empty state (sem clientes / sem resultado) | ícone + CTA | MANTER | — |
| C21 | Loading (`ClientsSkeleton`) | grid de cards fantasma | MANTER | — |
| C22 | `ClientForm` — toggle Empresa/Pessoa | topo | MANTER | — |
| C23 | `ClientForm` — `CompanySearchInput` (3 abas: Pesquisar/CNPJ/NF-e) | **só ao criar empresa** (`!client`) | MELHORAR | Não dá para re-buscar/re-vincular empresa ao **editar** |
| C24 | `ClientForm` — campo "Razão Social" | só empresa; **vai para `notes` como texto** | CORRIGIR | Não é coluna; reseta para `''` a cada edição; digitar de novo pode duplicar a linha em `notes` |
| C25 | `ClientForm` — `ColorGridPicker` (brand_color) | | MANTER | fallback se coluna faltar (código defensivo — S27/schema) |
| C26 | `ClientForm` — "Pessoa de Contato" / "Empresa / Produtora" | label dinâmico | MANTER | — |
| C27 | `ClientForm` — Email / Telefone com validação | | MANTER | — |
| C28 | `ClientForm` — Políticas de Pagamento (modelo padrão + cachê diário padrão + checkbox meio&dobra) | bloco | MANTER | Usado por `EventForm.handleClientChange` |
| C29 | `ClientForm` — upload de Logo (Storage `logos/`) + Portal de NF-e (URL) | | MANTER | — |
| C30 | `ClientForm` — Observações (textarea) | | MELHORAR | Mistura notas do usuário com metadados injetados (`Razão Social:`, `buildCompanyNotes` → CNPJ/CNAE/porte) |
| C31 | **Sem campo CNPJ / CPF** em lugar nenhum do `ClientForm`/detalhe | — | CORRIGIR | `clients` **não tem coluna `cnpj`/`cpf`** (confirmado no schema). CNPJ só existe em `companies` (vinculada) ou dentro de `notes`. `EventDetailModal` lê `client?.cnpj` → **sempre `undefined`** → card de NF-e nunca mostra CNPJ do tomador |
| C32 | `ClientQuickCreateDialog` (criar cliente dentro do `EventForm`) | dialog aninhado | MANTER | ~5–7 toques; ver §4 |
| C33 | `ClientDetailModal` (desktop) — header: avatar + nome + badge Pessoa/Empresa + Draft + contact_person | | MANTER | — |
| C34 | `ClientDetailModal` — ações rápidas: Email / Ligar / WhatsApp / Portal NF-e | | MANTER | — |
| C35 | `ClientDetailModal` — 3 abas: Visão Geral / Linha do Tempo / Métricas | Radix Tabs + `AnimatePresence mode="wait"` | INVESTIGAR | `mode="wait"` foi removido de Goals/Home por risco de "tela preta" (S158/S189) — aqui ainda está |
| C36 | `ClientDetailModal` — 4 MetricCards (Total Eventos / Faturamento Real / A Receber / Horas) | | CORRIGIR | "Faturamento Real" = `Σ paid_amount` onde `paid_amount > 0` → **R$ 0 hoje** (100% dos pagos sem `paid_amount`) |
| C37 | `ClientDetailModal` — Próximos Eventos (até 3) | | MANTER | — |
| C38 | `ClientDetailModal` — Informações de Contato (email/phone/notes) | notes cru | MELHORAR | Mostra `Razão Social:` + CNPJ + CNAE (metadados) misturados nas "Observações" |
| C39 | `ClientDetailModal` — aba Linha do Tempo (`EventTimelineItem`) | | MANTER | `StatusIcon = statusConfig.icon` → `undefined` (P-6 igual à Agenda) |
| C40 | `ClientDetailModal` — aba Métricas (valor médio, conversão de pagamento, R$/hora, média horas) | | MANTER | Deriva de "Faturamento Real" zerado → métricas zeradas |
| C41 | `ClientDetailModal` — footer: Excluir · Fechar · Página Completa · Agendar Show · Editar | 5 botões | SIMPLIFICAR | — |
| C42 | `ClientDetailModal` — **sem CRM / interações** | — | CORRIGIR | `ClientInteractionLog` só existe em `/client-detail`. Usuário desktop que usa o modal nunca vê follow-ups |
| C43 | `ClientInsightsModal` (do `···`) — 3 cards: Financeiro / Estatísticas de Eventos / Atividade Recente | | POSSÍVEL REMOÇÃO | Duplica `ClientDetailModal`. Números **diferentes** dos do modal e do card (§12) |
| C44 | `ClientActionSheet` (mobile) — mini-stats (Eventos, A Receber) + contatos + ações | | MELHORAR | Sem badge Pessoa/Empresa; "A Receber" = `pendingRevenue` (difere do `/client-detail`) |
| C45 | `/client-detail` (página completa) — header + Editar/Excluir/Novo Evento | | MANTER | Caminho do mobile e do "Página Completa" |
| C46 | `/client-detail` — card "Informações de Contato" com notas editáveis inline | textarea | CORRIGIR | `saveNotes` sobrescreve `notes` inteiro → **apaga os metadados `Razão Social:`/CNPJ** se o usuário editar |
| C47 | `/client-detail` — 4 StatCards (Total Eventos / Receita Total / Total Horas / Receita Média) + faixa de avaliação (estrelas) | | MANTER | "Receita Total" = `Σ getEventRevenue` **todos** os eventos (≠ "Faturamento Real" do modal) |
| C48 | `/client-detail` — "Próximos Shows" (até 4) | `isConfirmed = status==='confirmed' || status==='scheduled'` | CORRIGIR | Trata `confirmed` e `scheduled` como **o mesmo** estado visual — apaga a distinção (viola Decisão 2) |
| C49 | `/client-detail` — "Resumo Financeiro": Recebido / Pendente / Total / Confiabilidade | | CORRIGIR | "Pendente" = **todos** os `!== 'paid'` (inclui futuros) — muito diferente do "A Receber" do card/modal |
| C50 | `/client-detail` — `ClientInteractionLog` (CRM: WhatsApp/Ligação/Email/Reunião/Outro + follow-up date) | colapsável | MELHORAR | Não dá para **marcar follow-up como concluído** — só deletar a interação inteira. Alerta `crm_followup` (Agenda) fica pendente pra sempre |
| C51 | `/client-detail` — `ReportsChart` + `ReportEventList` (histórico) | grid | MANTER | 4º/5º bloco de dados na mesma página |
| C52 | `/client-detail` — modais: `ClientForm`, `EventForm`, `EventDetailModal` (reports) | `AnimatePresence` | MANTER | — |
| C53 | Colunas legadas Base44 em `clients`: `company` (text), `total_events`, `total_spent`, `is_favorite` | **0 registros preenchidos** | POSSÍVEL REMOÇÃO | Confirmado vazio na base; nenhum código do app lê. Candidatas a cleanup de schema (fase separada) |

### 2. Mapa de componentes

```
Clients.jsx (/clients)
├── hooks: useClients (select '*', SEM join) · useEvents · useDailyWork · useFinancialVisibility · useConnectivity · useMediaQuery
├── clientsWithStats  ← calcula stats por cliente em memória (revenue, pendingRevenue, paymentScore, isActive, last/next event, unpaidEvents)
├── NeonGlass (busca + 6 filtros + 4 sorts)
├── InactiveClientsPanel (lazy)  ← recebe clientsWithStats
├── grid de Card por cliente
│   └── botão ··· → ClientInsightsModal (lazy)   ← RECALCULA stats (diferente de clientsWithStats)
├── ClientForm (lazy) ── CompanySearchInput ── {searchLocal, edge fn search-company, parseNFeXML}
│                    └── useCompanies / companyService  ── companies (tabela GLOBAL compartilhada)
├── ClientDetailModal (lazy, desktop) ── useEvents + useDailyWork  ← RECALCULA clientData (diferente de clientsWithStats E de Insights)
├── ClientActionSheet (lazy, mobile) ── recebe stats de clientsWithStats
└── ConfirmDialog (excluir)

/client-detail (ClientDetail.jsx)
├── hooks: useClients + useEvents + useDailyWork + useExpenses (4 hooks completos, filtra em memória)
├── stats  ← RECALCULA (4ª implementação de "stats do cliente")
├── ClientInteractionLog ── useClientInteractions ── client_interactions (tabela)
├── ReportsChart + ReportEventList
└── modais: ClientForm · EventForm · EventDetailModal (reports)
```

### 3. Arquitetura de dados

| Tabela | Escopo | Chave | Observação |
|---|---|---|---|
| `clients` | **por usuário** (`user_id`) | `id` | `select('*')` sem join; enriquecido em memória com eventos. Sem `cnpj`/`cpf`/`razao_social`. Tem legado `company`/`total_events`/`total_spent`/`is_favorite` (vazios) |
| `companies` | **GLOBAL — compartilhada entre todos os usuários** | `id`, dedup por `cnpj` → `name` | `created_by`. 13 registros, 1 verificada. `clients.company_id` → `companies.id` |
| `client_interactions` | por usuário | `id` | CRM: `type`, `notes`, `follow_up_date`, `created_at`. Sem "resolvido" |
| `events` | por usuário | `client_id` FK | 0 eventos sem cliente na base |

**Fluxo de criação de empresa (efeito colateral relevante):** criar/editar um cliente do tipo `empresa` **grava
automaticamente** um registro em `companies` (global) via `upsertCompanyRecord` / `linkClientToCompanyAfterCreate`
(`source: 'manual'`, `verified: false`). 12 das 13 companies da base são assim. Excluir o cliente **não remove** a company.

### 4. Jornada — criar cliente

| Caminho | Passos | Fricção |
|---|---|---|
| **Direto** (`/clients` → Novo Cliente) | toggle tipo → (empresa: buscar Receita OU manual) → nome + cor + contato + email/phone + políticas + logo → Criar | Formulário longo (1 tela rolável). Políticas de pagamento no meio competem com o básico |
| **Dentro do EventForm** (`ClientQuickCreateDialog`) | combobox → digitar (≥2) → "Criar X" → dialog aninhado (`z-[106]`, EventForm vira `modal={false}`) → (empresa: `CompanySearchInput` opcional) → Criar → volta ao form com cliente selecionado | ~5–7 toques + 2 dialogs sobrepostos. `showCreate` some se um nome de company compartilhada bate com o digitado (mostra só a linha "usar cadastro compartilhado") |
| A partir de `ClientDetailModal`/`/client-detail` → "Agendar Show" | leva a `/calendar?action=new-event&client_id=X` | OK |

### 5. Jornada — editar cliente

- Desktop: card → `ClientDetailModal` → "Editar" (fecha modal, abre `ClientForm`). **OU** `/clients` não tem edição direta no card.
- Mobile: card → `ClientActionSheet` → "Editar".
- `/client-detail` → "Editar Cliente".
- **Problemas:** `CompanySearchInput` some ao editar (C23); "Razão Social" volta em branco e some do form (C24); editar "Observações" pode apagar metadados (C46).

### 6. Jornada — abrir cliente

**4 destinos diferentes** para "ver um cliente":
1. `ClientDetailModal` (desktop, clique no card) — 3 abas
2. `ClientInsightsModal` (clique no `···`) — 3 cards
3. `ClientActionSheet` (mobile, toque no card) — sheet
4. `/client-detail` (via "Página Completa", "Ver Detalhes Completos", InactivePanel, ou mobile) — página inteira + CRM

1, 2 e 4 mostram quase a mesma informação com **números diferentes** (§12).

### 7. Jornada — cliente → evento

`ClientDetailModal`/`/client-detail`/`ClientActionSheet` → "Agendar Show" / "Novo Evento" →
`EventForm` (via `/calendar?action=new-event&client_id=X` ou `initialData={{ client_id }}`). Cliente pré-selecionado. OK.
Nota: `EventForm.handleClientChange` puxa `default_daily_cache` e `policy_default_payment_model` do cliente.

### 8. Jornada — cliente → cobrança

- Card / modal / sheet / página têm botão WhatsApp que **vira "Cobrar R$ X"** quando `pendingRevenue > 0`.
- Usa `buildChargeMessage({ clientName, events: unpaidEvents, totalAmount })`.
- **3+ formatadores de número WhatsApp diferentes**: `formatWhatsAppNumber` (Clients card, InactivePanel), inline `cleanPhone.length > 11 ? ... : '55'+...` (ClientDetailModal, ClientDetail page), `openWhatsAppCharge` (AReceber). Comportam-se diferente para números com/sem DDI.
- Sem telefone → toast + (no card) nada / (na Home) `hardNavigate('/clients')`.

### 9. Problemas encontrados

| # | Problema | Arquivo | Gravidade |
|---|---|---|---|
| CL-1 | **`paid_amount` NULL em 100% dos pagos** → "Faturamento Real" (modal) e Metas = R$ 0 | dados + `ClientDetailModal`, `goalMetrics` | P0 |
| CL-2 | **Sem coluna `cnpj`/`cpf`** em `clients`; `EventDetailModal` lê `client?.cnpj` → sempre `undefined` (card NF-e sem CNPJ) | schema + `reports/EventDetailModal.jsx:506` | P1 |
| CL-3 | **4 implementações de "stats do cliente"** com regras diferentes: `clientsWithStats` (Clients.jsx), `ClientDetailModal.clientData`, `ClientInsightsModal.insights`, `ClientDetail.stats` | 4 arquivos | P1 |
| CL-4 | **"A Receber / Pendente" do mesmo cliente diverge por tela** (§12) | 4 arquivos | P1 |
| CL-5 | **3 modais/telas de "ver cliente" quase idênticos** (`ClientDetailModal`, `ClientInsightsModal`, `/client-detail`) | — | P1 |
| CL-6 | `ClientDetailModal` **sem CRM** — follow-ups só no `/client-detail` | `ClientDetailModal.jsx` | P1 |
| CL-7 | "Razão Social" não persiste (vai para `notes`, reseta ao editar, pode duplicar) | `ClientForm.jsx` | P1 |
| CL-8 | Editar "Observações" (modal ou `/client-detail`) **sobrescreve** e pode apagar metadados `Razão Social:`/CNPJ | `ClientForm`, `ClientDetail.saveNotes` | P1 |
| CL-9 | `/client-detail` "Próximos Shows": `confirmed` e `scheduled` = mesmo visual (viola Decisão 2) | `ClientDetail.jsx:487` | P1 |
| CL-10 | `ClientDetailModal` overwrita `event.status` com `getEventStatus` (linha 219) — confunde as 2 dimensões de status | `ClientDetailModal.jsx` | P1 |
| CL-11 | `AnimatePresence mode="wait"` nas abas do `ClientDetailModal` (risco "tela preta" — removido de Goals/Home) | `ClientDetailModal.jsx:423` | P2 (INVESTIGAR) |
| CL-12 | `getEventStatusConfig(...).icon` → `undefined` (P-6, igual à Agenda) — em `EventTimelineItem`, `MetricCard`, `ClientActionSheet` | `dateUtils.jsx` + 3 componentes | P3 |
| CL-13 | 3+ formatadores de número WhatsApp divergentes | vários | P2 |
| CL-14 | Criar cliente empresa grava sempre em `companies` global (mesmo "rascunho") — polui base compartilhada | `useClients`, `companyService` | P2 (INVESTIGAR) |
| CL-15 | Filtro "Pessoas" sempre vazio hoje (`client_type='pessoa'` = 0) — feature de pessoa física subutilizada | dados | P2 |
| CL-16 | `useClients` sem JOIN → `clientsWithStats`/modais recompõem em memória | `useClients.js` | P2 |
| CL-17 | CRM: follow-up não tem "concluído" — só deletar | `ClientInteractionLog`, `useClientInteractions` | P2 |
| CL-18 | `ClientForm` código defensivo para `client_type`/`brand_color` "coluna pode não existir" — schema já tem ambas (confirmado) | `useClients.js`, `ClientForm.jsx` | P3 (limpeza) |
| CL-19 | `ClientDraftBadge` renderiza 2× no mesmo card | `Clients.jsx:527,548` | P3 |
| CL-20 | Colunas legadas Base44 vazias em `clients` | schema | P3 (cleanup separado) |

### 10. Redundâncias

| Onde | Repetição |
|---|---|
| "Ver cliente" | `ClientDetailModal` + `ClientInsightsModal` + `ClientActionSheet` + `/client-detail` — **4 superfícies** |
| "Recebido / Faturamento" do cliente | modal "Faturamento Real" · Insights "Recebido" · `/client-detail` "Recebido" — 3 números, 3 fórmulas |
| "A Receber / Pendente" do cliente | card · modal · Insights · `/client-detail` — 4 números, 3–4 fórmulas |
| Sinalização de atividade no card | badge Ativo/Inativo + dot colorido + (InactivePanel no topo) |
| "Novo evento p/ cliente" | modal footer + `/client-detail` header + `/client-detail` card "Próximos Shows" + ActionSheet |
| WhatsApp cobrança | card + modal + ActionSheet + `/client-detail` + Home AReceber |
| Avatar de cliente/empresa | `CompanyAvatar` (combobox, search) vs `Avatar` shadcn (card, modal, sheet) vs `<img>` cru (`/client-detail`) — 3 componentes |

### 11. Inconsistências

| Tipo | Detalhe |
|---|---|
| **Status** | `/client-detail` funde `confirmed`+`scheduled`; `ClientDetailModal` sobrescreve `status`; `ClientInsightsModal` usa `getEventStatus`; card usa `getEventStatus` para `completed` mas raw `status !== 'cancelled'` para "próximo evento" |
| **Financeiras** | ver §12 |
| **Modal vs Página** | modal (3 abas, sem CRM) vs página (tudo + CRM); mobile força página, desktop força modal |
| **`razao_social`** | tratada como campo mas gravada em `notes`; nunca relida |
| **CNPJ** | existe em `companies` e em `notes`; nunca em `clients`; lido de `client.cnpj` (inexistente) |
| **Nomenclatura** | "Faturamento Real" (modal) vs "Recebido" (Insights, página) vs "Receita Total" (página) — mesmo/parecido conceito |

### 12. Problemas de dados — "quanto o cliente rende" por tela

| Métrica | `Clients.jsx` card | `ClientDetailModal` | `ClientInsightsModal` | `/client-detail` |
|---|---|---|---|---|
| **Recebido** | (não mostra) | `Σ paid_amount` onde `paid_amount > 0` → **R$ 0 hoje** | `Σ (paid_amount ?? getEventRevenue)` dos `paid` | `Σ (paid_amount \|\| getEventRevenue)` dos `paid` |
| **A Receber / Pendente** | `completed && payment_status==='unpaid'` | `completed && payment_status==='unpaid'` | `completed && payment_status!=='paid'` (inclui `pending`/`partial`) | **todos** `payment_status!=='paid'` (inclui futuros/scheduled) |
| **Receita Total** | `Σ getEventRevenue` (todos) | (não mostra) | `Σ getEventRevenue` (todos) | `Σ getEventRevenue` (todos) |
| Fonte de status | `getEventStatus` | `getEventStatus` (+ overwrite) | `getEventStatus` | `getEventStatus` |

**Resultado:** o mesmo cliente pode mostrar "A Receber R$ 0" no card e "Pendente R$ 8.000" na página (se tem shows futuros não pagos).
"Recebido" pode ser R$ 0 no modal e R$ 12.000 na Insights/página.

### 13. Problemas mobile

| # | Problema |
|---|---|
| CM-1 | Toque no card → `ClientActionSheet` (mini-stats + ações) → "Ver Detalhes" → **navega para `/client-detail`** (troca de tela, não modal) — 2 contextos |
| CM-2 | ActionSheet sem indicação Pessoa/Empresa (só iniciais) |
| CM-3 | Barra de filtros: 6 botões + 4 sorts → quebra em várias linhas em mobile |
| CM-4 | `/client-detail` carrega 4 hooks completos (`useClients+useEvents+useDailyWork+useExpenses`) para 1 cliente |
| CM-5 | Tablet retrato (768–1024px) usa o caminho desktop (modal), não o sheet |

### 14. Problemas de UX (carga cognitiva)

- Página Clientes: header + (erro) + **barra de busca/filtro/sort com 12 controles** + InactivePanel + grid de cards densos (cada card = avatar + nome + 2 badges + dot + política + 2 stats + próx.show + barra confiabilidade + 3 ícones).
- **O que o usuário precisa AGORA numa lista de clientes?** Nome, se deve dinheiro, quando foi o último/próximo show, botão de contato. O resto (confiabilidade %, política H.E./M&D, tipo) é secundário.
- 3 formas de "ver detalhes" com números que não batem = desconfiança nos dados.

### 15. Riscos técnicos

| # | Risco | Gravidade |
|---|---|---|
| CT-1 | 4 implementações de stats do cliente (CL-3) | Alta |
| CT-2 | `companies` global escrita a cada criação de cliente empresa — sem limpeza; base compartilhada cresce com "rascunhos" de todos os usuários | Média |
| CT-3 | `notes` como armazenamento estruturado (razão social, CNPJ, CNAE) — frágil, editável, sem parsing na volta | Média |
| CT-4 | `AnimatePresence mode="wait"` no `ClientDetailModal` (CL-11) | Média |
| CT-5 | `useClients` sem JOIN (CL-16) | Média |
| CT-6 | Código defensivo "coluna pode não existir" mascara erros reais de schema | Baixa |
| CT-7 | Alias offline de `@/lib/useClients` (S181) — confirmar interceptação (mesma dúvida da Agenda T-7) | Média (INVESTIGAR) |

### 16. Classificação P0 / P1 / P2 / P3

**P0**
- CL-1 — `paid_amount` NULL 100% → "Faturamento Real" e Metas zerados (é o mesmo P0 global de valor recebido).

**P1**
- CL-2 — sem coluna CNPJ/CPF; `client.cnpj` inexistente quebra NF-e.
- CL-3 / CL-4 / CL-12(dados) — 4 stats divergentes; "A Receber/Recebido" não batem entre card/modal/insights/página.
- CL-5 — 3 superfícies de "ver cliente" quase idênticas.
- CL-6 — CRM ausente no `ClientDetailModal`.
- CL-7 / CL-8 — "Razão Social" não persiste; editar notas apaga metadados.
- CL-9 / CL-10 — status de negócio × temporal confundidos (viola Decisão 2).

**P2**
- CL-11 (INVESTIGAR `mode="wait"`), CL-13 (WhatsApp formatters), CL-14 (companies global polui), CL-15 (pessoa subutilizada), CL-16 (sem JOIN), CL-17 (follow-up sem "concluído"), CT-2, CT-7.
- Barra de filtros/controles densa demais (§14).

**P3**
- CL-12 (`icon` undefined), CL-18 (código defensivo), CL-19 (draft badge 2×), CL-20 (colunas legadas), CM-2.

### 17. Oportunidades de simplificação

Aplicando a hierarquia desejada (ESSENCIAL AGORA → AÇÃO PRINCIPAL → INFO SECUNDÁRIA → VER DETALHES → AVANÇADO):

1. **Card de cliente enxuto**: nome + status (1 sinal só) + "deve R$ X" (se houver) + próximo/último show + 1 ação (WhatsApp/Cobrar). Confiabilidade %, política, tipo, barra → dentro do detalhe.
2. **Uma superfície de detalhe**: fundir `ClientInsightsModal` no `ClientDetailModal`; `ClientDetailModal` e `/client-detail` compartilham o mesmo componente de conteúdo (modal = wrapper). CRM entra nos dois.
3. **Barra de controles**: busca sempre visível; filtros num dropdown "Filtrar"; sort num dropdown "Ordenar". InactivePanel → um card discreto "N inativos" no fim da lista.
4. **Um helper de stats do cliente** (deriva do helper global de competência).
5. **CNPJ/CPF como campo de verdade** (coluna) — resolve NF-e, busca por razão social, e tira metadados do `notes`.
6. **"Razão Social" como campo real** (ou coluna, ou dentro de `companies`).

### 18. Possíveis remoções — PARA DISCUSSÃO (não autoriza remover)

- `ClientInsightsModal` — funde no `ClientDetailModal`.
- Colunas legadas `clients.company` / `total_events` / `total_spent` / `is_favorite` — vazias, sem leitura.
- Um dos 3 componentes de avatar (`CompanyAvatar` vs `Avatar` vs `<img>`).
- Filtro "Pessoas/Empresas" como botões separados → um toggle no dropdown de filtro.
- `<img>` cru de logo no `/client-detail` → usar `CompanyAvatar` (fallback consistente).

### 19. Dependências com Agenda / Home / Relatórios

| Dependência | Detalhe |
|---|---|
| **Helper de competência/valor (P0 global)** | `clientsWithStats`, `ClientDetailModal`, `ClientInsightsModal`, `/client-detail` todos precisam do mesmo helper que Home/Metas/Relatórios |
| **`getEventStatus` / status de negócio** | `ClientDetail`/`ClientDetailModal` consomem e confundem as 2 dimensões — mesma decisão global |
| **`EventDetailModal` (reports)** | `/client-detail` usa o mesmo modal que a Agenda — unificação AG-07 afeta Clientes |
| **`EventForm` + `ClientQuickCreateDialog`** | fluxo "cliente novo dentro do evento" compartilhado com a Agenda (AG relacionado) |
| **`AlertsPanel` (Agenda/Home)** | consome `fetchPendingFollowUps` de `client_interactions` — mudança no CRM afeta os alertas |
| **`clients.company_id` → `companies`** | busca de empresa (`CompanySearchInput`) usada em `ClientForm` **e** `EventForm` |
| **`policy_default_payment_model` / `default_daily_cache`** | lidos por `EventForm.handleClientChange` e `DailyWorkModal.calculateCache` |
| **`pendingRevenue` do card** | mesma regra de "A Receber" que Home `AReceber` deveria usar |

### 20. Tabela de handoff futura (Clientes)

> Só entra na fila do Cursor **após revisão estratégica**. Um item por vez.

| ID | Título | Arquivos | Tipo | Prioridade | Depende de |
|---|---|---|---|---|---|
| CLI-01 | Helper único de stats do cliente (deriva do helper de competência global) | novo `src/lib/clientStats.js` | refactor | P0/P1 | helper global (AG-01) |
| CLI-02 | `Clients.jsx` / `ClientDetailModal` / `ClientInsightsModal` / `/client-detail` usam CLI-01 | 4 arquivos | refactor | P1 | CLI-01 |
| CLI-03 | Coluna `cnpj` (e `cpf`?) em `clients` + campo no `ClientForm` + leitura no `EventDetailModal` | migration + `ClientForm.jsx` + `reports/EventDetailModal.jsx` | feature | P1 | decisão de schema (usuário) |
| CLI-04 | "Razão Social" como campo real (coluna ou via `companies`) — parar de gravar em `notes` | `ClientForm.jsx` + migration | fix | P1 | decisão de schema |
| CLI-05 | Separar metadados de `notes` (não sobrescrever ao editar) | `ClientForm.jsx`, `ClientDetail.saveNotes` | fix | P1 | CLI-03/04 |
| CLI-06 | Fundir `ClientInsightsModal` no `ClientDetailModal`; conteúdo compartilhado modal ↔ `/client-detail`; CRM nos dois | `components/clients/*`, `pages/ClientDetail.jsx` | refactor grande | P1 | CLI-02, AG-07 |
| CLI-07 | `/client-detail` "Próximos Shows": distinguir `confirmed` de `scheduled` (Decisão 2) | `ClientDetail.jsx` | fix | P1 | modelo de status |
| CLI-08 | `ClientDetailModal`: parar de sobrescrever `event.status` | `ClientDetailModal.jsx` | fix | P1 | modelo de status |
| CLI-09 | Card de cliente enxuto (hierarquia §17.1) | `Clients.jsx` | UX | P2 | CLI-02 |
| CLI-10 | Barra de controles: filtros/sort em dropdown; InactivePanel discreto | `Clients.jsx`, `InactiveClientsPanel.jsx` | UX | P2 | — |
| CLI-11 | Um formatador de número WhatsApp (`@/lib/whatsapp`) em todos os pontos | vários | limpeza | P2 | — |
| CLI-12 | CRM: marcar follow-up como concluído | `ClientInteractionLog.jsx`, `useClientInteractions.js`, migration (coluna `done`?) | feature | P2 | — |
| CLI-13 | INVESTIGAR: `mode="wait"` no `ClientDetailModal`; alias offline de `useClients`; escrita em `companies` global | `ClientDetailModal.jsx`, `vite.config.js`, `companyService.js` | investigação | P2 | — |
| CLI-14 | `ClientDraftBadge` 1× por card; `getEventStatusConfig` `icon` ou parar de ler | `Clients.jsx`, `dateUtils.jsx` + 3 | limpeza | P3 | — |
| CLI-15 | Cleanup de colunas legadas Base44 em `clients` | migration | limpeza | P3 (fase separada) | — |
| CLI-16 | Um componente de avatar de cliente/empresa | `components/clients/*` | limpeza | P3 | — |

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
| 2026-08-28 | Decisões aprovadas + P0 parciais | Claude Code | Registradas: Modelo oficial de competência (paid_date=recebido, evento=projetado, expense_date=despesa, trabalho=diária, "a receber" a definir); regra do valor recebido (`??` não `||`); P0 pagamentos parciais (`partial` = estado órfão, 0 na base); Status de Negócio × Temporal (proibido aplicar "chips usam getEventStatus"). 4 SELECTs read-only: `paid_amount` NULL 100%, 5 eventos `status='confirmado'` (pt) do Google, `partial`=0, `clients` sem coluna CNPJ |
| 2026-08-28 | Trilha A — Clientes + `/client-detail` (READ-ONLY) | Claude Code | 20 partes; 53 itens; CL-1..CL-20; ranking; handoff CLI-01..CLI-16. Sem alteração `src/`. Achados: `paid_amount` NULL→Metas/"Faturamento Real" zerados; sem coluna CNPJ→NF-e sem tomador; 4 stats de cliente divergentes; 3 superfícies de "ver cliente"; razão social gravada em `notes` |
