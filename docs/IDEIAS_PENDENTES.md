# Ideias e pedidos do usuário — Backstage Pro

> Tudo que foi pedido e **ainda não está 100%** — ou precisa revalidação pós-deploy.  
> Atualize status: `⬜ Pendente` · `🔄 Em progresso` · `✅ Feito` · `🟡 Feito — precisa polish` · `❌ Cancelado`

**Fontes:** conversas Cursor/Claude, `RELATORIO_VIDA_APP.md`, `STRATEGIC_ANALYSIS_REPORT.md`

---

## UX / Premium (pedidos recorrentes)

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 1 | App **premium** — sensação native PWA, animações Framer | 🔄 | Várias telas OK; polish contínuo |
| 2 | **Revisão página a página** com testes e correções scroll/modais | 🔄 | Este doc + `AUDITORIA_PAGINAS.md` |
| 3 | Cards/páginas/modais **sem rolagem** — corrigir todos | 🔄 | Batches scroll sessões 2–6; usuário ainda reporta casos |
| 4 | Gráficos financeiros animados no dashboard | ⬜ | Backlog médio |
| 5 | Relógios dinâmicos / dados em tempo real na Home | ⬜ | |
| 6 | Modais CRM automatizados (fluxos inteligentes) | ⬜ | |
| 7 | Celebração ao desbloquear badge (Goals) | ⬜ | STRATEGIC_ANALYSIS |

---

## Funcionalidades

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 8 | Google Calendar OAuth + sync completo | 🟡 | UI pronta; checklist E2E manual pendente |
| 9 | Local do evento (endereço + GPS check-in) | ✅ | EventLocationSection, Modo Palco |
| 10 | Mapa Brasil visitados (relatórios) | ✅ | BrazilVisitedMap |
| 11 | Alertas agenda — check-in local hoje | ✅ | AlertsPanel |
| 12 | Busca inteligente empresas / CNPJ compartilhado | ✅ | migrations 020 + Edge Function |
| 13 | Export PDF/CSV relatórios | ✅ | exportReport.js |
| 14 | OCR recibo despesas (ReceiptAnalyzer) | 🟡 | Manual OK; scan “em breve” |
| 15 | PWA offline refinado + sync estado | ⬜ | PWA_ROADMAP |
| 16 | Push notifications | ⬜ | |
| 17 | Code-split **seguro** (sem travar rotas) | ⬜ | Lazy routes revertido `ed46dfc` |
| 18 | Dedupe eventos Google Calendar | 🟡 | Botão no Perfil — validar |

---

## Estabilidade / processo (pedido atual)

| # | Ideia | Status | Onde / notas |
|---|-------|--------|--------------|
| 19 | **Registrar vida do app** (Cursor + Claude Code) | 🔄 | `RELATORIO_VIDA_APP.md`, `AGENT_LOG.md`, este arquivo |
| 20 | Não repetir bugs (lazy routes, scroll, OAuth) | 🔄 | Seção “Bugs conhecidos” em AUDITORIA |
| 21 | Check-in em itens prontos sem quebrar o que funciona | 🔄 | LOCKED em AGENTS.md |
| 22 | Testes E2E smoke em cada release | 🟡 | 13 smoke tests; expandir por página |

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
| 26 | _(espaço livre)_ | | |

---

## Como usar (agentes)

1. Usuário pede feature → adicionar linha com `⬜`
2. Ao implementar → `🔄` durante trabalho → `✅` ou `🟡` ao terminar
3. Referenciar commit/deploy na coluna notas
4. Se descartar → `❌` com motivo
