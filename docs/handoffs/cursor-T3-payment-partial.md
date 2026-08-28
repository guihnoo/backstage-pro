# Handoff — Pagamento parcial (`payment_status: partial`)

**Agente:** Cursor (Trilha Técnica) — investigação READ-ONLY  
**Data:** 2026-08-28  
**Decisão estratégica:** pendente (auditoria Claude / AG)

---

## Resumo executivo

`partial` é **lido** em vários pontos como “ainda não pago / a receber”, mas **nenhum fluxo de UI no `src/` grava `payment_status: 'partial'`**. O único caminho de confirmação de pagamento (`PaymentConfirmModal`) sempre grava `paid`.

---

## Onde `partial` é LIDO

| Arquivo | Uso |
|---------|-----|
| `src/lib/eventFinance.js` | `UNPAID_STATUSES` inclui `partial` → `isReceivableEvent` trata como a receber |
| `src/lib/useHomeDashboard.js` | Filtro `payment_status.in.(pending,unpaid,partial)` para alertas/a receber |
| `src/lib/useReceivable.js` | Query Supabase `.in('payment_status', ['pending','unpaid','partial'])` |
| `src/lib/useBackstageData.js` | Idem em KPIs |
| `src/pages/Calendar.jsx` | Label ICS export: `'Parcial'` quando `payment_status === 'partial'` |

## Onde `partial` é ESCRITO

**Nenhum arquivo em `src/`** define `payment_status: 'partial'`.

Possíveis origens:

- Dados legados no banco (migração manual / import antigo)
- Scripts externos não versionados
- Edição direta no Supabase

## `PaymentConfirmModal` (`src/components/reports/PaymentConfirmModal.jsx`)

| Campo | Comportamento |
|-------|---------------|
| Prefill valor | `event.paid_amount \|\| getEventCacheAmount(event)` |
| Ao confirmar | Sempre `payment_status: 'paid'` + `paid_amount` + `paid_date` + `payment_method` |
| Pagamento parcial | **Não suportado** — não há UI para valor menor que o cachê com status `partial` |

## Significado de `paid_amount`

| Contexto | Comportamento atual |
|----------|---------------------|
| `paidRevenueInMonth` (`goalMetrics.js`) | Soma `Number(e.paid_amount) \|\| 0` para `payment_status === 'paid'` |
| `getEventCacheAmount` | **Ignora** `paid_amount` — usa actual/estimated/daily_cache |
| `isReceivableEvent` | Só olha `payment_status`, não `paid_amount` |
| Evento `paid` + `paid_amount: 0` | Não é recebível (`payment_status === 'paid'`) |

## `paid_date`

- Gravado apenas via `PaymentConfirmModal` no fluxo de confirmação.
- `paidRevenueInMonth` usa `paid_date \|\| start_date` para competência mensal.
- Não há fluxo que grave `partial` + `paid_date` parcial.

## Saldo / histórico

- **Não existe** tabela ou campo de histórico de pagamentos parciais.
- **Não existe** cálculo de saldo restante (`total - paid_amount`) no código atual.
- `partial` é binário na prática: entra no bucket “a receber” com valor total do evento (`getEventCacheAmount` / daily_work).

## Impacto por tela

| Tela | Impacto de `partial` |
|------|----------------------|
| **Home** | Conta em a receber / alertas (via hooks) |
| **Agenda** | Label “Parcial” só no export ICS |
| **Metas** | `partial` não entra em receita paga; pode inflar “a receber” se evento completed |
| **Relatórios** | Incluído em queries de a receber; sem UI dedicada a parcial |

## Testes de caracterização criados

- `src/lib/eventFinance.test.js` — `partial` tratado como recebível quando completed
- `src/lib/goalMetrics.test.js` — `partial` não entra em receita paga do mês

## Perguntas para decisão estratégica (auditoria)

1. `partial` deve existir como status de produto ou é legado morto?
2. Se existir: UI de pagamento parcial + saldo + histórico?
3. Competência: `paid_amount` parcial conta na meta/receita paga ou só quando `paid`?
4. Migrar registros `partial` existentes no DB para `unpaid` + `paid_amount`?
