import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Lê um trabalho de uma mensagem (ideia #106, "Ler com IA") ou da foto de uma credencial
// (ideia #108) com o Gemini. A foto chega em base64 e não é guardada em lugar nenhum.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TEXT = 4000;
const MAX_IMAGE_B64 = 6_000_000; // ~4,5 MB de imagem
const UF = new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

const isDate = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const isTime = (v: unknown) => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

function clean(raw: Record<string, unknown>, functions: string[]) {
  const amount = Number(raw.daily_cache_value);
  const state = str(raw.location_state, 2).toUpperCase();
  const fn = str(raw.function, 30);
  const start = isDate(raw.start_date) ? String(raw.start_date) : null;
  const end = isDate(raw.end_date) && start && String(raw.end_date) >= start ? String(raw.end_date) : start;
  return {
    title: str(raw.title, 80) || null,
    client_name: str(raw.client_name, 80) || null,
    start_date: start,
    end_date: end,
    start_time: isTime(raw.start_time) ? String(raw.start_time) : null,
    end_time: isTime(raw.end_time) ? String(raw.end_time) : null,
    location: str(raw.location, 200) || null,
    location_city: str(raw.location_city, 60) || null,
    location_state: UF.has(state) ? state : null,
    daily_cache_value: Number.isFinite(amount) && amount >= 50 && amount <= 100000 ? Math.round(amount * 100) / 100 : null,
    function: functions.includes(fn) ? fn : null,
    notes: str(raw.notes, 300) || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Não autorizado' }, 401);

    const body = await req.json().catch(() => ({})) as {
      mode?: string; text?: string; image_base64?: string; mime_type?: string;
      today?: string; clients?: string[]; functions?: string[];
    };
    const mode = body.mode === 'image' ? 'image' : 'text';
    const functions = Array.isArray(body.functions) ? body.functions.filter((f) => typeof f === 'string').slice(0, 15) : [];
    const clients = Array.isArray(body.clients) ? body.clients.filter((c) => typeof c === 'string').map((c) => c.slice(0, 60)).slice(0, 60) : [];
    const today = isDate(body.today) ? String(body.today) : new Date().toISOString().slice(0, 10);

    if (mode === 'text' && !str(body.text, MAX_TEXT)) return json({ error: 'Mensagem vazia' }, 400);
    if (mode === 'image') {
      if (!body.image_base64 || body.image_base64.length > MAX_IMAGE_B64) return json({ error: 'Foto ausente ou grande demais' }, 400);
      if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(body.mime_type || '')) return json({ error: 'Formato de foto não aceito' }, 400);
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    if (!geminiKey) return json({ error: 'IA indisponível: configure GEMINI_API_KEY' }, 503);

    const source = mode === 'image'
      ? 'a FOTO de uma credencial de evento (crachá, pulseira, passe de produção ou backstage)'
      : 'uma MENSAGEM (geralmente de WhatsApp) oferecendo um trabalho em evento';
    const prompt = `Você ajuda um técnico de eventos brasileiro a cadastrar um trabalho a partir de ${source}.
Hoje é ${today} (use para resolver "amanhã", "sábado", "dia 25" e o ano quando faltar).
Funções possíveis do técnico (use exatamente um destes códigos ou null): ${functions.join(', ') || 'nenhuma'}.
Clientes já cadastrados (se a produtora/contratante for um deles, use o nome igual): ${clients.join('; ') || 'nenhum'}.
Responda SOMENTE um JSON com:
- "title": nome do evento/show (string curta) ou null
- "client_name": produtora, empresa ou pessoa que contrata, ou null
- "start_date", "end_date": "AAAA-MM-DD" ou null
- "start_time": horário de chegada/início do técnico "HH:MM" ou null; "end_time": "HH:MM" ou null
- "location": local/endereço como escrito, ou null; "location_city": cidade ou null; "location_state": UF (2 letras) ou null
- "daily_cache_value": valor do cachê/diária em reais (número) ou null — nunca invente valor
- "function": código da função do técnico neste trabalho ou null
- "notes": outras informações úteis (área de acesso, setor, contato), até 200 caracteres, ou null
Se um dado não aparecer, use null. Não invente.`;

    const parts: unknown[] = [{ text: prompt }];
    if (mode === 'image') parts.push({ inline_data: { mime_type: body.mime_type, data: body.image_base64 } });
    else parts.push({ text: `MENSAGEM:\n${str(body.text, MAX_TEXT)}` });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out?.error?.message ?? `Gemini ${res.status}`);

    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Resposta da IA em formato inválido');
      raw = JSON.parse(match[0]);
    }

    return json({ success: true, data: clean(raw, functions) });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
