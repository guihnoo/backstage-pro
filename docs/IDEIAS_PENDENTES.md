# Ideias e pedidos do usuário — Backstage Pro

> Tudo que foi pedido e **ainda não está 100%** — ou precisa revalidação pós-deploy.  
> Atualize status: `⬜ Pendente` · `🔄 Em progresso` · `✅ Feito` · `🟡 Feito — precisa polish` · `❌ Cancelado`

**Fontes:** conversas Cursor/Claude, `RELATORIO_VIDA_APP.md`, `STRATEGIC_ANALYSIS_REPORT.md`

---

## UX / Premium (pedidos recorrentes)

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 1 | App **premium** — sensação native PWA, animações Framer | 🔄 | Várias telas OK; polish contínuo |
| 2 | **Revisão página a página** com testes e correções scroll/modais | ✅ | Sessão 10 — auditoria completa, todas 🟢 |
| 3 | Cards/páginas/modais **sem rolagem** — corrigir todos | ✅ | Sessão 10 — todos os padrões validados |
| 4 | Gráficos financeiros animados no dashboard | ✅ | Sprint C1 — AreaChart + gradientes + AnimatePresence |
| 5 | Relógios dinâmicos / dados em tempo real na Home | ✅ | Cursor sessão 15 — `LiveClockBar`, `AnimatedStatValue`, `useLiveClock` |
| 6 | Modais CRM automatizados (fluxos inteligentes) | ⬜ | |
| 7 | Celebração ao desbloquear badge (Goals) | ✅ | `BadgeCelebration` implementado — partículas + auto-close |

---

## Funcionalidades

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 8 | Google Calendar OAuth + sync completo | 🟡 | UI pronta; checklist E2E manual pendente |
| 9 | Local do evento (endereço + GPS check-in) | ✅ | EventLocationSection, Modo Palco |
| 10 | Mapa Brasil visitados (relatórios) | ✅ | BrazilVisitedMap |
| 11 | Alertas agenda — check-in local hoje | ✅ | AlertsPanel |
| 12 | Busca inteligente empresas / CNPJ compartilhado | ✅ | migrations 020 + Edge Function + NF-e XML sessão 10 |
| 13 | Export PDF/CSV relatórios | ✅ | exportReport.js |
| 14 | OCR recibo despesas (ReceiptAnalyzer) | ✅ | Gemini Vision via Edge Function `analyze-receipt`; auto-preenche form |
| 15 | PWA offline refinado + sync estado | ⬜ | PWA_ROADMAP |
| 16 | Push notifications | ✅ | VAPID keys + cron 8h/18h + service worker + UI Perfil; reativar no Perfil após próximo deploy |
| 17 | Code-split **seguro** (sem travar rotas) | ✅ | Cursor Sprint PERF-SPA-LAZY — bundle principal ~263 KB; todas as rotas lazy + Suspense ✅ |
| 18 | Dedupe eventos Google Calendar | 🟡 | Botão no Perfil — validar |

---

## Estabilidade / processo (pedido atual)

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 19 | **Registrar vida do app** (Cursor + Claude Code) | ✅ | Sessão 9–10: `CLAUDE.md`, RELATORIO, AUDITORIA, IDEIAS, AGENT_LOG |
| 20 | Não repetir bugs (lazy routes, scroll, OAuth) | 🔄 | Seção “Bugs conhecidos” em AUDITORIA |
| 21 | Check-in em itens prontos sem quebrar o que funciona | 🔄 | LOCKED em AGENTS.md |
| 22 | Testes E2E smoke em cada release | ✅ | 17 smoke tests — expenses, goals, clients, reports |

---

## Segurança / ops

| # | Ideia | Status |
|---|-------|--------|
| 23 | Rotacionar GOOGLE_CLIENT_SECRET | ⬜ |
| 24 | OAuth app sair de modo Testing (GCP) | ⬜ |
| 25 | Nunca commitar `client_secret_*.json` | ✅ Regra documentada |

---

## Ideias novas (adicionar aqui quando o usuário pedir)

| # | Ideia | Data | Status |
|---|-------|------|--------|
| 26 | PDF de fechamento de evento (relatório final para cliente) | 2026-06-09 | ✅ `EventPDFDocument` + `@react-pdf/renderer` |
| 27 | Template de fechamento configurável no Perfil | 2026-06-09 | ✅ Campos: nome, subtítulo, PIX |
| 28 | Campo Razão Social separado do Nome Fantasia no cadastro | 2026-06-09 | ✅ `ClientForm` + `CompanySearchInput` |
| 29 | Importar dados de empresa via NF-e XML | 2026-06-09 | ✅ Parse local no browser, extrai dest/emit |
| 30 | Busca por CNPJ dedicada (sem pesquisa por nome) | 2026-06-09 | ✅ Aba CNPJ no `CompanySearchInput` |
| 31 | Goals: mostrar A Receber nos círculos de progresso | 2026-06-09 | ✅ 3° círculo âmbar |
| 32 | Expenses: agrupar despesas por mês | 2026-06-09 | ✅ `MonthGroup` com collapse animado |
| 33 | Criar empresa inline no EventForm com busca CNPJ | 2026-06-09 | ✅ `ClientQuickCreateDialog` + `ClientCombobox` |
| 34 | Diferenciar **Empresa** vs **Pessoa** no cadastro de clientes | 2026-06-10 | ✅ Migration `022_clients_type.sql` + toggle em `ClientForm`, `ClientCombobox`, `ClientDetailModal`, `ClientDetail.jsx`, `Clients.jsx`, `ClientQuickCreateDialog` |

---

## Como usar (agentes)

1. Usuário pede feature → adicionar linha com `⬜`
2. Ao implementar → `🔄` durante trabalho → `✅` ou `🟡` ao terminar
3. Referenciar commit/deploy na coluna notas
4. Se descartar → `❌` com motivo
