# Arquitetura Backstage Pro

## Actual

```
Browser
  → Vite + React (`src/`) + PWA (Workbox via vite-plugin-pwa)
  → Dev: proxy `/api` → Fastify (`server/index.js`)
  → Legado: Base44 SDK (`src/api/*`)
```

## Alvo

API própria + PostgreSQL; remover Base44 por módulos.

## Contrato front/back

- Env: `VITE_API_URL` (`/api` em dev com proxy).
- Produção: mesmo domínio ou CORS explícito em `FRONTEND_ORIGIN`.

Ver `docs/REFERENCES.md` e `docs/QUICKSTART.md`.
