/**
 * Regra ÚNICA de horas e cachê por dia de trabalho.
 *
 * Regras de negócio (dono do produto, 13/10/2026):
 * - Jornada padrão: 12 h por dia.
 * - Cachê = valor que o usuário insere (daily_cache_value), contado por dia de evento.
 * - Horas extras (modelo HORAS_EXTRAS): contam a partir de 12 h trabalhadas no dia;
 *   valor da hora = cachê / 12.
 * - Meia dobra = metade do cachê; dobra = 2x o cachê (modelo MEIO_CACHE_E_DOBRA).
 *
 * Tudo é calculado em MINUTOS inteiros; arredondamento só na exibição (horas com
 * 1 casa) e no dinheiro (centavos). Assim 12:01–12:02 não "vira" 12,1 h por arredondamento.
 */

export const JORNADA_PADRAO_MIN = 12 * 60;
export const MEIA_JORNADA_MIN = 6 * 60;
export const DIA_MIN = 24 * 60;

export const MODELO_HORAS_EXTRAS = 'HORAS_EXTRAS';
export const MODELO_MEIO_E_DOBRA = 'MEIO_CACHE_E_DOBRA';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;

/** "HH:MM" -> minutos desde 00:00, ou null se inválido. */
export function parseTimeToMinutes(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** minutos -> "HH:MM" no relógio (volta a 00:00 após 24 h). */
export function minutesToClock(totalMinutes) {
  const m = ((Math.round(Number(totalMinutes) || 0) % DIA_MIN) + DIA_MIN) % DIA_MIN;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** Soma uma duração (minutos) a um horário "HH:MM" e devolve o horário de saída no relógio. */
export function addMinutesToClock(entry, minutes) {
  const start = parseTimeToMinutes(entry);
  if (start == null) return '';
  return minutesToClock(start + (Number(minutes) || 0));
}

/**
 * Minutos trabalhados entre entrada e saída.
 * - saída depois da entrada: diferença simples;
 * - saída antes da entrada: virou a noite (+24 h);
 * - entrada igual à saída: 0, a menos que `nextDay` diga que foram 24 h.
 */
export function workedMinutes(entry, exit, { nextDay = false } = {}) {
  const a = parseTimeToMinutes(entry);
  const b = parseTimeToMinutes(exit);
  if (a == null || b == null) return 0;
  if (b > a) return b - a;
  if (b < a) return b + DIA_MIN - a;
  return nextDay ? DIA_MIN : 0;
}

/** Entrada e saída preenchidas e iguais (caso ambíguo: 0 h ou 24 h?). */
export function isSameEntryExit(entry, exit) {
  const a = parseTimeToMinutes(entry);
  const b = parseTimeToMinutes(exit);
  return a != null && b != null && a === b;
}

/** Número de dias do evento a partir de start_date/end_date (YYYY-MM-DD), mínimo 1. */
function eventDayCount(event) {
  const start = typeof event?.start_date === 'string' ? event.start_date.slice(0, 10) : '';
  const end = typeof event?.end_date === 'string' ? event.end_date.slice(0, 10) : start;
  const s = Date.parse(start + 'T00:00:00Z');
  const e = Date.parse((end || start) + 'T00:00:00Z');
  if (Number.isNaN(s) || Number.isNaN(e)) return 1;
  return Math.max(1, Math.round((e - s) / 86400000) + 1);
}

/**
 * Cachê de UM dia (o valor que o usuário inseriu).
 * Ordem: daily_cache_value -> cache_valor_base (legado) -> estimated_revenue dividido pelos dias.
 */
export function dailyBaseValue(event) {
  const daily = Number(event?.daily_cache_value) || 0;
  if (daily > 0) return daily;
  const legacy = Number(event?.cache_valor_base) || 0;
  if (legacy > 0) return legacy;
  const estimated = Number(event?.estimated_revenue) || 0;
  if (estimated > 0) return round2(estimated / eventDayCount(event));
  return 0;
}

export function paymentModelOf(event) {
  return event?.payment_model === MODELO_MEIO_E_DOBRA ? MODELO_MEIO_E_DOBRA : MODELO_HORAS_EXTRAS;
}

/** Cachê do dia para uma quantidade de minutos trabalhados. 0 minuto = 0 (nada é cobrado sozinho). */
export function dayCacheForMinutes(event, minutes) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  if (!event || mins <= 0) return 0;
  const base = dailyBaseValue(event);
  if (paymentModelOf(event) === MODELO_MEIO_E_DOBRA) {
    if (mins <= MEIA_JORNADA_MIN) return round2(base / 2);
    if (mins <= JORNADA_PADRAO_MIN) return round2(base);
    return round2(base * 2);
  }
  const overtimeMin = Math.max(0, mins - JORNADA_PADRAO_MIN);
  return round2(base + (overtimeMin / 60) * (base / 12));
}

/**
 * Lote 2: escolha por dia. Liga só depois que a migration 035 estiver aplicada no banco
 * (senão o Supabase recusa as colunas novas). Variável de ambiente: VITE_REGIME_POR_DIA=true.
 */
export const REGIME_POR_DIA_ATIVO = (() => {
  try {
    return import.meta.env?.VITE_REGIME_POR_DIA === 'true';
  } catch {
    return false;
  }
})();

export const REGIMES = [
  { value: 'meia', label: '½', descricao: 'Meia (metade do cachê)', fator: 0.5 },
  { value: 'cheia', label: '1', descricao: 'Cachê cheio', fator: 1 },
  { value: 'dobra', label: '2', descricao: 'Dobra (2x o cachê)', fator: 2 },
];

const FATOR_REGIME = Object.fromEntries(REGIMES.map((r) => [r.value, r.fator]));

export function isValidRegime(regime) {
  return Object.prototype.hasOwnProperty.call(FATOR_REGIME, regime);
}

/** Sugestão inicial para um dia novo: cachê cheio; hora extra ligada se o evento é "Horas Extras". */
export function defaultDayChoice(event, existing = null) {
  return {
    regime: isValidRegime(existing?.regime) ? existing.regime : 'cheia',
    horaExtra: typeof existing?.hora_extra === 'boolean'
      ? existing.hora_extra
      : paymentModelOf(event) === MODELO_HORAS_EXTRAS,
  };
}

/**
 * Cachê do dia com a escolha do usuário: base x (½, 1 ou 2) + hora extra (cachê/12 por hora
 * acima de 12 h) se ligada. A quantidade de horas NÃO muda o regime.
 */
export function dayCacheForChoice(event, minutes, { regime, horaExtra }) {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  if (!event || mins <= 0) return 0;
  const base = dailyBaseValue(event);
  const fator = FATOR_REGIME[regime] ?? 1;
  const overtimeMin = horaExtra ? Math.max(0, mins - JORNADA_PADRAO_MIN) : 0;
  return round2(base * fator + (overtimeMin / 60) * (base / 12));
}

/**
 * Cálculo completo de um dia de trabalho.
 * Use `durationMinutes` quando a duração real é conhecida (ex.: cronômetro), o que
 * permite jornadas de 24 h ou mais, que o relógio HH:MM sozinho não representa.
 * Com `regime` válido usa a escolha do usuário (Lote 2); sem ele, a regra antiga por modelo.
 */
export function computeWorkDay({
  event, entry, exit, nextDay = false, durationMinutes = null, regime = null, horaExtra = null,
} = {}) {
  const minutes = durationMinutes != null && Number.isFinite(Number(durationMinutes))
    ? Math.max(0, Math.round(Number(durationMinutes)))
    : workedMinutes(entry, exit, { nextDay });
  const overtimeMinutes = Math.max(0, minutes - JORNADA_PADRAO_MIN);
  const useChoice = isValidRegime(regime);
  return {
    minutes,
    overtimeMinutes,
    totalHours: round1(minutes / 60),
    overtimeHours: round1(overtimeMinutes / 60),
    cache: useChoice
      ? dayCacheForChoice(event, minutes, { regime, horaExtra: Boolean(horaExtra) })
      : dayCacheForMinutes(event, minutes),
    needsNextDayAnswer: durationMinutes == null && !nextDay && isSameEntryExit(entry, exit),
  };
}

/** Duração de um cronômetro em minutos inteiros (sem arredondar para 15 min). */
export function elapsedMsToMinutes(ms) {
  return Math.max(0, Math.round((Number(ms) || 0) / 60000));
}
