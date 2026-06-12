# Status lapidação por página

| Página | Rota | Dono | Status | Último commit | Notas |
|--------|------|------|--------|---------------|-------|
| Home | `/` | Cursor | `done` | `b5cbd32` | overflow, pull-refresh, offline, prefetch |
| Agenda | `/calendar` | Claude Code | `done` | `85d0c2e` | EventHeading no TodayStrip, break-words AlertsPanel, client name modal |
| Clientes | `/clients` | Cursor | `done` | `027516c` | overflow, pull-refresh, EventHeading, truncate |
| Despesas | `/expenses` | Cursor+Claude | `done` | `fe02530` | pull-refresh, truncate, EventHeading, ClampedText; client lookup fix |
| Relatórios | `/reports` | Cursor | `done` | `adf337a` | pull-refresh, EventHeading, truncate KPIs |
| Metas | `/goals` | Cursor | `done` | `3b7e588` | pull-refresh, EventHeading, truncate |
| Perfil | `/profile` | Claude Code | `done` | `c43302b` | pull-to-refresh; truncate já existia |
| IA Mentor | `/ai-mentor` | Claude Code | `done` | `2b955b9` | pb-safe input; TypingDots animation; CATEGORY_HINTS por categoria |

**Sprint lapidação:** concluído (8/8 páginas).

**Fase 2 (em andamento):**
| Feature | Status | Notas |
|---------|--------|-------|
| Feedback + Inbox owner | `in_progress` | migration `029`; Perfil + `/admin/feedbacks` |
| Tour primeiro login | `done` | driver.js; `tour_completed_at` em profiles; rever em Perfil |
| Manual do usuário | `done` | `docs/MANUAL_USUARIO.md` — todas as rotas, gestos, CRM, IA, PWA, push |

**Legenda:** `pending` · `in_progress` · `review` · `done`
