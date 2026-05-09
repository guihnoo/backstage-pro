---
name: dev-environment
description: Arranque local — npm, env, Vite Windows, API Fastify
---

# Ambiente

1. `npm install`
2. `cp .env.example .env` (manter `VITE_API_URL=/api` em dev)
3. `npm run dev:full` ou dois terminais: `dev:server` + `dev`
4. Se `vite` falhar no PATH: `node ./node_modules/vite/bin/vite.js build`

Ver `docs/QUICKSTART.md`.
