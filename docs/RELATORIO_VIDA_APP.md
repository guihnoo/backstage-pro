# Relatório de Vida — Backstage Pro

> Documento vivo para Cursor, Claude Code e humanos.  
> **Atualize este arquivo a cada sessão significativa** (feature, fix, deploy, decisão de arquitetura).

**Última atualização:** 2026-06-05 (sessão 2)  
**Produção:** https://backstage-pro-beta.vercel.app  
**Último commit:** `71bd732` — badge rascunho + scroll batch 2  
**Commits da sessão:** `3fbe800` → `71bd732`  
**Último deploy:** 2026-06-05 — Vercel prod (`backstage-pro-beta.vercel.app`)  
**Supabase ref:** `cwtallnetgodoacuoaow`

---

## Estado atual (resumo)

| Área | Status |
|------|--------|
| Core (eventos, clientes, despesas, horas) | Funcional |
| Google Calendar OAuth + sync | Configurado (modo Teste no GCP); validar E2E com usuário |
| UX cores / hierarquia empresa | Implementado (`brandColors`, `EventHeading`) |
| Combobox cliente + geocode local | Implementado |
| Páginas legais OAuth | `/privacidade`, `/termos` |
| Scroll / modais / z-index | Corrigido v1 em prod; v2 local (badge + modais restantes) |
| Badge rascunho (clientes) | Implementado nos cards (`ClientDraftBadge`) |
| Mapa Brasil (relatórios) | Grid 27 UFs (SVG interativo = backlog) |

---

## Camadas de UI (z-index)

Ordem oficial após fix de scroll (2026-06-05):

| Camada | z-index | Exemplos |
|--------|---------|----------|
| Conteúdo / nav inferior | `z-30` | `AppLayout` bottom nav |
| Notificações / FAB | `z-40` | `NotificationCenter`, `FloatingActions` |
| Sheets mobile (backdrop) | `z-[90]` | `EventActionSheet`, `EventHoursSheet` |
| Sheets mobile (painel) | `z-[95]` | idem |
| Dialog / Sheet Radix | `z-[100]` overlay, `z-[101]` conteúdo | `DialogContent`, `Sheet` |
| Toasts | `z-[100]`+ | Sonner |

**Regra:** nunca usar `z-50` em cards/sheets customizados — conflitava com dialogs e com a nav.

---

## Scroll (padrão)

- Container principal da app: `<main data-app-scroll>` em `AppLayout.jsx`.
- Com modal Radix aberto **ou** `body[data-scroll-lock]`: o `main` trava via CSS (`index.css`).
- Overlays customizados (sheets Framer): usar hook `useAppScrollLock(isOpen)` de `src/lib/useAppScrollLock.js`.
- Corpo rolável dentro de modal flex: classe utilitária `.bp-modal-scroll` ou `ScrollArea` com prop `fill`.
- Modais Radix: `DialogContent` base usa `overflow-hidden`; scroll fica no filho (`bp-modal-scroll` / `ScrollArea fill`).

---

## Changelog

### 2026-06-05 (sessão 2) — Badge rascunho + scroll batch 2

**Commit:** `71bd732` — deploy prod

**Mudanças:**
- `ClientDraftBadge` nos cards de `Clients.jsx` quando `profile_complete === false`
- `alert-dialog`, `drawer`, Goals, AlertsNotifications, NotesSheet — z-index e scroll lock
- `ScrollArea fill` em StatDetailModal, ClientInsightsModal, DateInfoModal, DailyWorkModal, ExpenseForm
- CSS: trava scroll também para `role="alertdialog"`

**Para Claude Code ao retornar:** validar mobile em Goals, Despesas, alertas da agenda; depois OAuth Google E2E.

---

### 2026-06-05 — Scroll, z-index e relatório de vida

**Problema (testes reais):** rolagem do fundo continuava com modal aberto; scroll dentro do modal/form não respondia; cards/sheets apareciam acima de dialogs.

**Causa raiz:**
1. Scroll em `<main>`, não em `body` — Radix só trava `body`.
2. `z-50` compartilhado entre nav, sheets e dialogs.
3. `ScrollArea` sem `min-h-0` em layout flex (`flex-1` sem altura definida).

**Mudanças:**
- `useAppScrollLock.js` + CSS em `index.css`
- `data-app-scroll` no `AppLayout`
- Nav `z-30`; dialogs `z-[100]/[101]`
- Sheets mobile `z-[90]/[95]` + scroll lock
- `ScrollArea` prop `fill`; `.bp-modal-scroll`
- `ClientForm`, `EventDetailModal` (reports), sheets mobile atualizados

**Pendente validar:** Calendar completo, ExpenseForm, Goals modals, Clients page cards.

---

### 2026-06-05 — Google OAuth, combobox, legal, dedupe

**Commits:** `ecf5706`, `a6cd93c`

- Cor por empresa, `EventHeading`, sync Google sem duplicatas
- `ClientCombobox`, `LocationAutocomplete`, Nominatim BR
- Migrations `017`–`019`
- Edge functions `google-calendar` + callback; secrets GCP no Supabase
- Páginas `PrivacyPolicy`, `TermsOfService`
- Botão “Limpar duplicatas” no perfil
- `BrazilVisitedMap` em relatórios

**Deploy:** Vercel prod + Supabase functions redeployadas.

**Pendências:**
- [ ] Confirmar “Conectar Google” E2E após secrets
- [ ] Rotacionar `GOOGLE_CLIENT_SECRET` (exposto em chat/Downloads)
- [ ] Não commitar `client_secret_*.json`

---

### Sessões anteriores (resumo)

- Google Calendar: migrations `016`, edge functions OAuth, `GoogleCalendarSync` no perfil
- Scroll parcial: `min-h-0` no `AppLayout` main
- PWA / Vercel estável; hooks `useEvents`, `useClients`, etc.

---

## Backlog priorizado

### Alta (próxima sprint)
1. Validar scroll em **todas** as telas após deploy (mobile + desktop)
2. Badge “rascunho” em clientes `profile_complete: false`
3. OAuth Google — teste e documentar resultado aqui
4. Limpar duplicatas históricas no banco (botão dedupe ou script)

### Média
5. Mapa Brasil SVG interativo (substituir grid)
6. Animações financeiras / charts no dashboard
7. PWA offline refinado

### Baixa / segurança
8. Rotação secret Google
9. Publicar app OAuth (sair de “Testing”) quando estável

---

## Como usar este documento (agentes IA)

1. **Antes de implementar:** ler “Estado atual” + “Backlog” + última entrada do Changelog.
2. **Depois de implementar:** adicionar entrada no Changelog (data, problema, causa, arquivos, deploy).
3. **Se mudar z-index ou scroll:** atualizar seções “Camadas de UI” e “Scroll”.
4. **Não duplicar:** `MANUAL_WILL.md` = regras de negócio; este arquivo = estado técnico e histórico.

---

## Referências rápidas

```bash
npm run build
npx vercel --prod --yes
npx supabase functions deploy google-calendar --project-ref cwtallnetgodoacuoaow
```

**Arquivos sensíveis:** `.env.local`, `client_secret_*.json` — nunca commitar.
