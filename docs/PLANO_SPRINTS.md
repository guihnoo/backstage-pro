# Plano de Sprints — Backstage Pro

> Coordenação **Cursor** + **Claude Code** sem conflito.  
> Atualizado: 2026-06-09 (Sprint A iniciada)

**Produção:** https://backstage-pro-beta.vercel.app  
**Docs relacionados:** `AUDITORIA_PAGINAS.md`, `IDEIAS_PENDENTES.md`, `AGENT_LOG.md`, `AGENTS.md`

---

## Protocolo anti-conflito

1. Ler `AGENTS.md` + últimas entradas de `AGENT_LOG.md`
2. Declarar no início: **Epic X — arquivos Y**
3. **Um epic = um agente = uma branch** (ou sessão sequencial)
4. `AGENT_LOG.md` é **append-only**
5. Commit **somente** quando o usuário pedir
6. Não editar arquivos **LOCKED** sem desbloqueio explícito

### Ownership por agente

| Tipo | Cursor | Claude Code |
|------|--------|-------------|
| E2E Playwright | ✅ `e2e/**` | ❌ |
| Docs auditoria | append AGENT_LOG | ✅ AUDITORIA, RELATORIO, PLANO |
| Features UI (Goals, Profile, AI) | ✅ | — |
| Refactors (Calendar, Reports) | — | ✅ |
| Limpeza órfãos | — | ✅ (ou Cursor se combinado) |
| Deploy Vercel + smoke | ✅ | build verify |
| Forms LOCKED | ❌ ambos | ❌ |

### Branches sugeridas

```text
main
 ├── epic/a-higiene        ← Sprint A
 ├── epic/b-nav-spa        ← Sprint B
 └── epic/c-premium        ← Sprint C
```

---

## Sprint A — Higiene (em andamento)

| ID | Tarefa | Agente | Status |
|----|--------|--------|--------|
| A1 | Remover componentes órfãos | Cursor | ✅ |
| A2 | Criar `PLANO_SPRINTS.md` | Cursor | ✅ |
| A3 | E2E smoke: `/ai-mentor` | Cursor | ✅ |
| A4 | E2E smoke: `/client-detail` | Cursor | ✅ |
| A5 | E2E smoke: Goals editar metas | Cursor | ✅ |
| A6 | E2E auth: goals, ai-mentor, client-detail | Cursor | ✅ |
| A7 | Atualizar AUDITORIA (órfãos removidos) | Cursor | ✅ |

**Arquivos removidos (A1):**
- `StatDetailModal.jsx`, `Profile.jsx`, `SplashScreen.jsx`, `pages/index.jsx`
- `DashboardCustomizer.jsx`, `FeedbackModal.jsx`, `PhotoReceiptAnalyzer.jsx`
- `ChatInterface.jsx`, `BackupManager.jsx`

---

## Sprint B — Navegação nativa

| ID | Tarefa | Agente | Arquivos |
|----|--------|--------|----------|
| B1 | AppLayout: `<Link>` em vez de `<a>` + reload | Claude Code | `AppLayout.jsx` |
| B2 | Goals na nav ou atalho fixo Home | Cursor | `AppLayout.jsx` ou `Home.jsx` (LOCKED) |
| B3 | Badge notificações no sino | Cursor | `NotificationCenter` |

**Pré-requisito:** A mergeado em `main`.

---

## Sprint C — Premium financeiro

| ID | Tarefa | Agente | Arquivos |
|----|--------|--------|----------|
| C1 | Gráficos animados Reports | Claude Code | `Reports.jsx` |
| C2 | OCR recibo (edge function) | Cursor | `ReceiptAnalyzer`, `supabase/functions` |
| C3 | Google Calendar → `useUserSettings` | Cursor | `GoogleCalendarSync.jsx` |
| C4 | Backup/restore no ProfileSimple | Cursor | `ProfileSimple.jsx`, novo componente |

---

## Sprint D — IA + PWA (backlog)

| ID | Tarefa | Agente |
|----|--------|--------|
| D1 | Ações executáveis no chat IA | Cursor |
| D2 | Persistir conversas Supabase | Cursor |
| D3 | PWA offline + sync | Claude Code |
| D4 | Push notifications | ambos |

---

## Backlog priorizado (referência)

### P0
- Limpeza órfãos ✅
- E2E gaps principais ✅ (Sprint A)
- Nav SPA (Sprint B)
- Google Calendar checklist OAuth manual

### P1
- Gráficos animados, relógios dinâmicos Home
- Goals na bottom nav
- OCR recibos
- Modais CRM inteligentes

### P2
- PWA offline, push, code-split seguro
- Comparativo ano anterior Reports

### P3
- Rotacionar GOOGLE_CLIENT_SECRET
- OAuth GCP sair de modo Testing

---

## Cobertura E2E (após Sprint A)

| Área | Spec |
|------|------|
| Overflow 7 rotas × 3 viewports | `regression/overflow-responsive.spec.js` |
| Modais desktop + sheets mobile | `regression/modal-overflow.spec.js` |
| Smoke rotas shell | `smoke/app-routes-navigation.spec.js` |
| AI Mentor shell | `smoke/ai-mentor-shell.spec.js` |
| Client detail | `smoke/client-detail-navigation.spec.js` |
| Goals editar metas | `smoke/goals-edit.spec.js` |
| Auth guard estendido | `smoke/routes-auth.spec.js` |

**Ainda falta:** fluxos de negócio (criar evento, marcar pago), login/signup/onboarding, EventActionSheet mobile, Google OAuth.
