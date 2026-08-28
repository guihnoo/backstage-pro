# Handoff — Residual Base44 / `@/api/entities`

**Agente:** Cursor (Trilha Técnica) — investigação READ-ONLY  
**Data:** 2026-08-28  
**Remoção:** NÃO executada nesta fase

---

## Resumo

`@base44/sdk` está no `package.json` / lockfile mas **não há import direto em `src/`**.  
A camada `@/api/entities` é um **adapter Supabase** que substitui a API Base44 — ainda usada em alguns componentes.

---

## Classificação

### USADO (adapter Supabase ativo)

| Export | Tabela Supabase | Importado por |
|--------|-----------------|---------------|
| `EventTemplate` | `event_templates` | `EventForm.jsx`, `EventTemplateModal.jsx`, `EventTemplatesManager.jsx` |
| `UserSettings` | `user_settings` | `GoogleCalendarSync.jsx` |
| `Feedback` | `feedback` | `useFeedback.js` |

### LEGADO NECESSÁRIO (stubs — evitam crash se chamados)

| Export | Motivo |
|--------|--------|
| `UserDashboardSettings`, `Report`, `SystemBackup`, `Invoice`, `UserBehaviorProfile`, `AuditLog`, `MentorConfig` | `stubEntity` — noop |

### MORTO

| Item | Evidência |
|------|-----------|
| `@base44/sdk` npm package | Zero `import` em `src/`; `base44Client.js` deletado (AGENT_LOG BASE44-REMOVE) |
| `src/api/base44Client.js` | Não existe |

### INCERTO

| Item | Nota |
|------|------|
| `Event` / `Client` / `DailyWork` exports em `entities.js` | Definidos mas substituídos por hooks em código novo; verificar se algum import residual |
| Bundle size de `@base44/sdk` | Presente no lockfile; tree-shake não aplica se nunca importado — candidato a remoção futura |
| `User` export | Wrapper `supabase.auth.getUser()` — uso pontual |

---

## Imports reais de `@/api/entities` em `src/`

```
src/components/calendar/EventForm.jsx          → EventTemplate
src/components/calendar/EventTemplateModal.jsx → EventTemplate
src/components/calendar/EventTemplatesManager.jsx → EventTemplate
src/components/calendar/GoogleCalendarSync.jsx → UserSettings
src/lib/useFeedback.js                       → Feedback
```

**Regra do projeto:** `.cursor/rules/backstage-core.mdc` proíbe `@/api/entities` em código **novo** — mas arquivos acima ainda dependem.

---

## `EventTemplate` — persiste em tabela real?

**Sim.** `makeEntity('event_templates')` → CRUD Supabase direto.  
Templates criados via `EventTemplateModal` / `EventForm` persistem em `event_templates` com RLS.

---

## Scripts / outros

- `README.md` ainda menciona Base44 support (legado do scaffold)
- `ANALISE_COMPLETA.md` referencia `base44Client.js` (desatualizado)

---

## Recomendação pós-auditoria (não implementar agora)

1. Migrar `EventTemplate` / `UserSettings` / `Feedback` para hooks dedicados (`useEventTemplates`, etc.)
2. Remover `@base44/sdk` do `package.json` após confirmar zero transitive use
3. Renomear `entities.js` → `supabaseEntityAdapter.js` ou eliminar após migração
