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
