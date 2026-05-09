# Supabase Local (CLI) — Backstage Pro

## Por que usar local

- Migrações versionadas (`supabase/migrations/`)
- Reproduzir bugs e validar schema antes de subir pra nuvem
- Base sólida pra CI (futuro)

## Subir / parar

```bash
npm run supabase:start
npm run supabase:status
npm run supabase:stop
```

## Aplicar migrações / reset

```bash
npm run db:reset
```

Isso recria o banco local e aplica as migrações + seed (conforme `supabase/config.toml`).

## Portas padrão (do Supabase CLI)

Ver `supabase/config.toml`, mas tipicamente:

- API: `54321`
- DB: `54322`
- Studio: `54323`

## Dica importante (service role)

`SUPABASE_SERVICE_ROLE_KEY` **nunca** vai pro frontend. Só API/back-end (Vercel Functions / `server/`).

