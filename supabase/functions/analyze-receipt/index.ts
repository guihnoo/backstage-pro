import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_CATEGORIES = ['transporte', 'alimentacao', 'equipamento', 'hospedagem', 'combustivel', 'manutencao', 'outros'];

function toBase64(arrayBuffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < uint8.length; i += chunk) {
    binary += String.fromCharCode(...uint8.subarray(i, Math.min(i + chunk, uint8.length)));
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader ?? '' } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { image_url } = await req.json() as { image_url?: string };
    if (!image_url) {
      return new Response(JSON.stringify({ error: 'image_url é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'OCR indisponível: configure GEMINI_API_KEY' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download da imagem do Supabase Storage
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) throw new Error(`Erro ao buscar imagem: ${imgRes.status}`);
    const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
    const base64 = toBase64(await imgRes.arrayBuffer());

    const prompt = `Analise este recibo/nota fiscal e extraia os dados de despesa.
Retorne SOMENTE JSON válido (sem markdown) com os campos:
- "title": string (nome do estabelecimento ou descrição, máx 60 chars)
- "amount": number (valor total em reais, sem símbolo, ex: 45.90)
- "date": string (YYYY-MM-DD) ou null se não encontrar
- "category": uma de: transporte, alimentacao, equipamento, hospedagem, combustivel, manutencao, outros
- "notes": string (observações opcionais como número NF, máx 100 chars, ou "")`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        }],
        generationConfig: {
          maxOutputTokens: 256,
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    const geminiJson = await geminiRes.json();
    if (!geminiRes.ok) {
      throw new Error(geminiJson.error?.message ?? `Gemini API ${geminiRes.status}`);
    }

    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Resposta da IA em formato inválido');
      extracted = JSON.parse(match[0]);
    }

    const result = {
      title: String(extracted.title || '').slice(0, 60),
      amount: Number(extracted.amount) || 0,
      date: extracted.date && /^\d{4}-\d{2}-\d{2}$/.test(String(extracted.date)) ? String(extracted.date) : null,
      category: VALID_CATEGORIES.includes(String(extracted.category)) ? String(extracted.category) : 'outros',
      notes: String(extracted.notes || '').slice(0, 100),
    };

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
