# Handoff para o ChatGPT/Codex — Horas e cachê v2 (14/10/2026, 01:15)

Quem passa o trabalho: Claude, cujos créditos estavam acabando. Quem continua: ChatGPT/Codex.

## Onde está
- Worktree: `C:\dev\backstage-pro-horas`, branch local `feat/horas-cache-v2`, criada a partir da `main` 864e85b. Arquivo `PAUSE_AUTO_GIT` presente.
- **Nada publicado.** Sem push, sem deploy, sem migração no Supabase.
- Regras de negócio, conselho e proposta estão no Projeto "Backstage Pro" (claude.ai):
  - `claude/regras-de-negocio-horas-e-cache.md`
  - `claude/conselho-01-horas-cache.md`
  - `claude/proposta-horas-cache-v2.md`
- Regras de segurança do PROMPT MESTRE V2 continuam valendo:
  - sem push, merge ou deploy sem aprovação do dono;
  - não misturar Neon e Supabase;
  - não ler `.env`;
  - lotes de código só com aprovação.

## Feito (commits locais)
| Lote | Commits | Conteúdo |
|---|---|---|
| 1 | b22974b, 72a64e3 | Regra única em `src/lib/workDay.js`. Cachê por dia (`eventFinance.calculateEventReceivableAmount`). Fuso de São Paulo. 12 h automáticas não rodam ao abrir o app. |
| 2 | 817aa06, 8673379 | Migrations 035/036 + `supabase/queries/verificar_dias_repetidos.sql`. Escolha ½/1/2 + hora extra (`DayChoicePicker`) atrás de `VITE_REGIME_POR_DIA`. Passo a passo em `docs/HORAS_CACHE_V2_LOTE2.md`. Laboratório PGlite em `C:\dev\_lab\ledger-pglite\daily-work-035.mjs` (22/22). |
| 3 | 68e39dc, 4686ed8 | Valor único (cobrança WhatsApp/PIX + 11 telas). Trava do recebimento (`src/lib/hoursGate.js`, `getEventHoursStatus`). Um registro por dia, online e offline. |
| 4 | (este commit) | `src/lib/hoursReview.js` com `findHoursIssues` e `hoursOriginStats`, mais `HoursReviewList.jsx` e `HoursOriginChart.jsx` na aba "work" de `Reports.jsx`. |

Testes: Vitest 182/182; lint ok; `vite build` ok.

## Pendências (em ordem)
1. **Gráfico `HoursOriginChart`:** na captura de tela, as barras empilhadas aparecem separadas (o verde termina em ~3 e o âmbar começa em ~5,5) quando deveriam se encostar (5 + 2).
   - Pode ser só a animação do Recharts no momento da captura.
   - Conferir com `isAnimationActive={false}` ou esperando mais antes da captura.
   - Harness visual: `.harness/` (fora do Git). Rodar `npx vite --config .harness/vite.harness.config.js` e depois `node .harness/shot.mjs`. Apagar `.harness/` quando terminar.
2. Revisão independente do Lote 4 (`hoursReview.js`, `HoursReviewList.jsx`, `HoursOriginChart.jsx`).
3. Ativar o Lote 2 com o dono, seguindo `docs/HORAS_CACHE_V2_LOTE2.md`:
   - consulta só de leitura → 035 → resolver dias repetidos → 036;
   - depois `VITE_REGIME_POR_DIA=true` e `VITE_REGIME_POR_DIA_DESDE=AAAA-MM-DD`.
4. Ainda fora:
   - lembrete push "Terminou? Saiu que horas?" (precisa de agendamento no servidor);
   - conflito entre edição offline e online (a última gravação vence);
   - calculadora de orçamento (`CacheCalculator.jsx`).
5. A branch `fix/partial-payments-20261010` mexe em `eventFinance.js`, `financeMetrics.js`, `useHomeDashboard.js`, `useReceivable.js` e `usePaymentToggle.js`. Haverá conflito pequeno ao juntar as duas.

## Infra da Empresa IA (orquestrador `C:\dev\backstage-orchestrator`)
- `dispatch.py submit --ref <branch> --file <pedido>` envia para revisão por agentes. Pedidos curtos (3 a 4 arquivos) evitam o timeout de 600 s.
- Conselho de Ideias: `dispatch.py submit --conselho --file <briefing>`.
- Correção feita em `run-agent.ps1`: aspas duplas viram aspas simples para o agy (Antigravity).
- O dispatcher morreu duas vezes quando processos Python foram fechados por engano. Se a trava ficar presa (`worker.lock`):
  - mover a tarefa de `running/` para `pending/`;
  - apagar a trava.
