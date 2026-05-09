---
name: supabase-workflow
description: Workflow Supabase (local + nuvem) — start, migrações, reset, tipos e segurança de chaves
paths:
  - supabase/**/*
  - server/**/*
  - src/lib/**/*
---

# Supabase workflow

## Quando usar

- Criar/alterar tabelas
- Subir Supabase local
- Preparar CI ou alinhar schema com produção

## Local

1. `npm run supabase:start`
2. `npm run db:reset` (aplica migrações)
3. Validar endpoints da API (`/api/health`, `/api/clients`)
4. `npm run supabase:stop` quando terminar

## Migrações

- Sempre versionadas em `supabase/migrations/`.
- Uma migração por mudança lógica (não juntar “10 coisas”).

## Segurança

- `SUPABASE_ANON_KEY`: pode existir no frontend (público).
- `SUPABASE_SERVICE_ROLE_KEY`: **somente** no backend (nunca VITE_).

