// Colar mensagem do WhatsApp e o app preencher o trabalho (ideia #106).
// Leitor local (sem internet, instantâneo): datas, horários, cachê, local, nome, cliente e função.
// O que não for encontrado fica como está no formulário; a mensagem inteira vai para as observações.

const MONTHS = {
  janeiro: 1, jan: 1, fevereiro: 2, fev: 2, marco: 3, mar: 3, abril: 4, abr: 4, maio: 5, mai: 5,
  junho: 6, jun: 6, julho: 7, jul: 7, agosto: 8, ago: 8, setembro: 9, set: 9, outubro: 10, out: 10,
  novembro: 11, nov: 11, dezembro: 12, dez: 12,
};
const MONTH_RE = 'janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez';
const WEEKDAYS = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
const UF = 'AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO';

const FUNCTION_KEYWORDS = [
  ['lighting', /\b(luz|iluminacao|iluminador|lighting|grandma|ma2|ma3|moving)\b/],
  ['audio', /\b(som|audio|foh|monitor|mixagem|sonorizacao|pa e monitor)\b/],
  ['video', /\b(video|led|painel|projecao|vj|telao|streaming|transmissao)\b/],
  ['photo', /\b(foto|fotos|fotografo|fotografia)\b/],
  ['dj', /\b(dj|discotecagem)\b/],
  ['production', /\b(producao|produtor|roadie|stage manager|coordenacao)\b/],
];

/** minúsculas e sem acento (mesmo comprimento do texto original, para recortar o original). */
export function normalizeText(s) {
  return String(s || '')
    .split('')
    .map((ch) => ch.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().charAt(0) || ch)
    .join('');
}

const pad = (n) => String(n).padStart(2, '0');
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function validDate(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** Sem ano na mensagem: este ano, ou o próximo se a data ficou mais de 30 dias para trás. */
function withYear(m, d, today, yearText) {
  if (yearText) {
    let y = Number(yearText);
    if (y < 100) y += 2000;
    return validDate(y, m, d) ? iso(y, m, d) : null;
  }
  let y = today.getFullYear();
  if (!validDate(y, m, d)) return null;
  const diffDays = (new Date(y, m - 1, d) - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000;
  if (diffDays < -30) y += 1;
  return validDate(y, m, d) ? iso(y, m, d) : null;
}

function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
  return iso(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function expandRange(startIso, endIso) {
  const out = [];
  const [y1, m1, d1] = startIso.split('-').map(Number);
  const end = new Date(endIso + 'T12:00:00');
  for (let d = new Date(y1, m1 - 1, d1, 12); d <= end && out.length < 31; d.setDate(d.getDate() + 1)) {
    out.push(iso(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  }
  return out;
}

function parseMoney(raw) {
  const s = String(raw).trim();
  let n;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) n = Number(s.replace(/\./g, '').replace(',', '.'));
  else if (s.includes(',')) n = Number(s.replace(/\./g, '').replace(',', '.'));
  else n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function toClock(h, m) {
  const hh = Number(h);
  const mm = Number(m || 0);
  if (!(hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59)) return null;
  return `${pad(hh)}:${pad(mm)}`;
}

// Apaga do texto de trabalho o trecho já usado (mesmo comprimento: índices continuam valendo).
function blank(str, start, len) {
  return str.slice(0, start) + ' '.repeat(len) + str.slice(start + len);
}

function cleanLine(line) {
  return line
    .replace(/[*_~`]/g, '')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const GREETING = /^(oi+|ola|opa|eai|e ai|fala|bom dia|boa tarde|boa noite|tudo bem|blz|beleza|salve|hey)\b/;

/**
 * @param {string} text mensagem colada
 * @param {{ today?: Date, clients?: Array<{id,name,company?}>, functions?: string[] }} options
 * @returns {{ fields: object, found: string[], clientName: string|null }}
 */
export function parseJobMessage(text, { today = new Date(), clients = [], functions = [] } = {}) {
  const original = String(text || '').replace(/\r/g, '');
  const fields = {};
  const found = [];
  if (!original.trim()) return { fields, found, clientName: null };

  const norm = normalizeText(original);
  let work = norm;

  // ---- dinheiro (primeiro, para não virar data/horário) ----
  const moneyHits = [];
  const moneyPatterns = [
    { re: /r\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g, labeled: false },
    { re: /(\d{2,6}(?:,\d{2})?)\s*(?:reais|conto|pila)\b/g, labeled: false },
    { re: /\b(?:cache|diaria|valor|pagamento|paga|pago|fee)\b[^\d\n]{0,18}?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{2,6}(?:[.,]\d{1,2})?)/g, labeled: true },
  ];
  for (const { re, labeled } of moneyPatterns) {
    for (const m of norm.matchAll(re)) {
      const value = parseMoney(m[1]);
      if (!(value >= 50 && value <= 100000)) continue;
      const before = norm.slice(Math.max(0, m.index - 25), m.index);
      moneyHits.push({ value, labeled: labeled || /\b(cache|diaria|valor|pagamento)\b/.test(before), index: m.index, len: m[0].length });
    }
  }
  for (const h of moneyHits) work = blank(work, h.index, h.len);
  if (moneyHits.length) {
    const best = moneyHits.find((h) => h.labeled) || moneyHits[0];
    fields.daily_cache_value = best.value;
    found.push('cachê');
  }

  // ---- datas ----
  const dates = new Set();
  const take = (re, handler) => {
    for (const m of [...work.matchAll(re)]) {
      const got = handler(m);
      if (got && got.length) {
        got.forEach((d) => d && dates.add(d));
        work = blank(work, m.index, m[0].length);
      }
    }
  };

  // 25/10 a 27/10 · 25 a 27/10 · de 25 até 27/10/2026
  take(/\b(\d{1,2})(?:\/(\d{1,2}))?(?:\/(\d{2,4}))?\s*(?:a|ate|ao|-|–)\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, (m) => {
    const m2 = Number(m[5]);
    const m1 = m[2] ? Number(m[2]) : m2;
    const s = withYear(m1, Number(m[1]), today, m[3] || m[6]);
    const e = withYear(m2, Number(m[4]), today, m[6]);
    return s && e && s <= e ? expandRange(s, e) : null;
  });
  // 25, 26 e 27/10
  take(/\b((?:\d{1,2}\s*(?:,|e)\s*)+)(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g, (m) => {
    const month = Number(m[3]);
    const days = [...m[1].matchAll(/\d{1,2}/g)].map((x) => Number(x[0])).concat(Number(m[2]));
    return days.map((d) => withYear(month, d, today, m[4]));
  });
  // 25/10 · 25/10/2026 · 25.10
  take(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2,4}))?\b/g, (m) => [withYear(Number(m[2]), Number(m[1]), today, m[3])]);
  // 25 a 27 de outubro · 25 e 26 de outubro de 2026 · 25 de outubro
  take(new RegExp(`\\b(\\d{1,2})((?:\\s*(?:,|e|a|ate|-)\\s*\\d{1,2})*)\\s*de\\s+(${MONTH_RE})\\b(?:\\s+de\\s+(\\d{4}))?`, 'g'), (m) => {
    const month = MONTHS[m[3]];
    const first = Number(m[1]);
    const rest = [...m[2].matchAll(/\d{1,2}/g)].map((x) => Number(x[0]));
    const isRange = /\b(a|ate)\b|-/.test(m[2]);
    if (isRange && rest.length) {
      const s = withYear(month, first, today, m[4]);
      const e = withYear(month, rest[rest.length - 1], today, m[4]);
      return s && e && s <= e ? expandRange(s, e) : [s];
    }
    return [first, ...rest].map((d) => withYear(month, d, today, m[4]));
  });
  // dia 25 · dias 25 e 26 (mês: este, ou o próximo se o dia já passou)
  take(/\bdias?\s+(\d{1,2})((?:\s*(?:,|e|a|ate)\s*\d{1,2})*)\b/g, (m) => {
    const days = [Number(m[1]), ...[...m[2].matchAll(/\d{1,2}/g)].map((x) => Number(x[0]))];
    const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const pick = (d) => {
      let y = base.getFullYear();
      let mo = base.getMonth() + 1;
      if (d < base.getDate()) { mo += 1; if (mo > 12) { mo = 1; y += 1; } }
      return validDate(y, mo, d) ? iso(y, mo, d) : null;
    };
    if (/\b(a|ate)\b/.test(m[2]) && days.length > 1) {
      const s = pick(days[0]);
      const e = pick(days[days.length - 1]);
      return s && e && s <= e ? expandRange(s, e) : [s];
    }
    return days.map(pick);
  });
  // hoje · amanhã · depois de amanhã
  take(/\bdepois de amanha\b/g, () => [addDays(today, 2)]);
  take(/\bamanha\b/g, () => [addDays(today, 1)]);
  take(/\bhoje\b/g, () => [addDays(today, 0)]);
  // sábado · sexta-feira (próximo, contando hoje)
  if (!dates.size) {
    take(/\b(domingo|segunda|terca|quarta|quinta|sexta|sabado)(?:-feira| feira)?\b/g, (m) => {
      const target = WEEKDAYS[m[1]];
      const diff = (target - today.getDay() + 7) % 7;
      return [addDays(today, diff)];
    });
  }

  if (dates.size) {
    const sorted = [...dates].sort();
    fields.start_date = sorted[0];
    fields.end_date = sorted[sorted.length - 1];
    found.push('data');
  }

  // ---- horários (precisam de "h" ou ":") ----
  const T = '([01]?\\d|2[0-3])(?::([0-5]\\d)|h([0-5]\\d)?)';
  const clock = (m, i) => toClock(m[i], m[i + 1] || m[i + 2]);
  let start = null;
  let end = null;
  const arrival = work.match(new RegExp(`\\b(?:chegada|chegar|call|montagem|concentracao|apresentacao|estar la|estar no local)\\b[^\\d\\n]{0,14}${T}`));
  if (arrival) start = clock(arrival, 1);
  const range = work.match(new RegExp(`(?:\\b(?:das?|de)\\s+([01]?\\d|2[0-3])(?::([0-5]\\d)|h([0-5]\\d)?)?|${T})\\s*(?:as|a|ate|ao|-|–)\\s*${T}`));
  if (range) {
    const rs = range[1] !== undefined ? toClock(range[1], range[2] || range[3]) : clock(range, 4);
    const re = clock(range, 7);
    if (rs && re) {
      start = start || rs;
      end = re;
    }
  }
  if (!start || !end) {
    const all = [...work.matchAll(new RegExp(`\\b${T}`, 'g'))].map((m) => clock(m, 1)).filter(Boolean);
    if (!start && all.length) start = all[0];
    if (!end && all.length > 1 && all[all.length - 1] !== start) end = all[all.length - 1];
  }
  if (start) {
    fields.start_time = start;
    if (end) fields.end_time = end;
    found.push('horário');
  }

  // ---- linhas com rótulo (local, nome, cliente) ----
  const lines = original.split('\n');
  const label = (re) => {
    for (const line of lines) {
      const n = normalizeText(line);
      const m = n.match(re);
      if (m) return cleanLine(line.slice(m.index + m[0].length));
    }
    return null;
  };

  let location = label(/^\W*(?:local|endereco|onde|lugar|venue|📍)\s*[:\-–]?\s*/u);
  if (!location) {
    const pin = lines.find((l) => l.includes('📍'));
    if (pin) location = cleanLine(pin.split('📍')[1] || '');
  }
  const cityRe = new RegExp(`([A-ZÀ-Ú][A-Za-zÀ-ú.' ]{1,40}?)\\s*[/\\-–,]\\s*(${UF})\\b`);
  const cityMatch = (location && location.match(cityRe)) || original.match(cityRe);
  if (cityMatch) {
    fields.location_city = cityMatch[1].trim();
    fields.location_state = cityMatch[2];
  }
  if (location && location.length >= 3) {
    fields.location = location.slice(0, 200);
    found.push('local');
  } else if (cityMatch) {
    found.push('local');
  }

  let title = label(/^\W*(?:evento|show|job|trabalho|projeto|nome do evento)\s*[:\-–]\s*/);
  if (!title) {
    const phrase = original.match(/\b((?:show|festa|casamento|formatura|feira|congresso|festival|turn[eê])\s+(?:d[aoe]s?\s+)?[^\n,.;!?()]{2,40})/i);
    if (phrase) title = cleanLine(phrase[1]).replace(/\s+(dia|no|na|em|as|às|de)\s*$/i, '');
  }
  if (!title) {
    for (const line of lines) {
      const c = cleanLine(line);
      const n = normalizeText(c);
      if (c.length < 3 || c.length > 60 || GREETING.test(n)) continue;
      if (/\d{1,2}[/:h]\d{0,2}|r\$|\b(local|endereco|cache|valor|cliente|produtora)\b/.test(n)) continue;
      title = c;
      break;
    }
  }
  if (title) {
    fields.title = title.slice(0, 80);
    found.push('nome');
  }

  // ---- cliente ----
  let clientName = label(/^\W*(?:produtora|cliente|contratante|empresa|agencia|produtor)\s*[:\-–]\s*/);
  const hit = findClient({ name: clientName, text: norm }, clients);
  if (hit) {
    fields.client_id = hit.id;
    clientName = hit.name;
    found.push('cliente');
  } else if (clientName) {
    found.push('cliente (novo)');
  }

  // ---- função (só entre as que o técnico tem no Perfil) ----
  if (functions.length > 1) {
    const fn = FUNCTION_KEYWORDS.find(([id, re]) => functions.includes(id) && re.test(norm));
    if (fn) {
      fields.category = fn[0];
      found.push('função');
    }
  }

  fields.observacoes_md = original.trim().slice(0, 2000);
  return { fields, found, clientName: clientName || null };
}

const escapeRe = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Cliente da lista citado na mensagem: pelo nome do rótulo ("Produtora: Palco Norte") nos dois
 * sentidos (o salvo pode ser "Palco Norte Produções"), ou pelo nome aparecendo no texto.
 */
export function findClient({ name = null, text = '' } = {}, clients = []) {
  const candidates = (clients || [])
    .flatMap((c) => [c.name, c.company].filter(Boolean).map((n) => ({ c, n: normalizeText(n).trim() })))
    .filter(({ n }) => n.length >= 3)
    .sort((a, b) => b.n.length - a.n.length);
  const lookIn = name ? normalizeText(name).trim() : normalizeText(text);
  const word = (needle, hay) => new RegExp(`(^|[^a-z0-9])${escapeRe(needle)}([^a-z0-9]|$)`).test(hay);
  const hit = candidates.find(({ n }) => word(n, lookIn))
    || (name && lookIn.length >= 4 ? candidates.find(({ n }) => word(lookIn, n)) : null);
  return hit ? hit.c : null;
}

const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isClock = (v) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/**
 * Resposta da IA (Edge Function analyze-job) no mesmo formato do leitor local,
 * conferindo de novo cada campo (a IA pode errar o formato).
 */
export function aiResultToParsed(data, { clients = [], functions = [], source = 'mensagem', originalText = '' } = {}) {
  const fields = {};
  const found = [];
  if (!data || typeof data !== 'object') return { fields, found, clientName: null };

  if (isIsoDate(data.start_date)) {
    fields.start_date = data.start_date;
    fields.end_date = isIsoDate(data.end_date) && data.end_date >= data.start_date ? data.end_date : data.start_date;
    found.push('data');
  }
  if (isClock(data.start_time)) {
    fields.start_time = data.start_time;
    if (isClock(data.end_time)) fields.end_time = data.end_time;
    found.push('horário');
  }
  if (typeof data.location === 'string' && data.location.trim()) fields.location = data.location.trim().slice(0, 200);
  if (typeof data.location_city === 'string' && data.location_city.trim()) fields.location_city = data.location_city.trim().slice(0, 60);
  if (typeof data.location_state === 'string' && new RegExp(`^(${UF})$`).test(data.location_state)) fields.location_state = data.location_state;
  if (fields.location || fields.location_city) found.push('local');
  const amount = Number(data.daily_cache_value);
  if (Number.isFinite(amount) && amount >= 50 && amount <= 100000) {
    fields.daily_cache_value = Math.round(amount * 100) / 100;
    found.push('cachê');
  }
  if (typeof data.title === 'string' && data.title.trim()) {
    fields.title = data.title.trim().slice(0, 80);
    found.push('nome');
  }

  let clientName = typeof data.client_name === 'string' && data.client_name.trim() ? data.client_name.trim().slice(0, 80) : null;
  const hit = clientName ? findClient({ name: clientName }, clients) : null;
  if (hit) {
    fields.client_id = hit.id;
    clientName = hit.name;
    found.push('cliente');
  } else if (clientName) {
    found.push('cliente (novo)');
  }

  if (functions.length > 1 && functions.includes(data.function)) {
    fields.category = data.function;
    found.push('função');
  }

  const notes = typeof data.notes === 'string' ? data.notes.trim() : '';
  const header = source === 'credencial' ? 'Lido da foto da credencial' : 'Lido pela IA';
  const body = [originalText.trim(), notes].filter(Boolean).join('\n\n');
  if (found.length) fields.observacoes_md = `${header}:\n${body || '(sem outras informações)'}`.slice(0, 2000);
  return { fields, found, clientName };
}
