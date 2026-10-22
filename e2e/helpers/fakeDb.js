// Banco falso "de verdade" para E2E: guarda as linhas em memória e responde como o
// PostgREST (filtros eq/neq/gt/gte/lt/lte/in/is, order, limit, join clients(...),
// .single()/.maybeSingle(), insert/upsert/update/delete). Dados cobrem os casos que
// mudam as telas: show pago, a receber, hoje, futuro e cancelado; empresa e pessoa.
import { E2E_USER_ID } from './fakeAuth.js';

const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function localISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString('sv-SE');
}

export const FAKE_IDS = {
  empresa: uid(101),
  pessoa: uid(102),
  showPago: uid(201),
  showAReceber: uid(202),
  showHoje: uid(203),
  showFuturo: uid(204),
  showCancelado: uid(205),
};

export function richSeed() {
  const now = new Date().toISOString();
  const base = { user_id: E2E_USER_ID, created_at: now, updated_at: now };
  const ev = (id, dayOffset, extra) => ({
    ...base,
    id,
    title: 'Show',
    start_date: localISO(dayOffset),
    end_date: localISO(dayOffset),
    event_date: localISO(dayOffset),
    start_time: '18:00:00',
    end_time: '23:00:00',
    daily_cache_value: 900,
    payment_model: 'HORAS_EXTRAS',
    status: 'confirmed',
    payment_status: 'unpaid',
    location: 'Av. Paulista, 1000 - São Paulo, SP',
    location_city: 'São Paulo',
    location_state: 'SP',
    checklist_items: [],
    ...extra,
  });
  return {
    clients: [
      { ...base, id: FAKE_IDS.empresa, name: 'Palco Norte Produções', company: 'Palco Norte Produções LTDA', client_type: 'empresa', phone: '11988887777', email: 'contato@palconorte.local', city: 'São Paulo', state: 'SP', default_daily_cache: 900, profile_complete: true, brand_color: '#ffd400' },
      { ...base, id: FAKE_IDS.pessoa, name: 'Ana Ribeiro', client_type: 'pessoa', phone: '11977776666', city: 'Campinas', state: 'SP', default_daily_cache: 700, profile_complete: true },
    ],
    events: [
      ev(FAKE_IDS.showPago, -30, { title: 'Festival de Inverno', client_id: FAKE_IDS.empresa, status: 'completed', payment_status: 'paid', paid: true, paid_amount: 900, paid_date: localISO(-20), nfe_numero: '123' }),
      ev(FAKE_IDS.showAReceber, -5, { title: 'Casamento Ana', client_id: FAKE_IDS.pessoa, daily_cache_value: 700, payment_due_date: localISO(-1) }),
      ev(FAKE_IDS.showHoje, 0, { title: 'Show no Allianz', client_id: FAKE_IDS.empresa }),
      ev(FAKE_IDS.showFuturo, 10, { title: 'Turnê Sul', client_id: FAKE_IDS.empresa, location_city: 'Porto Alegre', location_state: 'RS' }),
      ev(FAKE_IDS.showCancelado, 15, { title: 'Show cancelado', client_id: FAKE_IDS.pessoa, status: 'cancelled' }),
    ],
    daily_work: [
      { ...base, id: uid(301), event_id: FAKE_IDS.showPago, work_date: localISO(-30), date: localISO(-30), entry_time: '17:00', exit_time: '23:30', total_hours: 6.5, overtime_hours: 0, daily_cache: 900, status: 'completed', origem: 'lancada', meal_allowance: 0 },
      { ...base, id: uid(302), event_id: FAKE_IDS.showAReceber, work_date: localISO(-5), date: localISO(-5), entry_time: '15:00', exit_time: '01:00', total_hours: 10, overtime_hours: 0, daily_cache: 700, status: 'completed', origem: 'lancada', meal_allowance: 0 },
    ],
    expenses: [
      { ...base, id: uid(401), event_id: FAKE_IDS.showAReceber, title: 'Uber até o local', category: 'transporte', amount: 58.9, expense_date: localISO(-5), is_reimbursable: true, reimbursed: false },
      { ...base, id: uid(402), event_id: null, title: 'Cabo XLR', category: 'equipamento', amount: 120, expense_date: localISO(-2), is_reimbursable: false, reimbursed: false },
    ],
    user_settings: [
      { ...base, id: uid(501), financial_visibility: true, google_calendar_connected: false, push_enabled: false, pix_key: '', notification_preferences: {}, widget_order: [], hidden_widgets: [], google_push_enabled: true, google_import_enabled: false, google_busy_check_enabled: true },
    ],
    notifications: [
      { ...base, id: uid(601), title: 'Pagamento atrasado', message: 'Casamento Ana venceu ontem', type: 'payment', priority: 'high', is_read: false, action_url: '/reports' },
    ],
    event_templates: [
      { ...base, id: uid(701), name: 'Diária padrão', title: 'Show', payment_model: 'HORAS_EXTRAS', daily_cache_value: 900 },
    ],
    companies: [
      { id: uid(801), name: 'Palco Norte Produções LTDA', trading_name: 'Palco Norte', cnpj: '11222333000181', city: 'São Paulo', state: 'SP', verified: true, source: 'manual' },
    ],
    client_interactions: [],
    ai_conversations: [],
    closing_shares: [],
    google_calendar_connections: [],
    push_subscriptions: [],
    feedback: [],
  };
}

function matches(row, key, raw) {
  const v = row[key];
  const [op, ...rest] = raw.split('.');
  const val = rest.join('.');
  const s = v == null ? null : String(v);
  switch (op) {
    case 'eq': return s === val;
    case 'neq': return s !== val;
    case 'gt': return s != null && s > val;
    case 'gte': return s != null && s >= val;
    case 'lt': return s != null && s < val;
    case 'lte': return s != null && s <= val;
    case 'in': return val.replace(/[()"]/g, '').split(',').includes(s);
    case 'is': return val === 'null' ? v == null : String(v) === val;
    case 'not': return !matches(row, key, val);
    case 'like':
    case 'ilike': return new RegExp('^' + val.replace(/[%*]/g, '.*') + '$', 'i').test(s || '');
    default: return true;
  }
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns', 'or', 'and']);

function embed(db, table, row, select) {
  if (!select) return row;
  const out = { ...row };
  for (const m of select.matchAll(/(?:(\w+):)?(\w+)(?:!\w+)?\(([^)]*)\)/g)) {
    const [, alias, rel] = m;
    const key = alias || rel;
    const fk = `${rel.replace(/s$/, '')}_id`;
    if (db[rel] && row[fk] !== undefined) out[key] = db[rel].find((r) => r.id === row[fk]) || null;
    else if (db[rel]) out[key] = db[rel].filter((r) => r[`${table.replace(/s$/, '')}_id`] === row.id);
  }
  return out;
}

/** Volta o banco falso ao estado inicial (mesmo objeto, para o route continuar valendo). */
export function resetFakeDb(db, seed = richSeed()) {
  for (const k of Object.keys(db)) delete db[k];
  Object.assign(db, seed);
}

/** Instala o banco falso na página. Devolve o objeto `db` (dá para inspecionar no teste). */
export async function installFakeDb(page, seed = richSeed()) {
  const db = seed;
  let seq = 900;

  await page.route('**/functions/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, results: [], reply: 'ok' }) })
  );
  await page.route('**/storage/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ Key: 'x', path: 'x', signedUrl: 'https://example.com/x' }) })
  );

  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const m = url.pathname.match(/\/rest\/v1\/(rpc\/)?([^/]+)/);
    if (!m) return route.fallback();
    const [, isRpc, table] = m;
    if (table === 'profiles') return route.fallback();
    if (isRpc) return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });

    const rows = (db[table] = db[table] || []);
    const params = url.searchParams;
    const filtered = () => rows.filter((r) => [...params.entries()].every(([k, v]) => RESERVED.has(k) || matches(r, k, v)));
    const wantsObject = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
    const reply = (status, data) => {
      if (wantsObject) {
        const list = Array.isArray(data) ? data : [data];
        if (list.length !== 1) {
          return route.fulfill({ status: 406, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `The result contains ${list.length} rows` }) });
        }
        return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(list[0]) });
      }
      const list = Array.isArray(data) ? data : [data];
      return route.fulfill({ status, contentType: 'application/json', headers: { 'content-range': `0-${Math.max(list.length - 1, 0)}/${list.length}` }, body: JSON.stringify(list) });
    };

    const method = req.method();
    if (method === 'GET' || method === 'HEAD') {
      let result = filtered();
      const order = params.get('order');
      if (order) {
        const [col, dir] = order.split(',')[0].split('.');
        result = [...result].sort((a, b) => ((a[col] ?? '') > (b[col] ?? '') ? 1 : -1) * (dir === 'desc' ? -1 : 1));
      }
      const limit = Number(params.get('limit'));
      if (limit) result = result.slice(0, limit);
      result = result.map((r) => embed(db, table, r, params.get('select')));
      if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': `0-0/${result.length}` }, body: '' });
      return reply(200, result);
    }
    if (method === 'POST') {
      let body;
      try { body = req.postDataJSON(); } catch { body = {}; }
      const list = (Array.isArray(body) ? body : [body]).map((r) => {
        const prefer = req.headers()['prefer'] || '';
        const conflict = params.get('on_conflict');
        if (prefer.includes('merge-duplicates') && conflict) {
          const keys = conflict.split(',');
          const existing = rows.find((x) => keys.every((k) => x[k] === r[k]));
          if (existing) { Object.assign(existing, r, { updated_at: new Date().toISOString() }); return existing; }
        }
        const row = { id: r.id || uid(++seq), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...r };
        rows.push(row);
        return row;
      });
      return reply(201, list);
    }
    if (method === 'PATCH') {
      let body;
      try { body = req.postDataJSON(); } catch { body = {}; }
      const hit = filtered();
      hit.forEach((r) => Object.assign(r, body, { updated_at: new Date().toISOString() }));
      return reply(200, hit);
    }
    if (method === 'DELETE') {
      const hit = new Set(filtered());
      db[table] = rows.filter((r) => !hit.has(r));
      return reply(200, [...hit]);
    }
    return route.fallback();
  });

  return db;
}
