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

### 1. Home `/` — ⬜ não auditada

| Item | Funciona? | Claro? | Uso | Status | Spec de correção |
|---|---|---|---|---|---|
| _(preencher na sessão de auditoria)_ | | | | | |

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
| Receita paga do mês | | | | `paid_date \|\| start_date` | ⬜ |
| A receber | | | | eventos não pagos | ⬜ |
| Nº de diárias / shows | | | | `diarias_count` (dias únicos) | ⬜ |
| Meta vs realizado | | | | — | ⬜ |
| Despesas do mês | | | | `expense.date` | ⬜ |
| Resultado líquido | | | | receita − despesas | ⬜ |

> Histórico relevante: S120–S124 já corrigiu `paid_date` em vários lugares; S158 achou `useEvents.js`
> (CRUD) sem JOIN de cliente. Provável que ainda haja divergências de competência (data de pagamento
> vs data do show) e de fonte de cachê (`daily_cache_value` vs `getEventCacheAmount`).

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
