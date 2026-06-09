# Relatório de Vida — Backstage Pro

> Documento vivo para Cursor, Claude Code e humanos.  
> **Atualize este arquivo a cada sessão significativa** (feature, fix, deploy, decisão de arquitetura).

**Última atualização:** 2026-06-09 (sessão 9)  
**Produção:** https://backstage-pro-beta.vercel.app  
**Último commit:** `ed46dfc` — fix lazy routes (páginas travadas em Carregando)  
**Último deploy:** 2026-06-09 — Vercel prod (`backstage-pro-beta.vercel.app`)  
**Supabase ref:** `cwtallnetgodoacuoaow`

---

## Estado atual (resumo)

| Área | Status |
|------|--------|
| Core (eventos, clientes, despesas, horas) | Funcional |
| Google Calendar OAuth + sync | Configurado (modo Teste no GCP); validar E2E com usuário |
| UX cores / hierarquia empresa | Implementado (`brandColors`, `EventHeading`) |
| Combobox cliente + geocode local | Implementado |
| Local do evento (endereço + GPS check-in) | `EventLocationSection` — criar, detalhe, action sheet |
| Páginas legais OAuth | `/privacidade`, `/termos` |
| Scroll / modais / z-index | Corrigido (v1–v3); popovers/select `z-[110]` dentro de dialogs |
| Badge rascunho (clientes) | Cards + modal detalhe + filtro **Rascunhos** |
| OAuth Google callback | Redirect `/profile?google_connected=1`; toast ao detectar query |
| Mapa Brasil (relatórios) | SVG interativo `@svg-maps/brazil`, lazy load + chunk dedicado |
| Alertas agenda (local GPS) | `AlertsPanel` montado em `Calendar.jsx` — lembrete check-in para eventos de hoje sem local |
| Modo Palco — check-in GPS | Botão em `ProximoShow` quando `isOnStage` e sem local |
| Code-split rotas | **Revertido** — imports estáticos (`ed46dfc`); lazy travava Suspense |
| Auditoria / ideias | `docs/AUDITORIA_PAGINAS.md` + `docs/IDEIAS_PENDENTES.md` + `CLAUDE.md` |
| OAuth Google (UX erros) | `googleOAuthErrors.js` + callback preserva `refresh_token` em reconexão |

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

### 2026-06-09 (sessão 9) — Hotfix rotas + sistema de registro vivo

- **Bug crítico:** `React.lazy()` em rotas principais deixava páginas presas em "Carregando..." (módulo não resolvia)
- **Fix:** `routes.jsx` volta imports estáticos; deploy prod `ed46dfc`
- **Docs:** `CLAUDE.md`, `docs/AUDITORIA_PAGINAS.md`, `docs/IDEIAS_PENDENTES.md`
- **Testes:** smoke E2E 13/13 (calendar, bottom-nav, profile, auth routes)
- **Também no ar:** busca empresas Google-like (`6d7cd90`, `2e676fc`)

**Regra:** não reintroduzir lazy nas rotas até code-split seguro (subcomponentes ou error boundary).

---

### 2026-06-05 (sessão 8) — OAuth robustez + lazy routes + bundle

- `google-calendar-callback`: preserva `refresh_token` existente quando Google não reenvia (reconexão)
- `googleOAuthErrors.js`: mensagens pt-BR para erros OAuth no Perfil
- Lazy load: `Clients`, `Expenses`, `ClientDetail` (bundle principal ~402 KB)

**Checklist OAuth E2E (manual):**
1. Perfil → Conectar ao Google → autorizar → redirect `/profile?google_connected=1` + toast verde
2. Badge **Conectado** + e-mail Google visível
3. **Sincronizar Agora** / **Importar Eventos** sem erro 401
4. **Limpar duplicatas da agenda** (se houver dupes pós-import)
5. Desconectar → status **Desconectado**

---

### 2026-06-05 (sessão 7) — Alertas local + Modo Palco GPS + lazy routes

- `AlertsPanel` integrado na agenda (`Calendar.jsx`): alerta **Registrar local do evento** para shows de hoje sem `location`/coords; CTA chama `handleEventLocationCheckIn`
- `ProximoShow`: botão **Check-in no local (GPS)** no Modo Palco quando falta local; rota usa `mapsUrlForCoords` quando há lat/lng
- `useUpcomingEvent`: expõe `refetch` — Home atualiza card após GPS
- `routes.jsx`: lazy load de `Calendar`, `Reports`, `AI_Mentor` (chunks separados no build)

---

### 2026-06-05 (sessão 6) — UX local visível + scroll batch 4

- `EventLocationChip` em `AgendaView` e `DailyView` (local ou “não registrado”)
- Scroll: `RecurringEventActionModal`, loading do `DashboardCustomizer`, sheet de badge em `Goals`
- `LoadingSpinner` → `z-[100]` (acima da nav)
- `.gitignore`: `.env.vercel*`

---

### 2026-06-05 (sessão 5) — Local do evento + scroll modais

- `EventLocationSection`: autocomplete de endereço + botão **Check-in no local (GPS)** com reverse geocode
- `EventForm`: scroll `ScrollArea fill` + import `Select` corrigido
- `EventDetailModal` (calendar + reports): editar/salvar local; GPS salva automaticamente
- `EventActionSheet`: check-in GPS rápido no mobile
- Scroll: `KPIDetailModal`, `EventTemplateModal`, `FeedbackModal`, `PaymentConfirmModal`, `SourcesModal`, `DashboardCustomizer` → `bp-modal-scroll`

---

### 2026-06-05 (sessão 4) — Mapa SVG Brasil

- `BrazilVisitedMap.jsx`: paths reais por UF (`@svg-maps/brazil`), hover/click com tooltip
- Inferência de UF por `location_state` ou texto do endereço
- `Reports.jsx`: `React.lazy` + `Suspense` (skeleton)
- `vite.config.js`: chunk `vendor-brazil-map` (~64 KB gzip ~23 KB)

---

### 2026-06-05 (sessão 3) — Scroll batch 3 + UX clientes + OAuth

- `ClientDetailModal`: scroll `bp-modal-scroll`, badge rascunho
- Filtro **Rascunhos** em `Clients.jsx`
- `popover` / `select` / `LocationAutocomplete` → `z-[110]` (combobox e local dentro de modal)
- `GoogleCalendarSync`: reage a `?google_connected=1` após redirect OAuth
- `DrilldownModal`, `ReceiptAnalyzer`, `EventListModal`: `ScrollArea fill`

---

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
1. **Auditoria página a página** — seguir `docs/AUDITORIA_PAGINAS.md` (scroll/modais)
2. Validar scroll em **todas** as telas após deploy (mobile + desktop)
3. OAuth Google — checklist E2E manual no Changelog sessão 8 (validar com sua conta)
4. Registrar ideias do usuário em `docs/IDEIAS_PENDENTES.md` a cada pedido
5. ~~Fix lazy routes Carregando~~ — feito (`ed46dfc`, prod 2026-06-09)

### Média
5. Animações financeiras / charts no dashboard
6. PWA offline refinado
7. Code-split `react-pdf` (~1.4 MB) e `vendor-charts` (~421 KB)

### Baixa / segurança
8. Rotação secret Google
9. Publicar app OAuth (sair de “Testing”) quando estável

---

## Como usar este documento (agentes IA)

1. **Antes de implementar:** ler “Estado atual” + “Backlog” + `IDEIAS_PENDENTES.md` + `AUDITORIA_PAGINAS.md`.
2. **Depois de implementar:** Changelog aqui + append em `AGENT_LOG.md` + marcar checkboxes nos outros docs.
3. **Se mudar z-index ou scroll:** atualizar seções “Camadas de UI” e “Scroll”.
4. **Claude Code:** ler `CLAUDE.md` na raiz.
5. **Não duplicar:** regras de negócio em docs antigos; este arquivo = estado técnico e histórico.

---

## Referências rápidas

```bash
npm run build
npx vercel --prod --yes
npx supabase functions deploy google-calendar --project-ref cwtallnetgodoacuoaow
```

**Arquivos sensíveis:** `.env.local`, `client_secret_*.json` — nunca commitar.
