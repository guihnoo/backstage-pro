/**
 * Roadie — o que ele traz sozinho, sem o usuário perguntar (08/11). Regra única, sem rede.
 * Cada cartão diz o que aconteceu e já oferece a ação pronta ("preparar e eu aprovo"):
 * nada é gravado aqui — a ação abre a tela certa ou monta a mensagem para o usuário confirmar.
 */
import { buildPendencias } from '../pendencias';
import { calculateEventReceivableAmount, isCancelledEvent, dailyBaseValueSafe } from './engineHelpers';

const day = (v) => (typeof v === 'string' ? v.slice(0, 10) : null);
const daysBetween = (a, b) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const brl = (v) => 'R$ ' + (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const ROADIE_SUMIDO_DIAS = 90;
export const ROADIE_COBRAR_DIAS = 10;

/**
 * @returns {Array<{id,kind,priority:1|2|3,tags:string[],title,body,action:{type,label,to?,eventId?,clientId?}}>}
 * priority 1 = agora, 2 = hoje, 3 = quando der.
 */
export function buildRoadieCards({ events = [], dailyWork = [], clients = [], today, now = new Date() }) {
  const cards = [];
  const clientById = new Map((clients || []).map((c) => [c.id, c]));
  const nome = (id) => clientById.get(id)?.name || 'o cliente';
  const workByEvent = {};
  for (const w of dailyWork || []) if (w?.event_id) (workByEvent[w.event_id] ||= []).push(w);
  const pend = buildPendencias({ events, dailyWork, clients, today, now });
  const ativos = (events || []).filter((e) => e && !isCancelledEvent(e));

  for (const it of pend.saidaAberta) {
    cards.push({
      id: `saida:${it.work.id}`, kind: 'saida', priority: 1, tags: ['home', 'agenda'],
      title: 'Registre sua saída',
      body: `Você entrou às ${String(it.work.entry_time).slice(0, 5)} em ${it.event.title} e já são ${it.horasDesdeEntrada} h.`,
      action: { type: 'navigate', label: 'Registrar saída', to: '/pendencias?grupo=saidaAberta' },
    });
  }

  // Show hoje sem entrada registrada.
  for (const ev of ativos) {
    const ini = day(ev.start_date);
    const fim = day(ev.end_date) || ini;
    if (!ini || ini > today || fim < today) continue;
    const temHoje = (workByEvent[ev.id] || []).some((w) => day(w.work_date || w.date) === today);
    if (temHoje) continue;
    cards.push({
      id: `hoje:${ev.id}:${today}`, kind: 'hoje', priority: 1, tags: ['home', 'agenda'],
      title: `Hoje: ${ev.title}`,
      body: `Com ${nome(ev.client_id)}${ev.start_time ? ` às ${String(ev.start_time).slice(0, 5)}` : ''}. Quando chegar, toque em CHEGUEI.`,
      action: { type: 'navigate', label: 'Ir para o CHEGUEI', to: '/' },
    });
  }

  for (const it of pend.semHoras) {
    cards.push({
      id: `horas:${it.event.id}`, kind: 'horas', priority: 2, tags: ['home', 'agenda'],
      title: `Faltam horas em ${it.event.title}`,
      body: `${it.dias.length} dia${it.dias.length > 1 ? 's' : ''} sem registro. Sem as horas, a hora extra não entra no valor.`,
      action: { type: 'navigate', label: 'Registrar horas', to: '/pendencias?grupo=semHoras' },
    });
  }

  for (const it of pend.receber.filter((r) => r.diasDesdeFim >= ROADIE_COBRAR_DIAS)) {
    cards.push({
      id: `cobrar:${it.event.id}`, kind: 'cobrar', priority: 2, tags: ['home', 'money'],
      title: `${nome(it.event.client_id)} ainda não pagou`,
      body: `${it.event.title} · ${brl(it.valorPrevisto)} · terminou há ${it.diasDesdeFim} dias. Já recebeu? Dê baixa. Se não, a cobrança está pronta.`,
      action: { type: 'cobrar', label: 'Cobrar no WhatsApp', eventId: it.event.id, clientId: it.event.client_id },
      secondary: { type: 'navigate', label: 'Já recebi', to: '/pendencias?grupo=receber' },
    });
  }

  if (pend.pagosSemValor.length) {
    const n = pend.pagosSemValor.length;
    cards.push({
      id: `valor:${today}`, kind: 'valor', priority: 3, tags: ['money'],
      title: `${n} trabalho${n > 1 ? 's' : ''} sem valor`,
      body: 'Sem o valor, o Dinheiro mostra menos do que você ganhou.',
      action: { type: 'navigate', label: 'Preencher valores', to: '/pendencias?grupo=pagosSemValor' },
    });
  }

  // Cachê abaixo da média com o mesmo cliente (próximos trabalhos).
  const mediaCliente = new Map();
  for (const ev of ativos) {
    const fim = day(ev.end_date) || day(ev.start_date);
    if (!fim || fim >= today || !ev.client_id) continue;
    const base = dailyBaseValueSafe(ev);
    if (!(base > 0)) continue;
    const m = mediaCliente.get(ev.client_id) || { soma: 0, n: 0 };
    m.soma += base; m.n += 1;
    mediaCliente.set(ev.client_id, m);
  }
  for (const ev of ativos) {
    const ini = day(ev.start_date);
    if (!ini || ini < today || !ev.client_id) continue;
    const m = mediaCliente.get(ev.client_id);
    const base = dailyBaseValueSafe(ev);
    if (!m || m.n < 2 || !(base > 0)) continue;
    const media = m.soma / m.n;
    if (base < media * 0.85) {
      cards.push({
        id: `cache:${ev.id}`, kind: 'cache', priority: 3, tags: ['agenda', 'money'],
        title: `Cachê abaixo da sua média`,
        body: `${ev.title}: ${brl(base)}/dia. Com ${nome(ev.client_id)} você costuma receber ${brl(media)}/dia.`,
        action: { type: 'navigate', label: 'Ver trabalho', to: `/calendar?event=${ev.id}` },
      });
    }
  }

  // Cliente sumido há 90+ dias (com pelo menos 2 trabalhos no histórico).
  const ultimo = new Map();
  for (const ev of ativos) {
    if (!ev.client_id) continue;
    const fim = day(ev.end_date) || day(ev.start_date);
    const u = ultimo.get(ev.client_id) || { fim: null, n: 0, futuro: false };
    u.n += 1;
    if (fim && fim >= today) u.futuro = true;
    if (fim && fim < today && (!u.fim || fim > u.fim)) u.fim = fim;
    ultimo.set(ev.client_id, u);
  }
  for (const [clientId, u] of ultimo) {
    if (u.futuro || !u.fim || u.n < 2) continue;
    const dias = daysBetween(today, u.fim);
    if (dias < ROADIE_SUMIDO_DIAS) continue;
    cards.push({
      id: `sumido:${clientId}`, kind: 'sumido', priority: 3, tags: ['home'],
      title: `${nome(clientId)} sumiu`,
      body: `Faz ${dias} dias desde o último trabalho. Um oi agora pode virar data na agenda.`,
      action: { type: 'navigate', label: 'Ver cliente', to: `/client-detail?id=${clientId}` },
    });
  }

  // Semana livre: nenhum trabalho nos próximos 7 dias.
  const fimSemana = addDays(today, 7);
  const temNaSemana = ativos.some((ev) => {
    const ini = day(ev.start_date); const fim = day(ev.end_date) || ini;
    return ini && fim && ini <= fimSemana && fim >= today;
  });
  if (!temNaSemana) {
    cards.push({
      id: `livre:${today}`, kind: 'livre', priority: 3, tags: ['agenda', 'home'],
      title: 'Próximos 7 dias livres',
      body: 'Mande sua disponibilidade para quem mais te chama.',
      action: { type: 'navigate', label: 'Abrir agenda', to: '/calendar' },
    });
  }

  // Começo do mês: resumo do mês que fechou.
  if (Number(today.slice(8, 10)) <= 3) {
    cards.push({
      id: `mes:${today.slice(0, 7)}`, kind: 'mes', priority: 3, tags: ['money', 'home'],
      title: 'O mês passado fechou',
      body: 'Veja quanto entrou, quanto falta receber e compare com o mês anterior.',
      action: { type: 'navigate', label: 'Ver resumo', to: '/reports' },
    });
  }

  return cards.sort((a, b) => a.priority - b.priority);
}

/** Cartões mais úteis para a tela atual primeiro. */
export function cardsForRoute(cards, pathname = '/') {
  const tag = pathname.startsWith('/reports') || pathname.startsWith('/pendencias') ? 'money'
    : pathname.startsWith('/calendar') ? 'agenda' : 'home';
  return [...cards].sort((a, b) => (a.priority - b.priority) || (Number(b.tags.includes(tag)) - Number(a.tags.includes(tag))));
}

export { calculateEventReceivableAmount };
