/**
 * Roadie fase 3 (08/11): "Escala do dia" — mesma regra para o cartão do Início
 * (o aviso das 8h tem a versão do servidor em supabase/functions/_shared/pushDigest.ts).
 */
import { buildRoadieCards } from './engine';
import { isCancelledEvent } from '../eventFinance';

const day = (v) => (typeof v === 'string' ? v.slice(0, 10) : null);
const addDays = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10);
const hora = (t) => (t ? String(t).slice(0, 5) : null);
/** Dicas que não repetem a faixa de pendências (saída, horas, cobrança, valor). */
const DICAS = ['cache', 'sumido', 'livre', 'mes'];

export function buildEscalaDoDia({ events = [], dailyWork = [], clients = [], today, now = new Date() }) {
  const nome = new Map((clients || []).map((c) => [c.id, c.name]));
  const ativos = (events || []).filter((e) => e && !isCancelledEvent(e));
  const noDia = (d) => ativos
    .filter((e) => { const ini = day(e.start_date); const fim = day(e.end_date) || ini; return ini && ini <= d && fim >= d; })
    .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
  const descreve = (e) => [e.title, nome.get(e.client_id) && `com ${nome.get(e.client_id)}`, hora(e.start_time) && `às ${hora(e.start_time)}`].filter(Boolean).join(' ');

  const hoje = noDia(today);
  const amanha = noDia(addDays(today, 1));
  const proximo = !hoje.length && !amanha.length
    ? ativos.filter((e) => day(e.start_date) > addDays(today, 1)).sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))[0]
    : null;

  const linhas = [
    { rotulo: 'Hoje', texto: hoje.length ? hoje.slice(0, 2).map(descreve).join(' · ') + (hoje.length > 2 ? ` +${hoje.length - 2}` : '') : 'Dia livre' },
  ];
  if (amanha.length) linhas.push({ rotulo: 'Amanhã', texto: amanha.slice(0, 2).map(descreve).join(' · ') });
  if (proximo) linhas.push({ rotulo: 'Próximo', texto: `${descreve(proximo)} · ${day(proximo.start_date).split('-').reverse().slice(0, 2).join('/')}` });

  const card = buildRoadieCards({ events, dailyWork, clients, today, now }).find((c) => DICAS.includes(c.kind) && c.action?.type === 'navigate');
  const dica = card ? { titulo: card.title, texto: card.body, to: card.action.to } : null;

  return { linhas, dica };
}
