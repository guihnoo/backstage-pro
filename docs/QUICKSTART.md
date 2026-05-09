# Quickstart — Backstage Pro

## Pré-requisitos

- Node.js 18+
- `npm install` na raiz do repositório

## Variáveis de ambiente

```bash
cp .env.example .env
```

Em desenvolvimento, mantenha `VITE_API_URL=/api` para usar o proxy definido no `vite.config.js`.

## Opção A — dois terminais

1. **API:** `npm run dev:server` → http://localhost:3001 — health: http://localhost:3001/api/health  
2. **Frontend:** `npm run dev` → http://localhost:5173  

## Opção B — um comando

```bash
npm run dev:full
```

(Inicia API + Vite em paralelo.)

## Build

```bash
npm run build
npm run preview
```

## PWA

O plugin `vite-plugin-pwa` regista o service worker em produção/preview. Ícone principal: `public/logo.svg`.
