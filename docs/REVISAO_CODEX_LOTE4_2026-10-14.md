# Revisão Codex — Lote 4 de horas e cachês (14/10/2026)

Base: branch `feat/horas-cache-v2`, HEAD `9224d35`, trabalho original de Claude. Revisão sobre `hoursReview.js`, `HoursReviewList.jsx`, `HoursOriginChart.jsx` e sua integração de leitura. Nenhum SQL remoto, push, merge ou deploy.

## Resultado

- Confirmado no cenário visual: depois da animação, as barras empilhadas se encostam corretamente. O vão da captura anterior era transitório; não foi tratado como erro de empilhamento.
- Corrigida a contagem de dias da telemetria: reenvios do mesmo dia/evento usam a mesma deduplicação do financeiro; eventos diferentes no mesmo dia continuam distintos.
- Corrigida a janela: totais, médias e horas extras consideram os mesmos meses desenhados nas barras. A legenda mostra o início efetivo do período.
- Corrigido o “valor pela regra atual” de duplicatas: usa o registro escolhido pelo financeiro, em vez do maior valor histórico, que podia estar superado por uma edição.
- Data de ativação inválida não derruba o gráfico.
- As barras respeitam a preferência de movimento reduzido via `useReducedMotion`.

## Validação

186/186 testes unitários passaram, em 14 arquivos; quatro novos casos cobrem divergência de período, reenvio e eventos diferentes, revisão de duplicatas e data inválida. Lint dos três arquivos alterados: exit 0. `npm run build`: exit 0, incluindo PWA. Permanecem avisos preexistentes de CSS e tamanho de chunks. Não foram executados E2E autenticados nem testes no Supabase nesta rodada.

## Limites e pendências

`findHoursIssues` é um conferidor do histórico e não corrige dados. A comparação pela regra atual não comprova que o valor antigo estava errado contratualmente. Registros antigos com jornadas acima de 24 h merecem conferência específica: entrada/saída no relógio não reconstituem sozinhas durações maiores. Nenhum novo cálculo de recebimento ou backfill foi introduzido nesta revisão.

Migrations 035/036, flags e ativação continuam pendentes. Conflito de edição offline/online e lembrete push continuam fora deste lote. A combinação com a branch experimental de pagamentos ainda precisa de revisão própria.

## Arquivos

`src/lib/hoursReview.js`, `src/lib/hoursReview.test.js`, `src/components/reports/HoursOriginChart.jsx`. `HoursReviewList.jsx` foi lido e não alterado. O cenário `.harness/` preexistente foi preservado. O arquivo de pausa correto `.cursor/PAUSE_AUTO_GIT` está presente; o arquivo de pausa na raiz também foi preservado.

O trabalho permanece local, sem commit oficial ou publicação. O teste visual usou dados fictícios em loopback.
