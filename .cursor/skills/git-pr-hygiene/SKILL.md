---
name: git-pr-hygiene
description: Commits legíveis, PRs revistos e histórico útil (alinhado a conventional-commits / fluxos GitHub da comunidade agent-first)
---

# Higiene Git / PR

## Quando usar

Antes de push, abrir PR, ou quando várias pessoas/agentes tocam no mesmo repo.

## Convenções

1. **Commits:** mensagens curtas no imperativo; preferir [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).
2. **PR:** descrição com *o quê* e *porquê*; screenshots só para UI visível.
3. **Escopo:** um tema por PR; migrar Base44 em PRs separados por domínio.
4. **Revisão:** `npm run lint` + `npm run build` verdes antes de pedir merge.

## Definition of done

Histórico legível; CI (quando existir) verde; sem segredos em diff.
