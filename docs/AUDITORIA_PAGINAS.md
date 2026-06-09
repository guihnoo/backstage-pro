# Auditoria página a página — Backstage Pro

> Checklist vivo para revisão premium. Marque `[x]` quando validado em **mobile + desktop** após deploy.  
> Legenda: 🟢 OK · 🟡 Ajustar · 🔴 Quebrado · ⬜ Não revisado

**Última rodada geral:** 2026-06-09 (parcial — smoke E2E + fix lazy routes)  
**Produção:** https://backstage-pro-beta.vercel.app

---

## Como auditar cada item

1. Abrir a rota logado (ou seed E2E)
2. Rolagem da **página** (conteúdo maior que viewport)
3. Abrir **cada modal/sheet** → rolagem interna + fundo não rola
4. Registrar em `RELATORIO_VIDA_APP.md` se corrigir algo

---

## Rotas públicas

| Rota | Página | Scroll | Modais | E2E | Status | Notas |
|------|--------|--------|--------|-----|--------|-------|
| `/login` | LoginNew | ⬜ | — | ⬜ | ⬜ | |
| `/signup` | SignupNew | ⬜ | — | ⬜ | ⬜ | |
| `/onboarding` | Onboarding | ⬜ | — | ⬜ | ⬜ | 5 steps — validar teclado mobile |
| `/privacidade` | PrivacyPolicy | ⬜ | — | ⬜ | ⬜ | |
| `/termos` | TermsOfService | ⬜ | — | ⬜ | ⬜ | |

---

## Home `/`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página inteira (`Home.jsx`) | ⬜ | 🟡 | LOCKED — revisar sem quebrar hooks |
| Card Próximo Show / Modo Palco | ⬜ | 🟢 | Check-in GPS implementado |
| QuickStats → StatDetailModal | ⬜ | 🟡 | Tem `ScrollArea fill` — validar mobile |
| Pipeline / Alertas | ⬜ | ⬜ | |
| FAB / FloatingActions | ⬜ | ⬜ | |
| ProximosEventos lista | ⬜ | ⬜ | |

**Testes:** bottom-nav smoke ✅ · calendar-navigation ✅

---

## Agenda `/calendar`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`Calendar.jsx`) | ⬜ | 🟢 | Fix lazy routes 2026-06-09 |
| EventForm | ⬜ | 🟡 | `ScrollArea fill` |
| EventDetailModal | ⬜ | 🟡 | Local + GPS |
| DailyWorkModal | ⬜ | 🟡 | |
| DateInfoModal | ⬜ | 🟡 | |
| RecurringEventActionModal | ⬜ | 🟡 | |
| EventTemplateModal | ⬜ | 🟡 | |
| DayBottomSheet / DayQuickActions | ⬜ | ⬜ | Bug `eventsToRegister` corrigido |
| EventActionSheet (mobile) | ⬜ | 🟡 | `useAppScrollLock` |
| EventHoursSheet | ⬜ | 🟡 | |
| AlertsPanel | ⬜ | 🟢 | Check-in local hoje |

**Testes:** calendar-navigation ✅ · event-form auth ✅

---

## Clientes `/clients`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página lista + filtros | ⬜ | 🟡 | Filtro Rascunhos |
| ClientForm | ⬜ | 🟡 | LOCKED |
| ClientDetailModal | ⬜ | 🟡 | |
| ClientInsightsModal | ⬜ | 🟡 | |
| ClientActionSheet | ⬜ | 🟡 | |
| CompanySearchInput (busca CNPJ) | ⬜ | 🟢 | Sessão 9 — Edge Function |

**Testes:** routes-auth ✅

---

## Detalhe cliente `/client-detail`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | ⬜ | ⬜ | Validar após lazy fix |

---

## Despesas `/expenses`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | ⬜ | ⬜ | |
| ExpenseForm | ⬜ | 🟡 | LOCKED |
| ReceiptAnalyzer | ⬜ | 🟡 | OCR “em breve” se Base44 off |

**Testes:** expense-form auth ✅

---

## Relatórios `/reports`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página (`Reports.jsx`) | ⬜ | 🟡 | LOCKED parcial |
| EventDetailModal | ⬜ | 🟡 | |
| DrilldownModal | ⬜ | 🟡 | |
| KPIDetailModal | ⬜ | ⬜ | Verificar scroll |
| PaymentConfirmModal | ⬜ | 🟡 | |
| EventListModal | ⬜ | 🟡 | |
| DashboardCustomizer | ⬜ | 🟡 | |
| BrazilVisitedMap | ⬜ | 🟢 | Lazy subcomponent OK |
| ExportManager PDF/CSV | ⬜ | 🟢 | Implementado |

**Testes:** routes-auth ✅ · reports-guards regression

---

## Metas `/goals`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | ⬜ | ⬜ | Badge sheet — sessão 6 |
| Modais de badge / alertas | ⬜ | ⬜ | |

---

## Perfil `/profile`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página ProfileSimple | ⬜ | 🟢 | Smoke profile ✅ |
| GoogleCalendarSync | ⬜ | 🟡 | OAuth E2E manual pendente |
| Visibilidade financeira | ⬜ | 🟢 | Supabase sync |

---

## AI Mentor `/ai-mentor`

| Item | Scroll | Status | Notas |
|------|--------|--------|-------|
| Página | ⬜ | ⬜ | LOCKED |
| Chat / SourcesModal | ⬜ | ⬜ | |

---

## Modais globais / compartilhados

| Componente | Scroll | Status |
|------------|--------|--------|
| ConfirmDialog | ⬜ | 🔴 **Provável sem scroll** — auditar |
| FeedbackModal | ⬜ | 🟡 |
| NotificationCenter | ⬜ | ⬜ |
| alert-dialog base | ⬜ | ⬜ |

---

## Bugs conhecidos (não repetir)

| Bug | Status | Fix / commit |
|-----|--------|----------------|
| Lazy routes travam em Carregando | ✅ Corrigido | `ed46dfc` — imports estáticos |
| `eventsToRegister` filtro errado | ✅ Corrigido | AGENT_LOG 2026-06-07 |
| Toast overlay z-100 bloqueava cliques | ✅ Corrigido | AGENT_LOG |
| Scroll fundo com modal aberto | 🟡 Parcial | Várias sessões scroll — revalidar |

---

## Próxima sprint de auditoria (ordem sugerida)

1. [ ] **Agenda** — todos os modais em iPhone SE + Android
2. [ ] **Relatórios** — KPIDetailModal + página longa
3. [ ] **Despesas + Goals** — forms longos
4. [ ] **Clientes** — ClientForm com busca empresa
5. [ ] **Home** — StatDetailModal + scroll página
6. [ ] **ConfirmDialog** — adicionar `bp-modal-scroll` se necessário
