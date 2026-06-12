# Manual do Usuário — Backstage Pro

> Guia completo para freelancers de eventos (áudio, iluminação, foto, vídeo, DJ, produção).

---

## Primeiros passos

### 1. Criar conta
Acesse o app → **Criar conta** → preencha e-mail e senha → confirme o e-mail recebido.

### 2. Onboarding (5 passos)
Logo após o primeiro login o app guia você por:
1. **Boas-vindas** — tour pelo conceito
2. **Área de atuação** — escolha sua categoria (áudio, iluminação, foto, vídeo, DJ, produção, etc.)
3. **Experiência** — anos de carreira e cidade
4. **Precificação** — valor da sua diária e meta mensal de receita
5. **Meta de diárias** — quantos dias únicos você quer trabalhar por mês

> Você pode alterar tudo isso depois em **Perfil → Metas & Precificação**.

---

## Home `/`

A tela inicial mostra o resumo do mês em tempo real:

| Elemento | O que é |
|----------|---------|
| **Próximo Show** | Seu próximo evento — toque para detalhes ou ative o **Modo Palco** |
| **Modo Palco** | Atalho de check-in GPS ao vivo + cronômetro de horas |
| **Barra de meta** | Progresso das diárias do mês (dias únicos trabalhados) |
| **Quick Stats** | Receita do mês, a receber e eventos confirmados |
| **Alertas Bastidão** | Avisos importantes (eventos sem local, check-in pendente, etc.) |
| **Próximos eventos** | Lista dos próximos 7 dias |
| **Forecast** | Previsão de receita do mês com base na agenda |

**Pull-to-refresh**: puxe a tela para baixo para atualizar.

---

## Agenda `/calendar`

### Criar evento
Toque **+** → preencha título, data, cliente, valor e status. Campos opcionais: local (endereço + GPS), recorrência, notas.

### Status dos eventos
| Status | Significado |
|--------|-------------|
| `confirmed` | Confirmado pelo cliente |
| `tentative` | Em negociação |
| `completed` | Já aconteceu |
| `archived` | Encerrado / arquivado |
| `cancelled` | Cancelado |

### Painel CRM — "Próximos Passos"
Ao abrir um evento **concluído ou arquivado**, aparece um painel de fechamento:
- **Registrar horas** — lança 12h automaticamente ou abre o formulário manual
- **Confirmar recebimento** — marca como pago ou abre WhatsApp para cobrar
- **Evento fechado 🎉** — badge verde quando horas + pagamento estão ok

### Alertas CRM proativos
Na aba Alertas do calendário aparecem:
- **Horas pendentes** — eventos dos últimos 14 dias sem registro de horas
- **Pagamentos vencidos** — eventos com `vencimento` passado e não pagos
- Toque em **Ver evento** para abrir o modal diretamente.

### Google Calendar
Em **Perfil → Google Calendar** você conecta sua conta Google. Após conectar:
- Eventos do Google aparecem na Agenda como itens de leitura
- Toque em **Sincronizar** para importar/atualizar

---

## Clientes `/clients`

- **Empresa** (CNPJ) vs **Pessoa** (CPF) — escolha o tipo ao criar
- Busca por nome, CNPJ ou importe via **NF-e XML** (arraste o arquivo XML)
- Clique em um cliente para ver histórico de eventos, receita total e dados de contato
- Clientes com eventos rascunho aparecem com badge **Rascunho**

---

## Despesas `/expenses`

- Registre custos de cada evento (transporte, equipamento, alimentação, etc.)
- **OCR de recibo**: toque no ícone de câmera → fotografe o recibo → o app preenche automaticamente valor, data e categoria via IA
- Despesas agrupadas por mês com collapse animado
- Filtre por evento ou categoria

---

## Relatórios `/reports`

- **Período**: selecione mês, trimestre, semestre ou ano
- **KPIs**: receita total, ticket médio, top clientes, top eventos
- **Gráfico**: área animada de receita ao longo do tempo
- **Mapa**: cidades onde você trabalhou (mapa interativo do Brasil)
- **Export**: PDF ou CSV pelo botão de download

---

## Metas `/goals`

Três círculos de progresso:
1. **Diárias** — dias únicos trabalhados vs meta
2. **Receita** — receita confirmada vs meta de receita
3. **A Receber** — valor ainda não pago (âmbar)

Ao bater 100% em uma meta, uma animação de celebração com partículas é disparada.

---

## IA Mentor `/ai-mentor`

Seu assistente financeiro personalizado. Usa os dados reais do app (agenda, despesas, clientes, metas) para responder perguntas contextuais.

**Exemplos de perguntas:**
- "Qual meu ticket médio esse mês?"
- "Tenho pagamentos em atraso?"
- "Quanto já recebi de [cliente X]?"
- "Estou no caminho certo para bater minha meta?"

**Funcionalidades:**
- **Sugestões inteligentes** — chips com perguntas relevantes ao seu contexto
- **TTS** — toque no ícone de volume para ouvir a resposta
- **Histórico** — ícone de clock abre o painel com conversas anteriores
- **Nova conversa** — ícone + limpa e começa do zero

---

## Perfil `/profile`

| Seção | O que faz |
|-------|-----------|
| **Dados Pessoais** | Nome, telefone, cidade, estado, experiência |
| **Área de Atuação** | Categoria (muda as cores e o emoji de todo o app) |
| **Metas & Precificação** | Valor da diária, meta de receita, meta de diárias |
| **Alertas no celular** | Ativa/desativa push notifications |
| **Google Calendar** | Conecta conta Google para sync bidirecional |
| **Ajuda do app** | Reinicia o tour guiado pela Home |
| **Suporte & Feedback** | Envia mensagem diretamente para a equipe |
| **Visibilidade Financeira** | Oculta valores em todo o app (modo privado) |
| **Instalar como app** | Aparece quando o browser suporta PWA; instala no homescreen |
| **Exportar meus dados** | Baixa backup JSON com todos os seus dados |

---

## Modo offline

O app funciona sem internet para visualização. Quando a conexão cai, um banner é exibido no topo. Ao reconectar, aparece a mensagem **"Conexão restaurada"** e os dados são sincronizados automaticamente.

---

## Notificações push

Ative em **Perfil → Alertas no celular**. O app envia:
- **Resumo matinal (8h)** — eventos do dia + alertas de pagamento
- **Resumo noturno (18h)** — balanço do dia e próximos compromissos

---

## Atalhos e gestos

| Ação | Gesto |
|------|-------|
| Atualizar dados | Pull-to-refresh (puxar para baixo) |
| Abrir modal de dia | Toque no dia no calendário |
| Novo evento rápido | Botão + (flutuante) na Agenda |
| Modo Palco | Card "Próximo Show" na Home |

---

## Segurança e privacidade

- Todos os dados são armazenados no Supabase com RLS (Row Level Security) — cada usuário vê apenas seus próprios dados.
- Senhas gerenciadas pelo Supabase Auth (bcrypt).
- Backup exportável a qualquer momento em **Perfil → Exportar meus dados**.

---

## Versão e suporte

**Backstage Pro v1.0** — PWA (Progressive Web App)  
Compatível com Chrome, Safari, Firefox e Edge em desktop e mobile.  
Para suporte ou sugestões: **Perfil → Suporte & Feedback**.
