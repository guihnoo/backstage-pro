# Agentes — Cursor + Claude Code

## Ferramentas

| Ferramenta | Uso |
|------------|-----|
| **Cursor Agent** | Edição com `.cursor/rules` e `.cursor/skills`. |
| **Claude Code** | Terminal longo; ler **`CLAUDE.md`** ao entrar no repo. |

## Sub-agentes Cursor (Task)

| Tipo | Quando |
|------|--------|
| **explore** | Mapear código só leitura. |
| **shell** | Git, installs, builds (atenção Windows). |
| **deployment-expert** | CI/CD, env produção. |
| **performance-optimizer** | Bundle, Core Web Vitals, PWA. |
| **generalPurpose** | Multi-passos sem especialista óbvio. |

## Skills (`.cursor/skills/`)

| Pasta | Função |
|-------|--------|
| `dev-environment` | Setup local, env, Vite no Windows. |
| `fullstack-feature` | Contrato API → backend → cliente → UI. |
| `pwa-quality-bar` | Manifest, SW, Lighthouse. |
| `innovation-sparring` | Ideia → MVP → métrica. |
| `migrate-base44-module` | Um domínio Base44 → REST. |
| `security-api-review` | Checklist OWASP em rotas novas. |
| `debug-systematic` | Debug repro→hipótese→prova. |
| `git-pr-hygiene` | Commits/PRs limpos; lint + build. |

## Documentação

`docs/ARCHITECTURE.md`, `docs/REFERENCES.md`, `docs/QUICKSTART.md`.
