# Claude Code — Backstage Pro

Leia **antes de qualquer tarefa**:

1. `docs/RELATORIO_VIDA_APP.md` — estado atual, changelog, z-index/scroll, backlog
2. `docs/AUDITORIA_PAGINAS.md` — checklist página a página (o que revisar e o que já passou)
3. `docs/IDEIAS_PENDENTES.md` — ideias do usuário ainda não implementadas
4. `docs/AGENT_LOG.md` — histórico cronológico (somente **append** ao final)
5. `AGENTS.md` — arquivos LOCKED e convenções

## Obrigatório ao final de cada sessão

1. Atualizar `docs/RELATORIO_VIDA_APP.md` (changelog + estado + backlog)
2. Anexar entrada em `docs/AGENT_LOG.md` (data, agente, arquivos, build, deploy)
3. Marcar checkboxes em `docs/AUDITORIA_PAGINAS.md` e `docs/IDEIAS_PENDENTES.md`
4. **Não** repetir bugs já documentados (ex.: lazy routes que travavam em Carregando)

## Regras críticas

- Scroll: `main[data-app-scroll]`, `useAppScrollLock`, `.bp-modal-scroll` ou `ScrollArea fill`
- **Backup git automático**: ao terminar tarefa com mudanças, rodar `npm run git:backup` (commit WIP + push). Hook Cursor também dispara em `stop`/`sessionEnd`.
- Commits oficiais (mensagem do usuário) são separados dos WIP `chore(auto):`.
- Pausar backup: criar `.cursor/PAUSE_AUTO_GIT`. Deploy na Vercel continua só com pedido explícito.
- Responder ao usuário em **pt-BR**
