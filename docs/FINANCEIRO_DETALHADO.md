# Financeiro detalhado — revisão local

Data: 29/10/2026. Branch: codex/financeiro-detalhado. Base main conferida: a4d352a.

## Comportamento

- Mês: faturamento dos eventos encerrados, dinheiro recebido pela data real, saldo de realizados de todos os períodos, despesas, previsões e resultado de caixa.
- Empresas: busca e filtros independentes para todas, pendentes, pagos, próximos, em andamento, em atraso e sem vencimento. Empresa abre eventos e seus respectivos valores.
- Calendário: trabalho por dia registrado e recebimentos nas datas reais. Gráficos seguem o modo selecionado. Cachê fechado não é rateado artificialmente entre os dias.
- Recebi: abre a confirmação existente com somente as diárias do evento selecionado. O botão não dá baixa automática.
- Exportar PDF: relatório imprimível do mês escolhido, construído a partir do mesmo modelo financeiro da tela. Texto de registros é escapado no HTML.
- Privacidade: valores ocultos também são removidos de gráficos, textos acessíveis e detalhes financeiros complementares. A exportação exige mostrar os valores.
- Fiscal e os componentes de revisão de horas existentes foram preservados.

## Regras e cobertura dos dados

O evento de 28/10 a 10/11 pertence ao faturamento de novembro. Um pagamento em dezembro pertence aos recebimentos de dezembro. Um evento que ainda está no último dia permanece em andamento até ser encerrado manualmente ou passar o dia final.

Recebimentos novos usam somente paid_date válido. Registros antigos pagos sem data são sinalizados para conferência, sem inventar uma data de recebimento. Helpers legados de outras áreas ainda mantêm seus fallbacks; esses registros incompletos podem apresentar diferença até serem corrigidos na origem.

Atraso exige vencimento conhecido e passado. Previsões se referem a eventos que passam pelo período selecionado; o encerramento previsto é informado nos eventos. Custos do relatório são os registros do período, não uma demonstração contábil completa. Resultado de caixa não significa saldo bancário ou lucro contábil. Não foram introduzidos parcelamentos, estornos ou novas colunas no banco.

## Arquivos centrais

- src/lib/financeDashboard.js e .test.js: modelo de leitura, datas, centavos, grupos de empresa e calendário.
- src/lib/financeDashboardExport.js e .test.js: relatório imprimível do mesmo retrato financeiro.
- src/components/reports/AllAccessDinheiro.jsx: composição A + empresas B + calendário C.
- src/pages/Reports.jsx: integração com detalhes, recebimento e exportação.
- e2e/smoke/finance-dashboard.spec.js: testes dos fluxos novos com dados fictícios e gravações reais bloqueadas.
- Testes existentes de consistência, empresas e função ajustados às novas regras e aos rótulos.

## Validação final

- Unitários: 357 passaram.
- E2E completos contra build local: 141 passaram; 24 pulados por condições/fixme existentes. Duração: 5.4m.
- Lint com --no-ignore dos arquivos de código alterados: aprovado.
- Build: aprovado. Continua um aviso CSS de candidato gerado a partir de regex em exportReport.js e aviso de chunk grande de react-pdf; esses arquivos não foram alterados nesta entrega.
- Capturas: implementação real com dados fictícios, em desktop e celular.
- A primeira suíte completa identificou um cenário antigo que incluía eventos não encerrados em Por função. O cenário foi corrigido para encerrar explicitamente os eventos; a suíte final acima é posterior à correção.

Logs e capturas estão em C:/Users/monte/.codex/visualizations/2026/10/29/01a18584-8c88-75f0-a416-cb11e7766f2a/.

## Estado de entrega

Entrega local validada e publicação expressamente autorizada pelo usuário em 29/10/2026. Sem migração remota; resultado da publicação será registrado após a confirmação do deploy. O backup automático deve respeitar .cursor/PAUSE_AUTO_GIT, já existente; não remover a pausa. Arquivos anteriores não relacionados (.claude/launch.json, e2e/audit/mobile.spec.js e perfil.json) foram preservados.


## Continuação de 29/10 — origem dos indicadores (local)
FinanceMetricDetails abre a composição dos indicadores. financeMetricDetails mantém a seleção e os totais em centavos, a partir do mesmo snapshot de financeDashboard.
No faturamento de eventos pagos, paid_amount informado tem prioridade (inclusive zero), seguido de actual_revenue informado; calculatedAmount permanece para comparação. Sem valor final, o pagamento fica em unverifiedReceiptRows e não integra recebido ou caixa. O histórico não é alterado.
A pendência do cartão mensal considera apenas billedRows não pagos; a aba Empresas e o relatório mantêm o histórico explicitamente identificado. Resumo anual de recebimentos usa as mesmas datas válidas e fontes finais do modelo mensal. Outras páginas que usam helpers legados não foram migradas nesta rodada.
Modais permitem abrir o evento, restauram foco no acionador, respeitam privacidade e usam bp-modal-scroll. Capturas são exemplos com dados de teste. Nenhum dado privado da auditoria foi incluído nos fontes.
Validação: 365 unitários, lint direcionado e build aprovados; resultado da navegação registrado nos artefatos locais. Nenhum novo deploy nesta rodada.

Validação final de navegação desta continuação: 17 aprovados e 1 fixme fiscal existente pulado; nenhum cenário novo pulado. Primeira execução detectou fixture de consistência baseada somente em estimativa; fixture passou a fornecer pagamento confirmado, enquanto o novo cenário protege a exclusão do pagamento sem valor final.


## Datas estimadas e lembretes — 29/10 (local, banco pendente)
paid_date_meta guarda a origem da data reconstruída, regra/dias e data anterior. O campo é opcional e não altera valores de recebimentos. A migração047 está preparada mas a aplicação foi bloqueada pela revisão automática até autorização explícita de mudança do schema de produção. As seis datas não foram gravadas.
Lembrete começa em end_date+10dias corridos, para eventos não pagos e não cancelados. Prazo usual5–15dias não é vencimento. Sem payment_due_date válido, não se deve afirmar atraso. Notificações do app e código de push preparados e testados; nenhum envio ou publicação.
Unidade:428 testes aprovados. Build aprovado. Runtime Deno/Edge e push efetivo ainda não verificados.

Validação de interface após regra do dia10:17 E2E aprovados e1 fixme fiscal existente pulado. Migração e dados não aplicados; aguardam autorização explícita da mudança de schema exigida pela revisão automática.


## Atualização de 30/10 — integração e publicação autorizadas

A prévia independente foi substituída pela integração em AllAccessDinheiro com props vindas dos hooks existentes. financeExplorer concentra comparações equivalentes, filtros por empresa e previsões por encerramento; financeMetricDetails mantém composições conciliadas. FinanceLegacyPanels preserva Fiscal e Análise. Os modais usam Radix, restauração de foco, navegação de volta, privacidade e bp-modal-scroll. O componente anterior FinanceMetricDetails foi substituído pela navegação integrada.

Recebi exige valor e data explícitos. Os campos começam sem confirmação; Recebi hoje é uma escolha do usuário. Nenhum caminho grava automaticamente cachê ou hoje como depósito. O atalho por empresa abre a conferência individual, sem ratear valores. Início e Metas seguem a fonte final registrada e a data de depósito; dados incompletos não se tornam entradas confirmadas.

Migração 047 aplicada no Supabase após autorização explícita. As seis datas históricas aprovadas foram reconstruídas por encerramento +10 dias, preservando paid_amount/status e mantendo a data anterior em paid_date_meta. Backups e reversão estão fora do Git. O serviço send-push-digest está ACTIVE na versão7; respeita dia10 e o calendário de São Paulo. Não houve disparo manual em massa.

435 testes unitários e build aprovados. A suíte completa contra a versão compilada está em execução; o resultado final e o deploy serão registrados após confirmação. O aviso CSS preexistente e o chunk de PDF permanecem. Nenhum snapshot, nota privada ou identificador real de conta foi incluído no código publicado.


### Validação de fechamento — 30/10
Build,lint e435 unitários aprovados. E2E completos:144 aprovados,24 pulados,2 expectativas antigas identificadas. Ambas foram corrigidas e passaram na repetição dirigida (4 aprovados,1 fixme existente). Nenhuma mudança de código de produção após o build. PR de entrega: https://github.com/guihnoo/backstage-pro/pull/2. A verificação do domínio público será registrada separadamente após a publicação.
