# Relatório de Vida — Backstage Pro

> Documento vivo para Cursor, Claude Code e humanos.  
> **Atualize este arquivo a cada sessão significativa** (feature, fix, deploy, decisão de arquitetura).

**Última atualização:** 2026-06-10 (sessão 15)  
**Produção:** https://backstage-pro-beta.vercel.app  
**Último commit:** `2693168` — Fix ReportsChart ClientDetail (prop chartInput)  
**Último deploy:** 2026-06-10 — push para Vercel  
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
| Rotas lazy (code-split) | **Reativado** — AppLayout usa `<Suspense>` + `wrapPage` lazy; Sprint A+B |
| Nav SPA via Link | `AppLayout` migrado de `<a onClick>` para `<Link>` (7 navItems + Metas) |
| patchHistory fix | Filtra chamadas internas React Router (state.idx) — evitava loop que cancelava lazy load |
| Gráficos animados (Sprint C1) | `ReportsChart`: AreaChart + gradientes SVG + AnimatePresence tabs |
| Auditoria / ideias | `docs/AUDITORIA_PAGINAS.md` + `docs/IDEIAS_PENDENTES.md` + `CLAUDE.md` |
| OAuth Google (UX erros) | `googleOAuthErrors.js` + callback preserva `refresh_token` em reconexão |
| CompanySearchInput (3 abas) | Pesquisar / CNPJ / NF-e XML — sessão 10 |
| PDF fechamento evento | `EventPDFDocument` + template no Perfil — dynamic import |
| Goals UX | 3° círculo A Receber, empty state shows, mês no header |
| Expenses UX | `MonthGroup` colapsável + filtro por evento |
| Auditoria scroll/modais | Sessão 10 — rotas principais 🟢 (ver `AUDITORIA_PAGINAS.md`) |

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

### 2026-06-10 (sessão 15) — Migração slate completa + busca Clients + fix ReportsChart ClientDetail

**Migração `gray-*` → `slate-*` finalizada:** todos os arquivos fora do Cursor migrados. Único remanescente intencional: `SocialLoginButtons.jsx` (branding Google/Apple).  
**Clients.jsx — busca expandida:** `searchTerm` agora pesquisa em `razao_social`, `email`, `phone` (normalizado) e `city`, além de `name` e `contact_person`.  
**ClientDetail.jsx — ReportsChart fix:** gráfico estava sempre vazio; `data` → `chartInput` com mapeamento correto de `{ realized, receivable, projected, expenses }`.  
**Build:** Vite ✅ (51.75s)

### 2026-06-10 (sessão 14) — Polish forms + paleta slate consistente

**EventForm:** label "Observações" corrigido; campo `payment_due_date` adicionado à UI (input date após "Modelo de pagamento").  
**ExpenseForm:** toast "título" e placeholder "Sem vínculo" acentuados.  
**ProximoShow + ProximosEventos:** `gray-*` → `slate-*` em toda a paleta (consistência visual); "Cliente sem nome" → `—`; ProximosEventos mostra até 6 eventos (era 5).

**Build:** pendente instrução de deploy.

---

### 2026-06-09 (sessão 11) — Scroll robustez: flex-shrink-0 + overflow responsivo + E2E regression

**`flex-shrink-0` em DialogHeader/DialogFooter (Claude Code):**
- `calendar/EventDetailModal.jsx` — header + footer agora não encolhem em telas pequenas
- `clients/ClientDetailModal.jsx` — idem
- `reports/EventListModal.jsx` — header corrigido
- Grep pós-fix: zero DialogHeader/DialogFooter sem `flex-shrink-0` em todo o projeto ✅

**Overflow responsivo + CSS (Claude Code):**
- `min-h-screen` → `min-h-full` em Home, Calendar, Goals, Profile
- `overflow-x-clip` em `NeonPageShell` + `[data-app-scroll]` no `index.css`
- Profile: grid categorias `grid-cols-1 min-[360px]:grid-cols-2` + `min-w-0` nos botões

**Auditoria `/client-detail` (Claude Code):**
- `NeonPageShell min-h-full pb-24` ✅ — scroll correto via `main[data-app-scroll]`
- `ReportEventList` com `ScrollArea h-[400px]` — inline card, correto ✅
- Todos os modais já corretos ✅

**E2E regression (Cursor):**
- Novo: `e2e/regression/overflow-responsive.spec.js` — 24 testes (7 rotas × 3 viewports + scroll vertical)
- Novo: `e2e/helpers/scrollAudit.js` — utilitários `auditPageOverflow` + `scrollMainContainer`
- `fakeAuth.js` aprimorado: mock Supabase profiles + addInitScript
- **Resultado:** 41/41 ✅ (1 flaky isolado de sequenciamento — pre-existente)

**Build:** ✅  
**Deploy:** pendente instrução do usuário

---

### 2026-06-09 (sessão 10) — Auditoria geral + features cadastro empresa + PDF fechamento + Goals/Expenses UX

**Auditoria completa scroll/modais — TODAS as páginas PASS:**
- `/calendar`, `/reports`, `/expenses`, `/goals`, `/clients`, `/`, `/profile` — 🟢
- Padrões corretos: `useAppScrollLock`, `bp-modal-scroll`, `ScrollArea fill`, `NeonPageShell pb-24`
- `StatDetailModal` confirmado órfão (`src/components/dashboard/`) — não importado em nenhuma rota ativa
- `NotificationCenter` usa `DropdownMenu` — scroll lock desnecessário para dropdown, comportamento correto

**CompanySearchInput — 3 abas:**
- **Pesquisar** (nome + cidade): busca paralela banco local + Edge Function; strip de acentos antes de enviar
- **CNPJ**: input formatado automaticamente; consulta direta BrasilAPI → muito mais confiável
- **NF-e XML**: upload e parse local (browser-only); extrai `<dest>` (contratante) e `<emit>` (emitente) do XML

**ClientForm — campos Razão Social / Nome Fantasia:**
- `razao_social` adicionado ao formulário (distinção clara para NF)
- `handleCompanySelect` popula os dois campos separadamente
- Razão Social inclusa nas `notes` ao salvar (sem migração necessária)
- `SelectedCompany` card compacto mostra ambos claramente

**Edge Function `search-company` — busca melhorada:**
- `stripAccents()` aplicado ao query antes de enviar à API
- Fallback: tenta com cidade → sem cidade → query original se não encontrar

**Goals.jsx — melhorias UX:**
- Mês atual (ex: "junho de 2026") visível no header "Progresso do Mês"
- 3° círculo de progresso: **A Receber** (pendente de pagamento)
- Cards de stats com sub-info contextual (% da meta, "tudo em dia", etc.)
- Empty state para "Próximos Shows": mensagem + botão "Agendar show"
- Mensagem de incentivo inteligente: considera receita E eventos; comemora quando ambas batidas

**Expenses.jsx — melhorias UX:**
- Agrupamento por mês (YYYY-MM) com seções colapsáveis (`MonthGroup`)
- Filtro por evento (Select com eventos que têm despesas)
- Ícone `Tag` nos filtros de categoria

**EventPDFDocument + Profile template de fechamento:**
- PDF profissional gerado via `@react-pdf/renderer` (dynamic import — não no bundle principal)
- Campos no Perfil: nome completo, subtítulo, cargo, chave PIX + tipo
- Download direto no `EventDetailModal`

**Build:** ✅ (sem erros)
**Deploy:** ✅ Vercel prod (`af786fe`) + `search-company` Supabase
**Smoke E2E:** 13/13 ✅

---

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
1. ~~Auditoria página a página~~ — ✅ sessão 11 (todas as rotas incluindo /ai-mentor)
2. ~~Validar scroll em todas as telas~~ — ✅ sessões 10–11
3. OAuth Google — checklist E2E manual (validar com sua conta real)
4. ~~Deploy sessão 11~~ — ✅ `0b666c7` em prod
5. Testar `CompanySearchInput` aba CNPJ com `42.993.331/0001-10` (Amarrok)

### Média
6. Animações financeiras / charts animados no dashboard (`vendor-charts` já bundlado)
7. PWA offline refinado + pre-fetch crítico
8. Code-split seguro para `vendor-charts` (~421 KB) — `vite.config.js` LOCKED
9. ~~Expandir smoke E2E~~ — ✅ 46 testes (smoke + regression overflow + modal)

### Baixa / segurança
10. **Rotacionar `GOOGLE_CLIENT_SECRET`** (exposto em sessões passadas)
11. Publicar app OAuth (sair de “Testing”) quando E2E validado
12. ~~`StatDetailModal`~~ — ✅ confirmado órfão; seguro remover quando quiser

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
