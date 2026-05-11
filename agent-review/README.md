# Agent review — mídia temporária (Cursor + Claude Code)

Esta pasta é um **inbox partilhado** para **prints de ecrã, gravações curtas ou vídeos** que queres que o Cursor Agent ou o Claude Code analisem (UX, bugs visuais, cópia, fluxos).

## Como usar

1. Coloca os ficheiros em **`agent-review/incoming/`** (arrastar para o explorador do projeto ou copiar para lá).
2. No chat, referencia o caminho, por exemplo:  
   `agent-review/incoming/login-demo.png`
3. Depois da análise, **apaga os ficheiros** dessa pasta para libertar espaço e evitar ruído em commits.

## Boas práticas

- Nomes descritivos: `login-erro-2026-05-09.png`, `agenda-mobile-scroll.mp4`.
- Evita dados sensíveis (passwords reais, NIF, emails de clientes). Usa dados fictícios ou borra antes de guardar.
- Vídeos: mantém curtos (ex.: &lt; 30–60 s) para análise focada.

## Git

O conteúdo de **`incoming/`** está no **`.gitignore`** — não sobe para o GitHub por defeito. Só este `README.md` (e o `.gitkeep` da pasta) permanecem versionados.

## Claude Code

O Claude Code vê os mesmos ficheiros no disco do projeto; basta o caminho relativo à raiz do repo.
