# Auditoria visual — All Access (21/10/2026)

Pedido do Guih: "testei e vi páginas e itens com o modelo antigo; preciso da auditoria nos lugares não auditados para homogeneizar o app todo".

## Como foi feita

1. **Por código** — script percorre o grafo de imports a partir de `src/main.jsx` (142 arquivos `.jsx` alcançáveis) e conta marcas do visual antigo: cores Tailwind antigas (slate/azul/verde/âmbar…), `NeonGlass`/`NeonPageShell`, classes de tema `bp-*`, degradê/vidro, hex azul‑marinho, `font-mono`, `font-black`.
   - Antes: **80 arquivos** com marcas antigas. Depois: as marcas que sobraram são só nomes de classe que já desenham no padrão novo (`bp-*` = amarelo, `NeonGlass` = cartão padrão).
2. **Por fotos** — 31 fotos com dados de teste (390 px): todas as páginas, as 5 vistas da Agenda, as 3 abas da janela do evento, gaveta de ações, abas de Metas e Dinheiro, e as janelas (despesa, recibo, cliente, calculadora, disponibilidade, modelos, busca, feedback).

## O que mudou na raiz (vale para o app inteiro)

| Peça | Antes | Agora |
|---|---|---|
| `NeonGlass` (cartão) | vidro azulado com brilho | cartão `#161616`, borda `#222`, cantos 16px |
| `NeonPageShell` (fundo de página) | fundo com brilho/grade de palco | preto liso `#0a0a0a` |
| `.bp-chip-active` / `.bp-view-active` | amarelo transparente | amarelo cheio com texto preto |
| Cores Tailwind antigas | slate, azul, verde, âmbar, vermelho… | cinzas neutros, amarelo `#ffd400`, rosa `#ff2e88` (selo claro → texto preto) |
| Hex azul‑marinho (`#050609`, `#0f172a`…) | fundos azulados | pretos e cinzas neutros |
| `font-mono` | monoespaçada genérica | Space Mono (`font-tag`) |
| Aviso "sem internet" | amarelo sobre amarelo | amarelo com texto preto |
| Toasts | vidro azulado | cartão `#161616` |

## Tela por tela

| Tela / janela | Situação encontrada | Feito |
|---|---|---|
| Início | ok (entregas 2/5) | — |
| Agenda › Mês | ok (entrega 9) | — |
| Agenda › Lista | selo mostrava `in_progress` cru; cores antigas | selos com as cores da legenda (amarelo confirmado, rosa a receber, cinza pago) e nomes em português |
| Agenda › Semana / Kanban / Próximos | cores antigas, `NeonGlass` na faixa Hoje | paleta nova + cartão padrão |
| Janela do evento (Resumo/Horas/Dinheiro) | títulos de seção em texto comum; documentos em botões amarelos com texto cortado; PIX em caixa tracejada | títulos em etiqueta; documentos em lista de linhas com nomes curtos; PIX nos campos do padrão; local sem título repetido; cartões sem degradê |
| Checklist de palco | título comum | etiqueta "Checklist de palco" |
| Metas › Conquistas | cartões com brilho e cores por conquista | selo amarelo quando feita, progresso amarelo, título em Anton |
| Metas › MEI | títulos comuns, degradê | etiquetas, cartões lisos, alerta só com borda rosa |
| Clientes / ficha / editar | títulos de bloco comuns | etiquetas; "Cor da empresa" em etiqueta (as cores do seletor continuam coloridas de propósito) |
| Despesas / recibo / item de despesa | cores antigas, `NeonGlass` | paleta nova + cartão padrão |
| Ajuda | título comum | "Manual do app" em Anton com etiqueta |
| Privacidade / Termos / Erro / Admin | cores antigas | paleta nova (entrega 15 + esta) |
| Calculadora, disponibilidade, modelos, busca, feedback | ok depois da paleta | — |

## Ficou de fora (de propósito)

- Seletor de **cor da empresa** (`ColorGridPicker`): as cores são o próprio dado.
- Cores das **funções** no Perfil (barrinha colorida por função), como no protótipo.
- Arquivos que nenhuma tela usa mais (`ClientDetailModal`, `ClientInsightsModal`, `ClientActionSheet`, gráficos antigos de Relatórios…): não aparecem no app; candidatos a apagar numa faxina.
- Funções novas do protótipo (ideias 106–109): colar WhatsApp, entrada e saída, credencial com foto, várias funções com cachê.

## Como repetir

Scripts usados ficam fora do repositório (pasta temporária da sessão): `aa_audit.py` (auditoria por código), `aa_palette2.py` (troca de paleta), e o roteiro de fotos `zz-auditoria-visual.spec.js`. Se precisar repetir, peça ao agente para recriá‑los a partir desta descrição.
