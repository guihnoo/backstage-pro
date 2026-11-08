/**
 * Roadie fase 2 (08/11): ações dentro da conversa, sempre com confirmação do usuário.
 * A IA responde com links "/acao/<tipo>?..." e o app mostra um cartão "Confirmar".
 * Aqui é tudo puro (sem rede): ler o link, conferir com os dados reais e montar a gravação.
 *
 * Tipos:
 *  - baixa?event=ID[&valor=][&data=]                       → dar baixa (pago)
 *  - horas?event=ID&dia=AAAA-MM-DD&entrada=HH:MM&saida=HH:MM → registrar as horas de um dia
 *  - saida?work=ID&saida=HH:MM                              → fechar uma entrada sem saída
 *  - cobrar?event=ID                                        → abrir a cobrança no WhatsApp
 *  - novo?titulo=&inicio=&fim=&cliente=ID&cache=            → abrir o formulário já preenchido
 */
import { buildBaixaUpdate, suggestedPaidDate } from '../pendencias';
import { calculateEventReceivableAmount, isCancelledEvent } from '../eventFinance';
import { computeWorkDay, defaultDayChoice, REGIME_POR_DIA_ATIVO, parseTimeToMinutes } from '../workDay';

export const ROADIE_ACOES = ['baixa', 'horas', 'saida', 'cobrar', 'novo'];

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^([01]?\d|2[0-3]):[0-5]\d$/;
const day = (v) => (typeof v === 'string' ? v.slice(0, 10) : null);
const br = (iso) => (iso ? iso.split('-').reverse().slice(0, 2).join('/') : '');
const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hhmm = (v) => {
  const s = String(v || '').trim();
  if (!HORA.test(s)) return null;
  const [h, m] = s.split(':');
  return `${h.padStart(2, '0')}:${m}`;
};

/** "/acao/baixa?event=1" → { tipo: 'baixa', params: { event: '1' } }; outro link → null. */
export function parseRoadieAction(href) {
  if (typeof href !== 'string' || !href.startsWith('/acao/')) return null;
  const [path, query = ''] = href.slice('/acao/'.length).split('?');
  const tipo = path.replace(/\/+$/, '');
  if (!ROADIE_ACOES.includes(tipo)) return null;
  return { tipo, params: Object.fromEntries(new URLSearchParams(query)) };
}

/**
 * Confere a ação com os dados reais e diz o que vai acontecer.
 * @returns {{ ok: boolean, erro?: string, titulo: string, linhas: string[], confirmar: string, gravacao?: object }}
 */
export function describeRoadieAction(acao, { events = [], clients = [], dailyWork = [], today } = {}) {
  const falha = (erro, titulo = 'Não deu para preparar') => ({ ok: false, erro, titulo, linhas: [], confirmar: '' });
  if (!acao) return falha('Ação desconhecida.');
  const { tipo, params } = acao;
  const evento = params.event ? (events || []).find((e) => e?.id === params.event) : null;
  const cliente = (id) => (clients || []).find((c) => c?.id === id) || null;
  const workDe = (id) => (dailyWork || []).filter((w) => w?.event_id === id);

  if (tipo === 'baixa') {
    if (!evento || isCancelledEvent(evento)) return falha('Não achei esse trabalho.');
    if (evento.payment_status === 'paid') return falha(`${evento.title} já está como pago.`);
    const fim = day(evento.end_date) || day(evento.start_date);
    const previsto = calculateEventReceivableAmount(evento, workDe(evento.id));
    const valor = params.valor != null && params.valor !== '' ? Number(String(params.valor).replace(',', '.')) : previsto;
    if (!(valor > 0)) return falha(`${evento.title} está sem valor. Preencha o cachê antes de dar baixa.`);
    const sug = fim ? suggestedPaidDate(fim, today) : { date: today, estimated: false };
    const data = ISO.test(params.data || '') && params.data <= today ? params.data : sug.date;
    const estimada = data === sug.date && sug.estimated;
    return {
      ok: true,
      titulo: `Dar baixa: ${evento.title}`,
      linhas: [
        `${cliente(evento.client_id)?.name || 'Sem cliente'} · ${brl(valor)}`,
        `Recebido em ${br(data)}${estimada ? ' (data estimada: fim + 10 dias)' : ''}`,
      ],
      confirmar: 'Confirmar recebimento',
      gravacao: { tabela: 'events', id: evento.id, dados: buildBaixaUpdate({ valor, data, estimada }) },
    };
  }

  if (tipo === 'horas') {
    if (!evento || isCancelledEvent(evento)) return falha('Não achei esse trabalho.');
    const dia = params.dia;
    const entrada = hhmm(params.entrada);
    const saida = hhmm(params.saida);
    const ini = day(evento.start_date);
    const fim = day(evento.end_date) || ini;
    if (!ISO.test(dia || '') || dia < ini || dia > fim) return falha(`Escolha um dia do trabalho: de ${br(ini)} a ${br(fim)}.`);
    if (dia > today) return falha('Esse dia ainda não chegou.');
    if (!entrada || !saida) return falha('Faltou o horário de entrada ou de saída.');
    if (workDe(evento.id).some((w) => (day(w.work_date) || day(w.date)) === dia)) {
      return falha(`O dia ${br(dia)} já tem horas registradas. Edite pela Agenda.`);
    }
    const nextDay = parseTimeToMinutes(saida) <= parseTimeToMinutes(entrada);
    const escolha = defaultDayChoice(evento);
    const calc = computeWorkDay({ event: evento, entry: entrada, exit: saida, nextDay, ...(REGIME_POR_DIA_ATIVO ? { regime: escolha.regime, horaExtra: escolha.horaExtra } : {}) });
    if (!(calc.minutes > 0)) return falha('Confira os horários de entrada e saída.');
    return {
      ok: true,
      titulo: `Registrar horas: ${evento.title}`,
      linhas: [
        `${br(dia)} · ${entrada} às ${saida}${nextDay ? ' (terminou no dia seguinte)' : ''}`,
        `${calc.totalHours} h${calc.overtimeHours > 0 ? ` (${calc.overtimeHours} h extra)` : ''} · cachê do dia ${brl(calc.cache)}`,
      ],
      confirmar: 'Registrar horas',
      gravacao: {
        tabela: 'daily_work',
        dados: {
          event_id: evento.id, date: dia, entry_time: entrada, exit_time: saida,
          total_hours: calc.totalHours, overtime_hours: calc.overtimeHours, daily_cache: calc.cache,
          notes: null, photo_url: null,
          ...(REGIME_POR_DIA_ATIVO ? { regime: calc.regime || 'cheia', hora_extra: Boolean(escolha.horaExtra), origem: 'lancada' } : {}),
        },
      },
    };
  }

  if (tipo === 'saida') {
    const w = (dailyWork || []).find((x) => x?.id === params.work);
    if (!w) return falha('Não achei essa entrada.');
    if (w.exit_time) return falha('Essa entrada já tem saída.');
    const ev = (events || []).find((e) => e?.id === w.event_id);
    const entrada = hhmm(String(w.entry_time || '').slice(0, 5));
    const saida = hhmm(params.saida);
    if (!ev || !entrada) return falha('Não achei o trabalho dessa entrada.');
    if (!saida) return falha('Diga o horário em que você saiu.');
    const nextDay = parseTimeToMinutes(saida) <= parseTimeToMinutes(entrada);
    const escolha = defaultDayChoice(ev, w);
    const calc = computeWorkDay({ event: ev, entry: entrada, exit: saida, nextDay, ...(REGIME_POR_DIA_ATIVO ? { regime: escolha.regime, horaExtra: escolha.horaExtra } : {}) });
    const dia = day(w.work_date) || day(w.date);
    return {
      ok: true,
      titulo: `Registrar saída: ${ev.title}`,
      linhas: [`${br(dia)} · entrou ${entrada}, saiu ${saida}${nextDay ? ' (dia seguinte)' : ''}`, `${calc.totalHours} h · cachê do dia ${brl(calc.cache)}`],
      confirmar: 'Registrar saída',
      gravacao: {
        tabela: 'daily_work', id: w.id,
        dados: { exit_time: saida, total_hours: calc.totalHours, overtime_hours: calc.overtimeHours, daily_cache: calc.cache, ...(REGIME_POR_DIA_ATIVO ? { regime: calc.regime || 'cheia' } : {}) },
      },
    };
  }

  if (tipo === 'cobrar') {
    if (!evento) return falha('Não achei esse trabalho.');
    if (evento.payment_status === 'paid') return falha(`${evento.title} já está pago.`);
    const c = cliente(evento.client_id);
    const valor = calculateEventReceivableAmount(evento, workDe(evento.id));
    return {
      ok: true,
      titulo: `Cobrar ${c?.name || 'o cliente'}`,
      linhas: [`${evento.title} · ${brl(valor)}`, c?.phone ? 'A mensagem abre no WhatsApp para você revisar e enviar.' : 'Esse cliente está sem WhatsApp cadastrado.'],
      confirmar: 'Abrir no WhatsApp',
      cobranca: { evento, cliente: c, valor },
    };
  }

  if (tipo === 'novo') {
    const inicio = ISO.test(params.inicio || '') ? params.inicio : null;
    const fim = ISO.test(params.fim || '') && inicio && params.fim >= inicio ? params.fim : inicio;
    const c = params.cliente ? cliente(params.cliente) : null;
    const cache = Number(String(params.cache || '').replace(',', '.'));
    const prefill = {
      title: (params.titulo || '').slice(0, 120),
      ...(inicio ? { start_date: inicio, end_date: fim } : {}),
      ...(c ? { client_id: c.id } : {}),
      ...(cache > 0 ? { daily_cache_value: String(cache) } : {}),
    };
    return {
      ok: true,
      titulo: `Novo trabalho${prefill.title ? `: ${prefill.title}` : ''}`,
      linhas: [
        [c?.name, inicio && (fim && fim !== inicio ? `${br(inicio)} a ${br(fim)}` : br(inicio)), cache > 0 && `${brl(cache)}/dia`].filter(Boolean).join(' · ') || 'Abro o formulário para você completar.',
        'Você revisa e salva no formulário.',
      ],
      confirmar: 'Abrir formulário',
      navegar: `/calendar?${new URLSearchParams({ action: 'new-event', ...(prefill.title ? { titulo: prefill.title } : {}), ...(inicio ? { inicio, fim } : {}), ...(c ? { client_id: c.id } : {}), ...(cache > 0 ? { cache: String(cache) } : {}) }).toString()}`,
    };
  }

  return falha('Ação desconhecida.');
}
