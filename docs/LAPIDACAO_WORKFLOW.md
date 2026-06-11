# Lapidação — protocolo Cursor + Claude Code

> Evita conflitos quando dois agentes editam o mesmo repo.

## Regra de ouro

**Uma página por vez, um agente por página, commit antes de trocar.**

| Agente | Papel neste sprint |
|--------|-------------------|
| **Cursor** | Dono da página atual (implementa + commit + deploy + revisão) |
| **Claude Code** | Aguarda handoff OU pega a **próxima** página da fila (nunca a mesma) |

## Fila de páginas (ordem fixa)

1. `home` — `/` ✅ Cursor
2. `calendar` — `/calendar` → **Claude Code**
3. `clients` — `/clients` + `/client-detail`
4. `expenses` — `/expenses`
5. `reports` — `/reports`
6. `goals` — `/goals`
7. `profile` — `/profile`
8. `ai-mentor` — `/ai-mentor`

## Antes de começar (obrigatório)

```bash
git pull origin main
git status   # working tree limpo
```

Ler `docs/LAPIDACAO_STATUS.md` — se outra página está `in_progress`, **não editar**.

## Durante a página

- Escopo: só arquivos da rota (`src/pages/Home.jsx`, `src/components/home/**`, etc.)
- **Não tocar** em `AppLayout`, `routes.jsx`, hooks globais — salvo pedido explícito
- Commits: `lapida(home): descrição curta`
- Um commit lógico por feature (overflow, pull-refresh, etc.)

## Ao terminar a página

1. `npm run lint`
2. `npm run build`
3. `npm run test:e2e:smoke`
4. `git push origin main` + deploy Vercel
5. Atualizar `docs/LAPIDACAO_STATUS.md` → status `done`, hash do commit
6. Atualizar checklist em `docs/AUDITORIA_PAGINAS.md`

## Handoff para Claude Code (Agenda)

Copie no chat do Claude Code:

```
Lapidação Backstage Pro — página AGENDA (/calendar).

Protocolo: docs/LAPIDACAO_WORKFLOW.md
Status: docs/LAPIDACAO_STATUS.md (home=done, calendar=in_progress)

Tarefas:
1. Auditoria profunda (função, modais, overflow texto longo, E2E)
2. Corrigir truncate/line-clamp onde faltar (EventForm, EventDetailModal, CalendarTodayStrip, AlertsPanel)
3. Não editar src/pages/Home.jsx nem src/components/home/**
4. lint + build + smoke + commit lapida(calendar): ... + push + deploy
5. Atualizar LAPIDACAO_STATUS.md e AUDITORIA_PAGINAS.md

Produção: https://backstage-pro-beta.vercel.app
```

## Se os dois editarem ao mesmo tempo

- **Preferir rebase:** quem terminar segundo faz `git pull --rebase` e resolve só conflitos da sua pasta
- **Nunca** force-push em `main`
- Em conflito em arquivo LOCKED (`AGENTS.md`), perguntar ao usuário

## Arquivos compartilhados (coordenar)

| Arquivo | Quem pode editar |
|---------|------------------|
| `src/components/ui/overflowText.jsx` | Qualquer um (utilitário estável) |
| `src/components/layout/AppLayout.jsx` | Só com acordo (prefetch, offline banner) |
| `vite.config.js`, `playwright.config.js` | Só Cursor ou usuário |
