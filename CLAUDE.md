# Backstage Pro — contexto para Claude Code

Leia no início de sessões longas. Complementa `AGENTS.md` e `docs/ARCHITECTURE.md`.

## Produto

PWA profissional: agenda, clientes, finanças, relatórios, IA assistiva.

## Stack

| Camada | Estado |
|--------|--------|
| Frontend | Vite + React (`src/`), PWA via `vite-plugin-pwa` |
| API local | Fastify em `server/index.js` (health `/api/health`) |
| Legado | Base44 — não expandir; migrar para REST |

**Integração:** `VITE_API_URL=/api` em dev (proxy no `vite.config.js`). Helper `src/lib/apiBase.js`.

## Comandos

```bash
npm install
npm run dev              # só frontend + proxy /api
npm run dev:server       # API porta 3001
npm run dev:full         # API + Vite
npm run build
node ./node_modules/vite/bin/vite.js build   # Windows se PATH falhar
```

`docs/QUICKSTART.md` — onboarding rápido.

## Convenções

- Respostas ao utilizador: **pt-BR**.
- Mudanças focadas; rotas novas → `src/pages/index.jsx` + `navConfig.jsx`.

## Referências

- `docs/REFERENCES.md` — links MDN, web.dev, Cursor, OWASP, artigo DataCamp (curadoria).
- `.cursor/skills/` — fluxos (debug, PR, PWA, migração Base44, etc.).
