# Plano de Revisão Geral — Backstage Pro

> Segundo eixo de auditoria: **clareza de produto e completude funcional**.
> A auditoria técnica (scroll/z-index/mobile) já está madura em `AUDITORIA_PAGINAS.md`.
> Este documento ataca: "isso funciona de verdade no meu dia a dia?" e "por que tem tanta coisa na tela?".

**Criado:** 2026-08-28 (Claude Code)
**Status:** 🔄 Fase 0 concluída — iniciando Trilha A (inventário)

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

### 2. Agenda `/calendar` — ⬜

| Item | Funciona? | Claro? | Uso | Status | Spec |
|---|---|---|---|---|---|
| | | | | | |

### 3. EventDetailModal — ⬜

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

## Jornadas críticas (teste como usuário, não como dev)

Cada jornada = fluxo end-to-end. Critério de sucesso: completar sem "cadê isso?" ou "e agora?".

| # | Jornada | Telas | O que validar | Status |
|---|---|---|---|---|
| J1 | Primeiro uso | Login → Onboarding → Home vazia → 1º evento | Tour faz sentido? Empty states guiam? | ⬜ |
| J2 | Dia do show | Home (Próximo Show) → Modo Palco → Horas → Realizado | GPS, timer, registro de horas fluem? | ⬜ |
| J3 | Fechar o mês | Agenda → EventDetail → Pago → Metas → Relatórios | **Números batem entre telas?** Meta vs recebido? | ⬜ |
| J4 | Cliente novo → cobrança | Clientes → Evento → WhatsApp/PIX → NF-e | CRM + cobrança + fiscal fecham o ciclo? | ⬜ |
| J5 | Offline → volta online | Sem internet → editar → reconectar | Sincroniza? Perde algo? | ⬜ |

---

## Foco especial: "números que não bater" (pedido explícito do usuário)

Rastrear, para cada valor exibido em mais de uma tela, **qual fonte e qual regra de competência**:

| Valor | Home | Relatórios | Metas | Regra esperada | Bate? |
|---|---|---|---|---|---|
| Receita paga do mês | `computeStats`: datas do evento no mês + `paid`; valor `paid_amount \|\| eventValue(e)` | _(verificar)_ | `paidRevenueInMonth`: `paid_date \|\| start_date` no mês; valor `paid_amount \|\| 0` | `paid_date \|\| start_date`, mesmo helper de valor | 🔴 **NÃO** — Home usa data do show; Metas usa data do pagamento. E valor: Home tem fallback `eventValue`, Metas não |
| A receber | `sumReceivableAmount` = `calculateEventReceivableAmount` por evento (all-time) | _(verificar)_ | _(verificar)_ | mesmo helper em todas | 🟡 dentro da Home bate (AReceber e Pipeline usam o mesmo helper); falta comparar com Relatórios |
| Nº de diárias / shows | `countUniqueWorkDays(monthWork)` filtrado por `w.date` | _(verificar)_ | _(verificar — provável mesmo helper)_ | `countUniqueWorkDays` | ⬜ |
| Meta vs realizado | `MetaMensalBar` usa `stats.faturamento_pago` (regra da Home) | — | `Goals.jsx` usa `paidRevenueInMonth` (regra de Metas) | regra única | 🔴 **NÃO** — consequência direta da linha 1 |
| Despesas do mês | `Home.jsx`: `expense_date \|\| date` no mês | _(verificar)_ | — | campo único de data de despesa | ⬜ |
| Resultado líquido | `PipelineFinanceiro`: `faturamento_pago − despesasMes` | _(verificar)_ | — | receita − despesas, mesma competência | ⬜ |

> **Achado principal (2026-08-28):** `src/lib/useHomeDashboard.js` `computeStats()` calcula "recebido" por
> **data do show** (`start_date`/`end_date` no mês); `src/lib/goalMetrics.js` `paidRevenueInMonth()` calcula por
> **data do pagamento** (`paid_date || start_date`). São regras de competência diferentes para o mesmo número —
> por isso Home e Metas mostram valores diferentes. Além disso o helper de valor difere
> (`paid_amount || eventValue(e)` vs `paid_amount || 0`).
>
> **Fix proposto (Cursor):** `computeStats` deve usar a mesma regra de `goalMetrics` — extrair
> `paidRevenueInMonth` para um helper compartilhado e reusar na Home. Depois revalidar Relatórios contra o mesmo helper.
>
> Histórico: S120–S124 corrigiu `paid_date` em Reports/Goals/IRSummary mas **não tocou `useHomeDashboard`**.
> S158 achou `useEvents.js` (CRUD) sem JOIN de cliente.

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
