# Plano — dar vida ao app (animação, interatividade, logo) sem pesar

> Criado em 2026-10-22 a pedido do Guih: "um app que não seja engessado", usando o que já temos, sem sobrecarregar, e uma logo criativa.
> Dados da varredura vêm da API pública do GitHub em 22/10/2026 (estrelas, licença e último envio).

## 1. O que o app já tem (não trazer de novo)

- `framer-motion` 12 em 63 arquivos, `tailwindcss-animate`, `vaul` (gavetas), `driver.js` (tour).
- `src/lib/liteMotion.js`: **regra de economia** — em celular, aparelho modesto, "reduzir movimento" ou economia de dados, animação decorativa em loop nem começa (`LOOP`, `loopAnim`). **Toda animação nova obedece a isso.**
- CSS: feixe de luz do login (`aa-beam-sweep`), faixa de letreiro (`aa-marquee`), `bp-breath`, `bp-load`.
- `haptics.js` (vibração curta), pull-to-refresh, toasts.

## 2. Varredura no GitHub — o que existe e o que serve

### Skills / agents (instruções para a IA, não entram no app)

| Projeto | Estrelas | Licença | Serve para | Veredito |
|---|---|---|---|---|
| kaankiziltug/logo-design-skill | 4,2 mil | MIT | Método de logo: 8–12 conceitos, 3 em SVG, testes de 16 px, uma cor e "apertar os olhos", kit de ícones | **Adotar o método (já usado). Instalar só com ok.** Scripts em Python puro |
| nextlevelbuilder/ui-ux-pro-max-skill | 139 mil | MIT | Inteligência de design de UI/UX | Candidata; ler antes |
| Nutlope/hallmark | 30,8 mil | MIT | "Anti-genérico": evita cara de IA | Candidata para revisar telas |
| alchaincyf/huashu-design | 25,8 mil | MIT | Protótipos, slides, animações em HTML | Útil para protótipos de movimento |
| plugin87/ux-ui-agent-skills | 2,8 mil | MIT | Tokens, componentes, regras WCAG 2.2 | Candidata para a frente de acessibilidade |
| 199-biotechnologies/motion-dev-animations-skill | 205 | MIT | Animações Motion (mola, rolagem) | **Casa com o que já usamos** (framer-motion = Motion) |
| rossark0/rossark-motion-skill | 292 | MIT | SVG → animação 60 fps (React Native/SwiftUI) | Não serve (app é web) |
| oil-oil/oil-motion | 2,7 mil | MIT | Animação por rolagem com **vídeo de IA** e quadros pesados | **Não usar**: pesado e pago por geração |
| charlie947/motion-graphics-skills | 369 | MIT | 13 skills de motion em código | Olhar depois |
| frankxai/awesome-motion-design-agent-skills | 76 | CC0 | Lista de skills de GSAP, Motion, Remotion, Lottie, Rive | Fonte de consulta |
| zhuyansen/awesome-ai-image-skills | 1 | outra | Lista de skills de geração de imagem (inclui avaliação de segurança) | Só consulta |

### Bibliotecas de movimento (entram no app)

| Biblioteca | Estrelas | Licença | Peso aprox. | Veredito |
|---|---|---|---|---|
| motiondivision/motion (framer-motion) | 34 mil | MIT | já no app | **Base de tudo**; usar `LazyMotion` onde der para emagrecer |
| formkit/auto-animate | 13,9 mil | MIT | ~3 KB | **Boa**: listas que entram/saem sozinhas (Agenda, Despesas), quase zero código |
| catdad/canvas-confetti | 12,8 mil | ISC | ~6 KB | **Boa, carregada sob demanda**: só na conquista desbloqueada e no "Recebi" |
| pmndrs/use-gesture | 9,6 mil | MIT | ~9 KB | Só se o framer-motion (que já tem arrastar) não bastar; último envio em 2024 |
| pmndrs/react-spring | 29 mil | MIT | ~25 KB | **Não**: duplica o framer-motion |
| airbnb/lottie-web | 32 mil | MIT | ~150 KB | **Não**: pesado; sem envio desde 09/2025. Para o logo, SVG + CSS basta |
| LottieFiles/dotlottie-web | 0,9 mil | MIT | ~100 KB (WASM) | Só se um dia houver animação de designer |
| rive-app/rive-react | 1,2 mil | MIT | ~150 KB (WASM) | Só para mascote interativo; hoje não vale o peso |

**Regra de segurança para skills de terceiros:** uma skill é texto que a IA obedece. Antes de instalar: ler o `SKILL.md` e os scripts, fixar a versão (commit), nunca dar chaves, e instalar só com o ok do Guih. Nada foi instalado nesta varredura.

## 3. Orçamento de movimento (para não sobrecarregar)

1. Só `transform` e `opacity` (a GPU faz); nunca animar largura, altura ou sombra.
2. Entradas de 150–300 ms; nada acima de 400 ms.
3. Sem loop infinito fora do logo de abertura e do carregamento; loops obedecem `LITE_MOTION`.
4. Lista longa: animar só os 8 primeiros itens (o resto aparece parado).
5. Medir antes e depois com `e2e/perf/startup.spec.js`; a abertura não pode piorar.
6. Biblioteca nova só se for lazy e < 10 KB.
7. Tudo respeita "reduzir movimento".

## 4. Catálogo de vida por tela (ordem de valor)

| # | Onde | O que se mexe | Peso |
|---|---|---|---|
| 1 | Abertura do app | Logo animada (colar a fita / balançar o crachá) no lugar da tela preta com a barra | Baixo (SVG + CSS) |
| 2 | Toda ação de salvar | Check que "desenha" + vibração curta (hoje só muda a cor do botão) | Baixo |
| 3 | Início, Dinheiro, Metas | Números que sobem até o valor (contagem) ao abrir | Baixo |
| 4 | Metas | Anéis de progresso que enchem; conquista desbloqueada com confete | Baixo + 6 KB lazy |
| 5 | Agenda, Despesas | Item novo/removido entra e sai com suavidade (auto-animate) | 3 KB |
| 6 | Barra de baixo | Indicador amarelo que desliza entre as abas | Baixo |
| 7 | Troca de tela | Transição curta compartilhada (Início → detalhe do show) | Médio, testar no iPhone |
| 8 | Agenda | Arrastar o show para o lado: "Recebi" / "Cobrar" | Médio (framer-motion já tem) |
| 9 | Esqueletos | Troca suave para o conteúdo (sem "piscar") | Baixo |
| 10 | Mapa | Estado novo "acende" no mapa quando você trabalha nele pela primeira vez | Baixo |
| 11 | Mentor | Texto da resposta aparecendo em fluxo | Baixo |

## 5. Logo

- Quadro com 4 caminhos (Fita de palco, Passe, Feixe, Case) publicado como artefato "Logo Backstage Pro"; recomendação: **Fita de palco** como símbolo, **Passe** como alternativa segura para o ícone.
- Escolha pendente. Depois: refino do desenho, kit de ícones (arquivos novos, ver `PLANO_NOVA_LOGO.md`), versão animada da abertura e aviso do iPhone.
- **Personagens/mascote:** não incluído. Se o Guih quiser um "roadie" animado, entra como etapa à parte (custo de peso: Rive ou SVG animado).

## 6. Ordem sugerida

1. Escolher a logo (Guih).
2. Itens 1–2 do catálogo (abertura animada + salvar com check): visível e barato.
3. Itens 3–6 (números, anéis, confete, listas, aba): vida no dia a dia.
4. Medir no iPhone e só então os itens 7–8.
5. Avaliar instalar `logo-design-skill` e `hallmark` (com ok).
