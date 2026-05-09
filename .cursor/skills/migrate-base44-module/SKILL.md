---
name: migrate-base44-module
description: Migrar um domínio Base44 para REST mantendo parity
paths:
  - src/api/**/*
---

# Migração Base44

1. Grep imports da entidade/function.
2. Desenhar endpoints REST.
3. Implementar em `server/`.
4. Trocar chamadas no UI para `fetch`/`apiUrl`.
5. Remover SDK só quando 100% migrado neste domínio.
