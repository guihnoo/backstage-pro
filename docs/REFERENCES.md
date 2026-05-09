# Bibliografia — Backstage Pro

## Cursor & Agent Skills

| Recurso | URL |
|---------|-----|
| Cursor Docs | https://cursor.com/docs |
| Agent Skills | https://www.cursor.com/docs/context/skills |
| Rules | https://cursor.com/help/customization/rules |
| Agent Skills (standard) | https://agentskills.io/ |

## Claude Code

| Recurso | URL |
|---------|-----|
| CLAUDE.md | https://docs.anthropic.com/en/docs/claude-code/claude-md |

## PWA & performance

| Recurso | URL |
|---------|-----|
| MDN PWA Guides | https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides |
| web.dev Learn PWA | https://web.dev/learn/pwa/ |
| vite-plugin-pwa | https://vite-plugin-pwa.netlify.app/guide/ |
| Workbox | https://developer.chrome.com/docs/workbox |

## Segurança API

| Recurso | URL |
|---------|-----|
| OWASP API Top 10 2023 | https://owasp.org/API-Security/editions/2023/en/0x11-t10/ |

---

## Curadoria — artigo DataCamp

**Fonte:** [As 100+ principais agent skills — DataCamp](https://www.datacamp.com/pt/blog/top-agent-skills)

É um **catálogo** de skills de terceiros (OpenClaw, ClawHub, etc.). Para este projeto:

| Tema no artigo | O que adoptámos |
|----------------|-----------------|
| Debug / orquestração (`debug-pro`, etc.) | Skill `debug-systematic` |
| Git / PR (`github`, `conventional-commits`) | Skill `git-pr-hygiene` |
| Docker / cloud (`docker-essentials`) | Adicionar quando houver container da API |
| Segurança de skills de mercado (`clawscan`) | Rever sempre `SKILL.md` antes de instalar skill remota |

Podes importar skills remotas pelo Cursor (**Settings → Rules**) depois de revisão humana.

---

## Documentação interna

| Ficheiro | Conteúdo |
|----------|----------|
| `CLAUDE.md` | Contexto Claude Code |
| `AGENTS.md` | Sub-agentes + lista de skills |
| `docs/ARCHITECTURE.md` | Diagrama actual/alvo |
| `docs/QUICKSTART.md` | Arranque API + front |
| `.cursor/rules/` | Regras Cursor |
| `.cursor/skills/*/SKILL.md` | Fluxos do projeto |
