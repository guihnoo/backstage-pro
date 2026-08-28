# Handoff — Git worktree órfão `agent-abd00af5c51a7f7b6`

**Agente:** Cursor (Trilha Técnica)  
**Data:** 2026-08-28  
**Tipo:** Diagnóstico — sem alteração manual em `.git/**`

---

## Sintoma

`git status` às vezes falha com:

```
fatal: not a git repository: .../.git/worktrees/agent-abd00af5c51a7f7b6
```

## Diagnóstico executado

| Comando | Resultado |
|---------|-----------|
| `git worktree list --porcelain` | Apenas worktree principal (`main` @ `d25e6f7`) |
| `git worktree prune -n` | `Removing worktrees/agent-abd00af5c51a7f7b6: gitdir file does not exist` |
| `git worktree prune -v` | **Falha:** `error: failed to delete '.git/worktrees/agent-abd00af5c51a7f7b6': Permission denied` |
| `git fsck` | Apenas `dangling blob` — sem corrupção grave do objeto store |

## Evidências

- Pasta física `.claude/worktrees/agent-abd00af5c51a7f7b6/` ainda existe no disco (cópia Claude Code).
- Metadata em `.git/worktrees/agent-abd00af5c51a7f7b6` está **stale/corrompida** (gitdir inexistente).
- O worktree **não** aparece em `git worktree list` — Git já o considera inválido, mas não consegue remover a pasta de metadata.

## Ação tentada

- `git worktree prune` — bloqueado por **Permission denied** no Windows (provável lock de processo: Claude Code, OneDrive, antivírus ou IDE).

## Próximos passos (usuário)

1. Fechar Claude Code / processos que possam estar usando `.git/worktrees/...`
2. Reiniciar se necessário
3. Executar:
   ```powershell
   cd "c:\Users\monte\OneDrive\Documentos\backstage-pro"
   git worktree prune -v
   git worktree list --porcelain
   git status
   git fsck
   ```
4. Se ainda falhar: remover manualmente **somente** `.git/worktrees/agent-abd00af5c51a7f7b6` (não tocar em outros arquivos de `.git/`) com terminal admin ou após reinício.
5. Opcional: remover `.claude/worktrees/agent-abd00af5c51a7f7b6/` se não for mais necessário (não é worktree Git ativo).

## Mitigação aplicada nesta sessão

- `eslint.config.js`: ignores `.claude/**` e `**/worktrees/**` para `npm run lint` não varrer cópias órfãs.
- **Workaround temporário:** recriar metadata mínima em `.git/worktrees/agent-abd00af5c51a7f7b6/` (`gitdir`, `commondir`, `HEAD`) restaura `git status` quando a pasta foi apagada parcialmente.
- `git worktree remove --force .claude/worktrees/agent-abd00af5c51a7f7b6` falhou com **Permission denied** — Claude Code provavelmente com lock na pasta.

## Para fechar definitivamente

1. Fechar sessão Claude Code (libera lock em `.claude/worktrees/...`)
2. `git worktree remove --force .claude/worktrees/agent-abd00af5c51a7f7b6`
3. `git worktree prune -v`
4. Opcional: deletar pasta `.claude/worktrees/agent-abd00af5c51a7f7b6/`

## Risco

Baixo para desenvolvimento diário — repositório principal funciona. Risco médio se `git status` continuar falhando intermitentemente até o prune manual.
