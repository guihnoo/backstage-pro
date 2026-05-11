# Análise Visual + Funcional — Cada Página em Detalhe

## 1. DASHBOARD — Visão Executiva do Mês

### O que REALMENTE mostra
- **Header**: Saudação + Período Selector (this_month, last_month, last_3_months, etc.)
- **4 Stat Cards clicáveis**:
  - Faturamento Realizado (eventos PAGOS no período)
  - A Receber (eventos concluídos mas UNPAID)
  - Horas Trabalhadas (sum de daily_work no período)
  - Eventos Concluídos (count)
- **Gráfico interativo**: 3 barras/linhas (Realizado, A Receber, Projetado)
  - Realizado: eventos com payment_status='paid'
  - A Receber: eventos completed + unpaid
  - Projetado: eventos scheduled
- **Lista de Eventos do Período**:
  - Título, cliente, datas, status (scheduled/in_progress/completed/pending_payment)
  - Filtro por status
- **Payment Alerts**: Card destacando eventos vencidos/em atraso
- **Modais**: 
  - StatDetailModal (ao clicar em card de stat)
  - EventDetailModal (ao clicar em evento)

### Layout
```
┌─────────────────────────────────────────┐
│ Bem-vindo, [Nome]! | [Período Selector] │
├─────────────────────────────────────────┤
│ [Faturamento] [A Receber] [Horas] [Evt] │
├─────────────────────────────────────────┤
│ [Gráfico: Realizado vs A Receber]      │
├─────────────────────────────────────────┤
│ 🚨 Payment Alerts                        │
│   - Evento X vencido há 15 dias          │
├─────────────────────────────────────────┤
│ Eventos do Período:                      │
│ [Casamento - Confirmado]                 │
│ [Wedding - A Receber]                    │
│ [Corporate - Concluído]                  │
└─────────────────────────────────────────┘
```

### Cores por categoria
- **Som**: Verde Neon (#39FF14) — cards/gráficos com verde
- **Luz**: Roxo (#A64AFF) — cards/gráficos com roxo
- **Foto**: Laranja (#FF6B35) — cards/gráficos com laranja
- **DJ**: Cyan (#00D9FF) — cards/gráficos com cyan

---

## 2. CALENDAR — Motor de Gestão

### O que REALMENTE mostra
- **4 Visualizações**:
  1. **Mês** (grid 7×5 com dias)
  2. **Semana** (7 colunas, timeline horária)
  3. **Dia** (timeline 00:00-23:59 em detalhe)
  4. **Agenda** (lista vertical de eventos)

- **Stats do Mês** (acima do calendário):
  - Total de eventos
  - Dias com trabalho
  - Horas trabalhadas
  - Clientes ativos (unique count)
  - Receita gerada (soma de daily_work.daily_cache)

- **Mini Calendário** (sidebar esquerda):
  - Navegação mes a mes
  - Destaca dias com eventos
  - Hoje em destaque

- **Event Cards** no grid:
  - Cor baseada no client_id (fixo por cliente)
  - Título truncado
  - Hora de início
  - Dots para múltiplos eventos no mesmo dia

- **Quick Actions** (ao clicar em um dia):
  - Menu flutuante com:
    - [+ Novo Evento]
    - [+ Horas (Daily Work)]
    - [+ Despesa]
    - [Ver Dia em Detalhe]

- **Modais**:
  - EventForm (criar/editar evento)
  - DailyWorkModal (registrar horas de trabalho)
  - EventDetailModal (detalhes completo + editar)
  - ExpenseForm (adicionar despesa rápida)
  - DrilldownModal (lista filtrável: eventos, horas, clientes)

- **Mobile**: ActionSheets ao invés de modais (bottom drawer)

### Layout (Mês)
```
┌──────────────────────────────────────┐
│ Maio 2024 | [< Hoje >]               │
│ Stats: 8 eventos | 12 dias | 96.5h   │
├──────────────────────────────────────┤
│ Min  | Dom  | Seg  | Ter  | Qua      │
├──────────────────────────────────────┤
│ 1    | 2    | 3    | 4    | 5        │
│      |[Cas] |      |[Evt] |          │
├──────────────────────────────────────┤
│ 8    | 9    | 10   | 11   | 12       │
│ [Ev] |      |      |[Web] |[Corp]    │
└──────────────────────────────────────┘
```

### Comportamento
- **Clique em dia vazio**: Quick actions para criar evento
- **Clique em evento**: EventDetailModal com opções de editar/deletar
- **Drag & Drop**: Arrastar evento para outra data (reagendar)
- **Duplo clique**: Abre evento para edição rápida
- **Mobile**: Tap abre ActionSheet

---

## 3. CLIENTS — CRM de Relacionamento

### O que REALMENTE mostra
- **Search + Filtros**:
  - Search por nome/contact_person
  - Filter: Todos / Ativos / Inativos
  - (Ativo = último evento há menos de 6 meses)

- **Grid de Cliente Cards**:
  - Avatar/Logo
  - Nome do cliente
  - Status (Ativo/Inativo)
  - Eventos: "8 eventos"
  - A Receber: "R$ 3.200"
  - **Action Buttons**:
    - 📧 Email
    - 📱 WhatsApp (link wa.me)
    - 📞 Telefone
    - 📊 Insights (abre ClientInsightsModal)
    - ⋯ Menu (editar/deletar)

- **ClientDetailModal** (ao clicar no card):
  - Informações completas:
    - Nome, contact_person, email, phone
    - Logo/Avatar
    - Histórico de eventos (últimos 6 meses)
    - Pagamentos (recebidos vs pendentes)
    - Score/Rating (como cliente)
  - Botões:
    - [Editar]
    - [Nova Transação]
    - [Contatar]

- **ClientInsightsModal**:
  - Gráfico: Evolução de eventos por mês (últimos 6)
  - Gráfico: Receita acumulada
  - Top 3 especialidades mais usadas com este cliente
  - Margem média de lucro por evento

### Layout
```
┌────────────────────────────────────────┐
│ 👥 Clientes                            │
│ [Search: tipo nome...]  [Todos ▾]      │
├────────────────────────────────────────┤
│ [Card: Produtora XYZ]  [Card: ABC Corp]│
│  Logo  8 eventos       Logo  5 eventos  │
│  R$ 5k a receber       R$ 2k a receber  │
│  ✉ 📧 📱 📊 ⋯          ✉ 📧 📱 📊 ⋯    │
├────────────────────────────────────────┤
│ [Card: Festival]       [+ Novo Cliente]│
│  Logo  15 eventos                       │
│  R$ 12k a receber                       │
│  ✉ 📧 📱 📊 ⋯                           │
└────────────────────────────────────────┘
```

### Cores
- Avatar: Cor baseada no hash do cliente_id (consistente)
- Fundo: Escuro
- Status badge: Verde (Ativo) / Cinza (Inativo)
- A Receber: Laranja (warning)

---

## 4. EXPENSES — Rastreamento de Gastos

### O que REALMENTE mostra
- **3 Stat Cards** (no topo):
  - Gasto Total (soma de todos)
  - A Reembolsar (is_reimbursable && !reimbursed)
  - Reembolsado (reimbursed === true)

- **Search + Filtros**:
  - Search por title/description
  - Filter por categoria (combustível, transporte, hospedagem, etc.)
  - Filter por status (Todos, A Reembolsar, Reembolsado)

- **Lista de Despesas**:
  - Título, descrição (truncada)
  - Categoria (ícone + label)
  - Data
  - Valor (alinhado à direita, em destaque)
  - Status (reembolsado ✓ ou pendente ⏳)
  - Action buttons:
    - 📸 Ver Recibo (se existe receipt_url)
    - ✏️ Editar
    - 🗑️ Deletar

- **ReceiptAnalyzer Modal**:
  - Upload de foto de recibo
  - OCR extrai:
    - Título/loja
    - Valor
    - Data (se legível)
  - Pré-preenche form de despesa
  - Usuário confirma/edita

- **ExpenseForm Modal** (criar/editar):
  - Título
  - Descrição
  - Valor
  - Categoria (select)
  - Data (date picker)
  - Evento relacionado (opcional)
  - Checkbox: "É reembolsável?"
  - Upload de recibo (opcional)

### Layout
```
┌──────────────────────────────────────┐
│ 💰 Despesas                          │
│ [Gasto] [A Reemb.] [Reemb.]          │
│  R$ 2.5k   R$ 1.2k    R$ 1.3k        │
├──────────────────────────────────────┤
│ [Search: diesel...]  [Categoria ▾]    │
├──────────────────────────────────────┤
│ Diesel gerador          | 2024-05-10 │
│ Abastecimento 200L      | R$ 850.00  │
│ Combustível | 📸 ✏️ 🗑️  | ⏳ Pendente │
├──────────────────────────────────────┤
│ Hotel São Paulo (2 noites) │ Hotelar │
│ Hospedagem              | R$ 450.00  │
│ Hospedagem | 📸 ✏️ 🗑️  | ✓ Reemb.   │
├──────────────────────────────────────┤
│ [📷 Digitalizar Recibo] [+ Nova Desp]│
└──────────────────────────────────────┘
```

---

## 5. REPORTS — Analytics Profissional

### O que REALMENTE mostra
- **KPI Selector** (period): this_month / last_month / last_3_months / last_6_months / this_year / all_time

- **4 KPI Cards clicáveis**:
  - Faturamento Total (realized + receivable)
  - A Receber (sum de unpaid completed events)
  - Lucro Líquido (total revenue - expenses)
  - Clientes Ativos (unique count)
  - Cada card mostra a mudança % vs período anterior (↑ verde ou ↓ vermelho)

- **Projeção Card**:
  - "Se o ritmo continuar..."
  - Projeção de faturamento para próximo período
  - % de crescimento esperado

- **3 Tabs**:
  1. **Visão Geral**:
     - Gráfico stacked/area: Realizado vs A Receber vs Projetado (por data)
     - Card: Resumo Financeiro (total revenue, expenses, profit)
     - Top 3 eventos do período (by value)

  2. **Clientes**:
     - Tabela com colunas:
       - Cliente (nome + logo)
       - Eventos (count)
       - Receita (total paid)
       - A Receber (total unpaid)
       - % do total
     - Sort por receita DESC
     - Clique abre ClientInsightsModal

  3. **Despesas**:
     - Gráfico de pizza: Despesas por categoria
     - Tabela:
       - Categoria
       - Total
       - % do total de gastos
     - Alertas: "Combustível está em 45% do budget"

- **Drilldown Modal** (ao clicar em seção do gráfico):
  - Lista filtrável de eventos daquele dia/período
  - Columns: Evento, Cliente, Receita, Status
  - Export to CSV

### Layout
```
┌──────────────────────────────────────┐
│ 📊 Relatórios | [Período: Maio ▾]    │
├──────────────────────────────────────┤
│ [Faturamento] [A Receber] [Lucro] [Cl]│
│  R$ 24.5k ↑15% R$ 9.3k  R$ 21.3k  5  │
├──────────────────────────────────────┤
│ 📈 Projeção: Se continuar assim...    │
│    Faturamento do ano: R$ 294k (↑18%) │
├──────────────────────────────────────┤
│ [Visão Geral] [Clientes] [Despesas]  │
├──────────────────────────────────────┤
│ [Gráfico Area: Realizado/Rec/Proj]   │
├──────────────────────────────────────┤
│ Top 3 Eventos:                        │
│ 1. Wedding (R$ 2.5k)                  │
│ 2. Festival (R$ 2.2k)                 │
│ 3. Corporate (R$ 1.8k)                │
└──────────────────────────────────────┘
```

---

## 6. AI MENTOR — Chat Inteligente

### O que REALMENTE mostra
- **Header**:
  - Logo "AI Mentor Pro"
  - Botão de áudio (speaker icon) on/off
  - Botão "Nova Conversa"
  - Botão "Histórico de Conversas"

- **Área de Mensagens**:
  - Se vazia: Bem-vindas + SmartSuggestions (4 cards clicáveis):
    - "Qual foi meu faturamento este mês?"
    - "Quais clientes me pagaram?"
    - "Analise meus gastos de abril"
    - "Qual é minha tendência?"
  - Se com mensagens: Scroll com MessageBubbles:
    - User bubble: Azul, alinhado à direita
    - Assistant bubble: Cinza, alinhado à esquerda
    - Links clicáveis (gera nova mensagem)
    - Código/tabelas formatadas

- **Área de Input**:
  - 📎 Upload file (imagem, PDF, CSV, XLSX)
  - Textarea multiline
  - Send button (paper plane)
  - Status: "Digitando..." / "Esperando resposta..."

- **Histórico Lateral** (ao clicar "Histórico"):
  - Lista de conversas anteriores
  - Titulo automático (com data ou resumo)
  - Clique abre conversa
  - Delete button

### SmartSuggestions (baseado em userData)
- Analisa `data.events`, `data.expenses`, `data.dailyWork` atual
- Gera 4 sugestões contextuais:
  - Se falta 2 dias pro final do mês: "Você vai atingir a meta?"
  - Se há pagamentos vencidos: "Analise meus pagamentos em atraso"
  - Se há novos clientes: "Quem foram meus novos clientes este mês?"
  - Se há despesas altas: "Por que minhas despesas subiram 40%?"

### Layout
```
┌────────────────────────────────────┐
│ AI Mentor Pro | 🔊 | Histórico | + │
├────────────────────────────────────┤
│ Oi! Sou o AI Mentor.               │
│ Posso analisar seu negócio...       │
│                                    │
│ [Sugestão 1] [Sugestão 2]          │
│ [Sugestão 3] [Sugestão 4]          │
├────────────────────────────────────┤
│ 📎 [Escreva aqui...]            [➤] │
└────────────────────────────────────┘

Após enviar mensagem:
┌────────────────────────────────────┐
│ 💬 Qual foi meu faturamento?       │
│                       ↳ User blue  │
│ Em maio você faturou R$ 24.5k...   │
│ ↳ Assistant gray                   │
│ [Gráfico] [Comparativo]            │
└────────────────────────────────────┘
```

### Áudio
- Text-to-speech em português-BR
- Lê cada resposta do assistente automaticamente
- Usuário pode desabilitar com botão speaker

---

## 7. PERFIL — Identidade + Configurações

### O que REALMENTE mostra
- **Coluna Esquerda**:
  - **Card: Perfil**:
    - Avatar/Logo upload
    - Nome (editável)
    - Email (read-only)
    - Área de Expertise (select)
    - [Salvar]
  
  - **Card: Google Calendar Sync**:
    - Status: "Conectado" / "Desconectado"
    - Se conectado:
      - Mostra email da conta Google
      - [Desconectar]
      - Sincronização automática ativa
    - Se desconectado:
      - [Conectar com Google]
      - Explicação: "Sincronize seus eventos automaticamente"

- **Coluna Direita**:
  - **Card: Configurações**:
    - Toggle: Financial Visibility (mostra R$ ou ••••)
    - Toggle: Notificações por Email
    - Select: Tema (Dark / Light / Auto)
  
  - **Card: Backup Manager**:
    - Último backup: "2024-05-15 às 10:30"
    - [Fazer Backup Agora]
    - [Restaurar Backup]
    - [Baixar Dados (CSV)]

- **Rodapé**:
  - [Logout] - botão destaque
  - "Você será desconectado"

### Layout
```
┌────────────────────────────────────┐
│ 👤 Meu Perfil                      │
├────────────┬────────────────────────┤
│ Card: Perfil  │ Card: Configurações │
│ [Avatar]      │ 🌙 Dark Mode        │
│ Nome: [...]   │ 📧 Email Notif      │
│ Email: (...) │ 📊 Financial Vis.    │
│ Área: [Luz ▾]│                      │
│ [Salvar]      │ Card: Backup         │
│               │ Último: 2024-05-15   │
│ Card: Google  │ [Backup Agora]       │
│ ✓ Conectado   │ [Restaurar]          │
│ joao@gm.com   │ [Download CSV]       │
│ [Desconectar] │                      │
├────────────────────────────────────┤
│ [🚪 Logout]                        │
└────────────────────────────────────┘
```

---

## PADRÃO VISUAL GLOBAL

### Header de Página
```
┌──────────────────────────────────────────┐
│ 📊 Título Página | [Seletor/Filtro ▾]    │
│ Descrição curta                          │
└──────────────────────────────────────────┘
```

### Card Padrão
```
┌─────────────────────────────────┐
│ 📌 LABEL (uppercase, gray)      │
│                                 │
│ R$ 24.500,00  (value, big)      │
│ Comparado ao mês anterior ↑12%  │
│                                 │
│ [Button 1] [Button 2]          │
└─────────────────────────────────┘
```

### Modal Padrão
```
┌─────────────────────────────────────┐
│ Titulo Modal                      ✕ │
├─────────────────────────────────────┤
│ [Conteúdo]                          │
│                                     │
│ [Campo 1] [Campo 2]                 │
│ [Campo 3]                           │
│                                     │
├─────────────────────────────────────┤
│ [Cancelar] [Salvar]                 │
└─────────────────────────────────────┘
```

### Cores por Ação
- **Sucesso**: Verde (#39FF14)
- **Ação Principal**: Cyan (#00D9FF) → Purple (#A64AFF) gradient
- **Aviso**: Laranja (#FF6B35)
- **Erro**: Vermelho
- **Neutro**: Cinza (#6B7280)

### Animações
- Slide-in: Modais e Action Sheets entram de baixo
- Fade: Cards e listas
- Scale: Botões ao hover
- Pulse: Loading states

---

## PRÓXIMA ETAPA

Baseado nesta análise, criar protótipos que refletem:
1. ✅ Layout REAL de cada página
2. ✅ Funcionalidade REAL (botões, modais, filtros)
3. ✅ Dados exemplares (números, datas, clientes reais)
4. ✅ Cores por categoria (Som=Verde, Luz=Roxo, etc.)
5. ✅ Responsividade mobile (ActionSheets)

Isso dará uma BASE VISUAL SÓLIDA para implementar as páginas React.
