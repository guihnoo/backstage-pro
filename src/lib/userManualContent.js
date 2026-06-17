import {
  Home,
  Calendar,
  Users,
  Receipt,
  BarChart2,
  Target,
  Sparkles,
  User,
  Wifi,
  Hand,
  Shield,
} from 'lucide-react';

/** Conteúdo do manual in-app — espelha docs/MANUAL_USUARIO.md */
export const USER_MANUAL_SECTIONS = [
  {
    id: 'primeiros-passos',
    title: 'Primeiros passos',
    icon: User,
    items: [
      {
        heading: 'Criar conta',
        body: 'Acesse o app → Criar conta → e-mail e senha → confirme o e-mail recebido. Também é possível entrar com Google.',
      },
      {
        heading: 'Onboarding (5 passos)',
        body: 'Após o primeiro login: boas-vindas, área de atuação (categoria), experiência, precificação e meta de diárias. Tudo editável depois em Perfil.',
      },
      {
        heading: 'Tour guiado',
        body: 'Na primeira visita à Home, um tour mostra cockpit, menu e atalhos. Rever em Perfil → Ajuda do app.',
      },
    ],
  },
  {
    id: 'home',
    title: 'Home',
    icon: Home,
    route: '/',
    items: [
      {
        heading: 'Cockpit do mês',
        body: 'Próximo show, barra de meta (diárias únicas), quick stats, alertas, próximos eventos e forecast de receita com % da meta já garantida.',
      },
      {
        heading: 'Pipeline Financeiro',
        body: 'Total a receber, despesas do mês e resultado líquido (receita − despesas) logo abaixo dos stats.',
      },
      {
        heading: 'Modo Palco',
        body: 'Quando há show hoje, o header entra em destaque âmbar com check-in GPS e cronômetro de horas.',
      },
      {
        heading: 'Alertas inteligentes',
        body: 'CRM: horas pendentes (14 dias), pagamentos vencidos, follow-ups de interações de cliente e dias sem registro em eventos multi-dia.',
      },
      {
        heading: 'Atualizar',
        body: 'Puxe a tela para baixo (pull-to-refresh) para sincronizar dados em tempo real.',
      },
      {
        heading: 'Botão +',
        body: 'Atalho flutuante para novo evento, cliente ou despesa sem trocar de tela.',
      },
    ],
  },
  {
    id: 'agenda',
    title: 'Agenda',
    icon: Calendar,
    route: '/calendar',
    items: [
      {
        heading: 'Vistas disponíveis',
        body: 'Grade mensal, Semana, Lista, Próximos Shows e Kanban Pipeline — alterne pelo grupo de ícones no topo.',
      },
      {
        heading: 'Criar evento',
        body: 'Toque + na agenda ou use o FAB. Preencha título, data, cliente, valor, local (GPS opcional), status e repita o evento (N vezes por semana/mês).',
      },
      {
        heading: 'Templates de evento',
        body: 'Salve configurações recorrentes (valor, horário, modelo de pagamento) e aplique com 1 toque. Gerencie em Perfil → Templates.',
      },
      {
        heading: 'Calculadora de Cachê',
        body: 'Ícone de calculadora no header: simule dias × cachê/dia + extras antes de fechar o contrato.',
      },
      {
        heading: 'Status',
        body: 'Confirmado, em negociação, concluído, arquivado ou cancelado — cada um afeta relatórios e alertas.',
      },
      {
        heading: 'Cronômetro ao vivo',
        body: 'Inicie o timer no detalhe do evento durante o show. Pill flutuante fica visível em todo o app. Ao parar, registra horas automaticamente.',
      },
      {
        heading: 'Checklist de equipamentos',
        body: 'Na aba Checklist do evento: templates por categoria (Áudio, Iluminação, DJ…), itens personalizados e barra de progresso.',
      },
      {
        heading: 'Documentos PDF',
        body: 'Contrato de serviços (pré-show), Recibo de pagamento (pós-pagamento) e Fechamento de evento — gerados direto do modal de detalhe.',
      },
      {
        heading: 'PIX e WhatsApp',
        body: 'Gere payload PIX Copia e Cola ou envie proposta/cobrança formatada via WhatsApp com um toque.',
      },
      {
        heading: 'Próximos Passos (CRM)',
        body: 'Em eventos concluídos: registrar horas, confirmar pagamento ou cobrar via WhatsApp. Badge verde quando tudo ok.',
      },
      {
        heading: 'NF (Nota Fiscal)',
        body: 'Registre o número da NF no campo Fiscal do evento. Acompanhe pendências na aba Fiscal dos Relatórios.',
      },
      {
        heading: 'Compartilhar disponibilidade',
        body: 'Botão Share na Agenda → lista dias livres vs agendados do mês para enviar via WhatsApp.',
      },
      {
        heading: 'Alertas',
        body: 'Horas pendentes, pagamentos vencidos e dias sem registro em multi-dia aparecem na aba Alertas.',
      },
      {
        heading: 'Swipe e navegação',
        body: 'Deslize horizontalmente na grade ou semana para navegar entre meses/semanas.',
      },
      {
        heading: 'Google Calendar',
        body: 'Conecte em Perfil → Google Calendar e use Sincronizar para importar eventos do Google.',
      },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    icon: Users,
    route: '/clients',
    items: [
      {
        heading: 'Tipos',
        body: 'Empresa (CNPJ) ou Pessoa (CPF). Busca por nome/CNPJ ou importe dados via XML de NF-e.',
      },
      {
        heading: 'Detalhe do cliente',
        body: 'Histórico completo de shows, receita paga e a receber, avaliação média e score de confiabilidade de pagamento.',
      },
      {
        heading: 'Interações (CRM)',
        body: 'Registre ligações, e-mails, reuniões e follow-ups. Alertas aparecem na Home quando o prazo vence.',
      },
      {
        heading: 'Clientes inativos',
        body: 'Painel "Inativos" no filtro Todos: detecta clientes sem show há 90+ dias e sugere reativação via WhatsApp.',
      },
      {
        heading: 'Insights do cliente',
        body: 'Gráfico de receita por mês, eventos por status e KPIs — toque no ícone ⚡ no card do cliente.',
      },
      {
        heading: 'Agendar pelo cliente',
        body: 'Botão "Agendar Show" no detalhe do cliente abre o formulário já com o cliente pré-selecionado.',
      },
    ],
  },
  {
    id: 'despesas',
    title: 'Despesas',
    icon: Receipt,
    route: '/expenses',
    items: [
      {
        heading: 'Registrar',
        body: 'Custos por evento: transporte, equipamento, alimentação, hospedagem, combustível e outros. Agrupadas por mês — atual expandido, passados colapsados.',
      },
      {
        heading: 'Recibo com IA',
        body: 'Ícone de câmera → fotografe o recibo → a IA preenche valor, data e categoria. Confirme antes de salvar.',
      },
      {
        heading: 'Reembolsável',
        body: 'Marque despesas reembolsáveis — badge âmbar no card. Marque como reembolsada pelo menu do item.',
      },
      {
        heading: 'Filtros',
        body: 'Filtre por evento ou categoria. Total por categoria aparece nos chips de filtro.',
      },
    ],
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    icon: BarChart2,
    route: '/reports',
    items: [
      {
        heading: 'Período e filtros',
        body: 'Esta semana, mês, trimestre, semestre, ano ou personalizado. Filtre por cliente com chips horizontais.',
      },
      {
        heading: 'Aba Visão Geral',
        body: 'KPIs do período, recebíveis vencidos (Aging), insights inteligentes automáticos, previsão de caixa (30/60/90 dias), tendência mensal (12 meses) e breakdown por categoria.',
      },
      {
        heading: 'Aba Clientes',
        body: 'Top 10 clientes por receita com ranking, ticket médio e score de pagamento. Tabela detalhada com taxa horária.',
      },
      {
        heading: 'Aba Despesas',
        body: 'Gráfico de pizza por categoria e lista detalhada das despesas do período.',
      },
      {
        heading: 'Aba Trabalho',
        body: 'Horas totais, taxa horária, top eventos por R$/hora e gráfico de horas por mês.',
      },
      {
        heading: 'Aba Atividade',
        body: 'Heatmap anual estilo GitHub, sazonalidade por mês (Jan-Dez), desempenho por dia da semana e evolução do cachê médio (12 meses).',
      },
      {
        heading: 'Aba Fiscal',
        body: 'Resumo para IR: receita bruta, despesas, lucro líquido e tabela mês a mês. Rastreamento de NF pendentes. Comparação Ano a Ano (YoY).',
      },
      {
        heading: 'Exportar',
        body: 'PDF ou CSV pelo botão de download. Exportar agenda em formato ICS (Google/Apple Calendar).',
      },
      {
        heading: 'Mapa do Brasil',
        body: 'Cidades visitadas marcadas no mapa interativo — toque para ver detalhes.',
      },
    ],
  },
  {
    id: 'metas',
    title: 'Metas',
    icon: Target,
    route: '/goals',
    items: [
      {
        heading: 'Três círculos',
        body: 'Diárias (dias únicos trabalhados), receita recebida e a receber (âmbar) — progresso do mês atual.',
      },
      {
        heading: 'Painel anual',
        body: '12 barras com receita por mês. Barra atual pulsa. Total do ano e projeção para dezembro.',
      },
      {
        heading: 'Streak e cadência',
        body: 'Meses seguidos batendo a meta (🔥) e quantos shows ainda faltam com o ticket médio necessário.',
      },
      {
        heading: 'Histórico recente',
        body: 'Cards dos últimos 4 meses com receita e barra de progresso vs meta — identifica tendências.',
      },
      {
        heading: 'Compartilhar',
        body: 'Botão "Compartilhar resultado" monta resumo formatado para WhatsApp com receita, diárias e streak.',
      },
      {
        heading: 'Nível',
        body: 'Pirâmide: Freelancer em Ascensão → Veterano → Pro → Astro → Lenda. Baseado em eventos concluídos.',
      },
      {
        heading: 'Conquistas (badges)',
        body: 'Mais de 20 badges desbloqueáveis. Ao conquistar, animação de partículas é exibida.',
      },
      {
        heading: 'Painel MEI',
        body: 'Faturamento anual vs limite MEI, DAS estimado, margem restante e projeção do ano.',
      },
    ],
  },
  {
    id: 'ia-mentor',
    title: 'IA Mentor',
    icon: Sparkles,
    route: '/ai-mentor',
    items: [
      {
        heading: 'Assistente financeiro',
        body: 'Usa seus dados reais (agenda, despesas, clientes, metas) para responder em linguagem natural.',
      },
      {
        heading: 'Exemplos',
        body: '"Qual meu ticket médio?", "Tenho pagamentos em atraso?", "Estou no caminho da meta?", "Quais clientes devo cobrar?"',
      },
      {
        heading: 'Recursos',
        body: 'Sugestões em chips, histórico de conversas, nova conversa (+) e dicas personalizadas por categoria no início.',
      },
    ],
  },
  {
    id: 'perfil',
    title: 'Perfil',
    icon: User,
    route: '/profile',
    items: [
      {
        heading: 'Dados e categoria',
        body: 'Nome, contato, cidade e área de atuação — muda cores, emoji e dicas de todo o app.',
      },
      {
        heading: 'Metas e precificação',
        body: 'Diária, meta de receita/mês e meta de diárias/mês.',
      },
      {
        heading: 'Widget Este Mês',
        body: 'Resumo de 4 cards: diárias, receita paga, horas e taxa horária do mês corrente.',
      },
      {
        heading: 'Templates de evento',
        body: 'Gerencie templates salvos: liste, visualize valor e modelo de pagamento, exclua com confirmação.',
      },
      {
        heading: 'PDF de fechamento',
        body: 'Configure nome da empresa, subtítulo e chave PIX para o template de fechamento de evento.',
      },
      {
        heading: 'Alertas e integrações',
        body: 'Push notifications (resumo 8h/18h), Google Calendar, instalar PWA e exportar backup JSON.',
      },
      {
        heading: 'Privacidade',
        body: 'Toggle de visibilidade financeira oculta todos os valores monetários em todo o app.',
      },
      {
        heading: 'Ajuda e feedback',
        body: 'Tour guiado, este manual e envio de mensagens à equipe com screenshot opcional.',
      },
    ],
  },
  {
    id: 'offline-push',
    title: 'Offline e notificações',
    icon: Wifi,
    items: [
      {
        heading: 'Modo offline',
        body: 'Visualização funciona sem internet. Banner no topo quando offline; ao reconectar, dados sincronizam automaticamente.',
      },
      {
        heading: 'Push',
        body: 'Ative em Perfil → Alertas no celular. Resumo matinal (8h) e noturno (18h) com eventos e alertas do dia.',
      },
      {
        heading: 'Instalar como app',
        body: 'Banner em Perfil → Instalar app (PWA). iOS: Safari → Compartilhar → Adicionar à Tela Inicial.',
      },
    ],
  },
  {
    id: 'gestos',
    title: 'Atalhos e gestos',
    icon: Hand,
    items: [
      {
        heading: 'Pull-to-refresh',
        body: 'Puxe para baixo em qualquer tela principal para sincronizar dados.',
      },
      {
        heading: 'Swipe na Agenda',
        body: 'Deslize horizontalmente na grade mensal ou vista semanal para navegar entre meses/semanas.',
      },
      {
        heading: 'Busca global',
        body: 'Ícone 🔍 na barra superior: busca eventos e clientes de qualquer tela instantaneamente.',
      },
      {
        heading: 'Action sheet mobile',
        body: 'Toque longo (ou atalho) em um evento/cliente abre menu rápido com ações mais comuns.',
      },
      {
        heading: 'Kanban Pipeline',
        body: 'Vista Kanban na Agenda: arraste eventos entre colunas (Negociando/Confirmado/A Receber/Pago).',
      },
    ],
  },
  {
    id: 'seguranca',
    title: 'Segurança',
    icon: Shield,
    items: [
      {
        heading: 'Seus dados',
        body: 'Armazenados no Supabase com RLS — cada usuário vê apenas os próprios registros.',
      },
      {
        heading: 'Backup',
        body: 'Exporte JSON a qualquer momento em Perfil → Exportar meus dados.',
      },
      {
        heading: 'Modo privado',
        body: 'Toggle em Perfil ou no ícone de olho na Home oculta todos os valores financeiros de qualquer tela compartilhada.',
      },
    ],
  },
];
