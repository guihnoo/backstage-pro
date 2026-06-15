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
        body: 'Após o primeiro login: boas-vindas, área de atuação (categoria), experiência, precificação e meta de diárias. Tudo editável depois em Perfil → Metas & Precificação.',
      },
      {
        heading: 'Tour guiado',
        body: 'Na primeira visita à Home, um tour mostra cockpit, menu e atalhos. Rever em Perfil → Ajuda do app → Rever tour.',
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
        body: 'Próximo show, barra de meta (diárias únicas), quick stats, alertas, próximos eventos e forecast de receita.',
      },
      {
        heading: 'Modo Palco',
        body: 'Quando há show hoje ou turno ao vivo, o header entra em destaque com check-in e cronômetro de horas.',
      },
      {
        heading: 'Atualizar',
        body: 'Puxe a tela para baixo (pull-to-refresh) para sincronizar dados.',
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
        heading: 'Criar evento',
        body: 'Toque + na agenda ou use o FAB. Preencha título, data, cliente, valor, local (GPS opcional) e status.',
      },
      {
        heading: 'Status',
        body: 'Confirmado, em negociação, concluído, arquivado ou cancelado — cada um afeta relatórios e alertas.',
      },
      {
        heading: 'Próximos Passos (CRM)',
        body: 'Em eventos concluídos: registrar horas (12h auto ou manual), confirmar pagamento ou cobrar via WhatsApp. Badge verde quando tudo ok.',
      },
      {
        heading: 'Alertas',
        body: 'Horas pendentes (14 dias) e pagamentos vencidos aparecem na aba Alertas com atalho para o evento.',
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
        heading: 'Detalhe',
        body: 'Histórico de eventos, receita total e contatos. Clientes com rascunhos exibem badge.',
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
        body: 'Custos por evento: transporte, equipamento, alimentação etc. Agrupadas por mês.',
      },
      {
        heading: 'Recibo com IA',
        body: 'Ícone de câmera → fotografe o recibo → a IA tenta preencher valor, data e categoria. Confirme antes de salvar.',
      },
      {
        heading: 'Filtros',
        body: 'Filtre por evento ou categoria para fechar o mês.',
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
        heading: 'Período',
        body: 'Mês, trimestre, semestre ou ano.',
      },
      {
        heading: 'KPIs e gráficos',
        body: 'Receita, ticket médio, top clientes/eventos, gráfico de área e mapa do Brasil com cidades visitadas.',
      },
      {
        heading: 'Exportar',
        body: 'PDF ou CSV pelo botão de download.',
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
        body: 'Diárias (dias únicos), receita confirmada e valor a receber (âmbar).',
      },
      {
        heading: 'Celebração',
        body: 'Ao atingir 100% em uma meta, animação de partículas é exibida.',
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
        body: '"Qual meu ticket médio?", "Tenho pagamentos em atraso?", "Estou no caminho da meta?"',
      },
      {
        heading: 'Recursos',
        body: 'Sugestões em chips, histórico de conversas, nova conversa (+) e dicas por categoria no início.',
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
        body: 'Nome, contato, cidade e área de atuação — muda cores e emoji de todo o app.',
      },
      {
        heading: 'Metas e precificação',
        body: 'Diária, meta de receita e meta de diárias do mês.',
      },
      {
        heading: 'Alertas e integrações',
        body: 'Push notifications, Google Calendar, instalar PWA e exportar backup JSON.',
      },
      {
        heading: 'Ajuda e feedback',
        body: 'Tour guiado, este manual e envio de mensagens à equipe (inbox para administradores).',
      },
      {
        heading: 'Privacidade',
        body: 'Toggle de visibilidade financeira oculta valores em todo o app.',
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
        body: 'Visualização funciona sem internet. Banner no topo quando offline; ao reconectar, dados sincronizam.',
      },
      {
        heading: 'Push',
        body: 'Ative em Perfil → Alertas no celular. Resumo matinal (8h) e noturno (18h) com eventos e alertas.',
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
        body: 'Puxe para baixo na Home, Perfil e outras telas lapidadas.',
      },
      {
        heading: 'Calendário',
        body: 'Toque no dia para abrir o painel; + para novo evento rápido.',
      },
      {
        heading: 'Modo Palco',
        body: 'Card Próximo Show na Home quando há evento hoje.',
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
    ],
  },
];
