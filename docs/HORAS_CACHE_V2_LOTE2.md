# Horas e cachê v2 — Lote 2 (banco + escolha por dia)

## O que muda
- Cada dia de trabalho guarda **regime** (½ meia / 1 cheia / 2 dobra), **hora_extra** (sim/não) e **origem** (lançada / estimada).
- O cachê do dia = cachê × (½, 1 ou 2) + hora extra (cachê ÷ 12 por hora acima de 12 h), se ligada. As horas **não** mudam o regime.
- 12 h automáticas viram uma função no banco (`aplicar_12h_automaticas`): uma transação, com trava no evento. Só os dias sem registro são preenchidos, marcados como "estimada", e o mesmo dia nunca é duplicado.
- Um índice único passa a impedir dois registros no mesmo dia do mesmo evento (migration 036).

## Ordem segura (o dono aplica; nada disso é automático)
1. **Supabase → SQL Editor:** rodar `supabase/queries/verificar_dias_repetidos.sql` (só leitura).
   - A 2ª consulta confirma que as colunas `date` e `work_date` existem.
   - A 1ª lista os dias repetidos, se houver.
2. Rodar `supabase/migrations/035_daily_work_regime_origem.sql`.
   - Pode rodar de novo sem erro.
   - Altera dados só numa coluna nova (`origem` das 12 h automáticas antigas).
3. Resolver os dias repetidos da etapa 1: o dono decide qual registro fica.
4. Rodar `supabase/migrations/036_daily_work_um_registro_por_dia.sql`. Se ainda houver repetição, ela para com erro e não muda nada.
5. Só então ligar `VITE_REGIME_POR_DIA=true` no app (Vercel → Environment Variables) e publicar.

Com a variável desligada, o app funciona igual ao Lote 1 e não envia as colunas novas. Por isso é seguro publicar o código antes da migration.

## Como foi testado
- Vitest: 161/161, incluindo as regras de escolha por dia e o mapeamento das colunas.
- Laboratório local em PGlite (`C:\dev\_lab\ledger-pglite\daily-work-035.mjs`), sem tocar no Supabase: 18/18. Cobre:
  - migration idempotente e backfill;
  - restrições de valores;
  - a função cria só os dias faltantes e não duplica;
  - o dia já lançado fica intacto;
  - outro usuário, sem login e evento cancelado são recusados;
  - a 036 para com repetição e, depois de resolvida, o índice bloqueia duplicata.
