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
| 6 | Modais CRM automatizados (fluxos inteligentes) | ✅ | S32: painel "Próximos Passos" em `EventDetailModal` — checklist horas+pagamento, "Evento fechado 🎉" quando tudo ok (`b9363ce`) |
| 7 | Celebração ao desbloquear badge (Goals) | ✅ | `BadgeCelebration` implementado — partículas + auto-close |

---

## Funcionalidades

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 8 | Google Calendar OAuth + sync completo | 🟡 | UI + smoke E2E mock; OAuth real requer checklist manual em produção |
| 9 | Local do evento (endereço + GPS check-in) | ✅ | EventLocationSection, Modo Palco |
| 10 | Mapa Brasil visitados (relatórios) | ✅ | BrazilVisitedMap — marcadores recalibrados S39 |
| 11 | Alertas agenda — check-in local hoje | ✅ | AlertsPanel |
| 12 | Busca inteligente empresas / CNPJ compartilhado | ✅ | migrations 020 + Edge Function + NF-e XML sessão 10 |
| 13 | Export PDF/CSV relatórios | ✅ | exportReport.js |
| 14 | OCR recibo despesas (ReceiptAnalyzer) | ✅ | Gemini Vision via Edge Function `analyze-receipt`; auto-preenche form |
| 15 | PWA offline refinado + sync estado | ✅ | S32: `usePWA` hook + `InstallPwaCard` (Perfil) + OfflineBanner "reconectado" + `backstage:reconnect` event |
| 16 | Push notifications | ✅ | VAPID keys + cron 8h/18h + service worker + UI Perfil; reativar no Perfil após próximo deploy |
| 17 | Code-split **seguro** (sem travar rotas) | ✅ | Cursor Sprint PERF-SPA-LAZY — bundle principal ~263 KB; todas as rotas lazy + Suspense ✅ |
| 18 | Dedupe eventos Google Calendar | ✅ | `googleEventDedupe` + unit tests + smoke E2E no Perfil |

---

## Estabilidade / processo (pedido atual)

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 19 | **Registrar vida do app** (Cursor + Claude Code) | ✅ | Sessão 9–10: `CLAUDE.md`, RELATORIO, AUDITORIA, IDEIAS, AGENT_LOG |
| 20 | Não repetir bugs (lazy routes, scroll, OAuth) | 🔄 | Seção “Bugs conhecidos” em AUDITORIA |
| 21 | Check-in em itens prontos sem quebrar o que funciona | 🔄 | LOCKED em AGENTS.md |
| 22 | Testes E2E smoke em cada release | ✅ | 28 smoke tests — google-calendar-sync, goals-streak, admin-feedbacks, etc. |

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
| 35 | Busca de eventos na Agenda (título, cliente, local) | 2026-06-12 | ✅ `searchQuery` state + campo Search + lista de resultados cross-mês em `Calendar.jsx` |
| 36 | Vista em lista na Agenda (alternativa ao grid mensal) | 2026-06-12 | ✅ Toggle Grid/Lista + `listViewGroups` useMemo + render condicional em `Calendar.jsx` |
| 37 | Botão Duplicar evento no modal de detalhe | 2026-06-12 | ✅ `Copy` icon + `onDuplicate` prop em `EventDetailModal`; prefill inclui localização |
| 38 | Agendar show diretamente de um cliente | 2026-06-12 | ✅ Botão "Agendar Show" em `ClientDetailModal` + "Agendar Novo Show" em `ClientActionSheet`; Calendar lê `?client_id=` e pré-seleciona |
| 39 | Export ICS da Agenda (importar no Google/Apple Calendar) | 2026-06-12 | ✅ `exportCalendarIcs` em `exportReport.js`; botão ↓ ao lado do toggle Grid/Lista; exporta eventos filtrados |
| 40 | Próximos Shows por cliente em ClientDetail | 2026-06-12 | ✅ Seção indigo antes do Resumo Financeiro; lista até 4 eventos futuros com data, local, badge, valor |
| 41 | Marcar evento como Pago diretamente na lista do calendário | 2026-06-12 | ✅ Botão `BadgeCheck` inline na vista lista para eventos concluídos/confirmados não pagos |
| 42 | Período "Esta Semana" nos Relatórios | 2026-06-12 | ✅ `PERIOD_OPTIONS` + case `this_week` em `Reports.jsx` |
| 43 | Export ICS no ExportManager dos Relatórios | 2026-06-12 | ✅ Botão ICS azul em `ExportManager.jsx`; exporta eventos do período filtrado |
| 44 | Vista Semanal na Agenda (Week View) | 2026-06-12 | ✅ Toggle Grid/Semana/Lista; 7 colunas scroll-x mobile; banner hoje; cor do evento; horário; +N mais; resumo semanal |
| 45 | Vista "Próximos Shows" na Agenda | 2026-06-13 | ✅ Botão ⚡ — lista futuros agrupados (Hoje/Amanhã/Esta semana/…) com countdown, valor, indicador vencido/pago |
| 46 | Mapa de atividade anual (heatmap) em Relatórios | 2026-06-13 | ✅ Aba "Atividade" em Reports — grade 52×7 estilo GitHub; tooltip; legenda de escala |
| 47 | Avaliação de cliente por evento (1-5 estrelas) | 2026-06-13 | ✅ Migration 031; widget estrelas em EventDetailModal (concluídos); média em ClientDetail |
| 48 | Observações do evento visíveis no EventDetailModal | 2026-06-13 | ✅ Seção `observacoes_md` exibida quando preenchida |
| 49 | Rastreamento de NF em Relatórios (aba Fiscal) | 2026-06-13 | ✅ `NfTracker.jsx` — 5ª aba em Reports; pendentes âmbar / emitidas verde; badge com contagem |
| 50 | Gráfico de tendência mensal (12 meses) em Relatórios | 2026-06-13 | ✅ `MonthlyTrend.jsx` — barra por mês; linha de meta; verde/cyan/slate por status; aba Visão Geral |
| 51 | Compartilhar resumo mensal (WhatsApp / clipboard) | 2026-06-13 | ✅ Botão "Compartilhar" em ExportManager + "Compartilhar resultado" em Goals; Web Share API com fallback clipboard |

---

## Como usar (agentes)

1. Usuário pede feature → adicionar linha com `⬜`
2. Ao implementar → `🔄` durante trabalho → `✅` ou `🟡` ao terminar
3. Referenciar commit/deploy na coluna notas
4. Se descartar → `❌` com motivo
