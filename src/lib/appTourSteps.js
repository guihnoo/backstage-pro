/** Seletores estáveis para o tour — mantidos em sync com data-tour no layout. */
export const TOUR_SELECTORS = {
  homeHeader: '[data-tour="home-header"]',
  homeMeta: '[data-tour="home-meta"]',
  fab: '[data-tour="fab-actions"]',
  bottomNav: '[data-tour="bottom-nav"]',
  navCalendar: '[data-tour="nav-calendar"]',
  navReports: '[data-tour="nav-reports"]',
  reportsMap: '[data-tour="reports-map"]',
  topBar: '[data-tour="top-bar"]',
};

export function buildAppTourSteps({ pathname = '/' } = {}) {
  const onReportsPage = pathname === '/reports' || pathname.startsWith('/reports/');

  const steps = [
    {
      popover: {
        title: 'Bem-vindo ao Backstage Pro',
        description:
          'Em poucos passos você vai conhecer o cockpit, a navegação e os atalhos para operar shows, clientes e finanças no dia a dia.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: TOUR_SELECTORS.homeHeader,
      popover: {
        title: 'Seu cockpit',
        description:
          'A Home reúne o próximo show, alertas, recebíveis e metas. Puxe para baixo para atualizar os dados em tempo real.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: TOUR_SELECTORS.homeMeta,
      popover: {
        title: 'Meta mensal',
        description:
          'Acompanhe diárias únicas trabalhadas e faturamento do mês. Ajuste metas no Perfil quando quiser recalibrar.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: TOUR_SELECTORS.fab,
      popover: {
        title: 'Ações rápidas',
        description:
          'Toque no + para criar evento, cliente ou despesa sem sair da tela atual — ideal entre um show e outro.',
        side: 'left',
        align: 'end',
      },
    },
    {
      element: TOUR_SELECTORS.bottomNav,
      popover: {
        title: 'Menu inferior',
        description:
          'Home, Agenda, Clientes, Metas, Despesas, Relatório e IA Mentor. Tudo a um toque, estilo app nativo.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: TOUR_SELECTORS.navCalendar,
      popover: {
        title: 'Agenda',
        description:
          'Planeje turnos, marque pagamentos, registre horas e abra o detalhe de cada evento. É o coração operacional.',
        side: 'top',
        align: 'center',
      },
    },
  ];

  if (onReportsPage) {
    steps.push({
      element: TOUR_SELECTORS.reportsMap,
      popover: {
        title: 'Mapa interativo',
        description:
          'Veja em quais estados e cidades você já trabalhou. Toque nos estados ou na lista de cidades para abrir os eventos de cada local.',
        side: 'top',
        align: 'center',
      },
    });
  } else {
    steps.push({
      element: TOUR_SELECTORS.navReports,
      popover: {
        title: 'Relatórios',
        description:
          'KPIs financeiros, gráficos e o mapa do Brasil com os locais dos seus shows. Preencha cidade/estado no evento para marcar o mapa.',
        side: 'top',
        align: 'center',
      },
    });
  }

  steps.push(
    {
      element: TOUR_SELECTORS.topBar,
      popover: {
        title: 'Notificações e perfil',
        description:
          'Alertas importantes ficam no sino. Configurações, metas, backup e feedback estão no ícone de engrenagem.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      popover: {
        title: 'Pronto para o palco',
        description:
          'Explore no seu ritmo. Você pode rever este tour a qualquer momento em Perfil → Ajuda do app.',
        side: 'over',
        align: 'center',
      },
    }
  );

  return steps;
}

/** Tour curto só do mapa — iniciado em Relatórios. */
export function buildMapTourSteps() {
  return [
    {
      popover: {
        title: 'Seu histórico geográfico',
        description:
          'Cada evento com cidade, estado ou GPS ilumina o mapa. Quanto mais completo o local no cadastro, mais preciso fica o pin.',
        side: 'over',
        align: 'center',
      },
    },
    {
      element: TOUR_SELECTORS.reportsMap,
      popover: {
        title: 'Mapa interativo',
        description:
          'Estados visitados usam a cor da sua categoria. Toque nos pins ou na lista "Suas cidades" para ver os shows de cada lugar.',
        side: 'top',
        align: 'center',
      },
    },
    {
      popover: {
        title: 'Dica rápida',
        description:
          'Na Agenda, use check-in por GPS ou preencha "Local" como "Cidade, UF" ao criar ou duplicar eventos.',
        side: 'over',
        align: 'center',
      },
    },
  ];
}
