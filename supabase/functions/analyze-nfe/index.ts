import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toBase64(arrayBuffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < uint8.length; i += chunk) {
    binary += String.fromCharCode(...uint8.subarray(i, Math.min(i + chunk, uint8.length)));
  }
  return btoa(binary);
}

function normalizeName(str: string): string {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function cnpjDigits(str: string): string {
  return (str ?? '').replace(/\D/g, '');
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

    const body = await req.json() as {
      pdf_url?: string;
      event_context?: {
        titulo?: string;
        cliente_nome?: string;
        cliente_cnpj?: string;
        valor?: number;
      };
    };

    if (!body.pdf_url) {
      return new Response(JSON.stringify({ error: 'pdf_url é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'IA indisponível: configure GEMINI_API_KEY' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Baixa o PDF do Storage
    const pdfRes = await fetch(body.pdf_url);
    if (!pdfRes.ok) throw new Error(`Erro ao buscar PDF: ${pdfRes.status}`);
    // Forçar application/pdf independente do Content-Type do storage
    const mimeType = 'application/pdf';
    const base64 = toBase64(await pdfRes.arrayBuffer());

    const ctx = body.event_context ?? {};
    const contextBlock = [
      ctx.titulo      ? `Serviço/evento: "${ctx.titulo}"`                    : null,
      ctx.cliente_nome ? `Tomador esperado: "${ctx.cliente_nome}"`           : null,
      ctx.cliente_cnpj ? `CNPJ esperado do tomador: ${ctx.cliente_cnpj}`    : null,
      ctx.valor        ? `Valor esperado: R$ ${ctx.valor.toFixed(2)}`        : null,
    ].filter(Boolean).join('\n');

    const prompt = `Você é especialista em Notas Fiscais de Serviços Eletrônicas (NFS-e) brasileiras.

Analise este documento e extraia os dados principais da NF-e.

${contextBlock ? `Contexto do evento que originou esta NF-e:\n${contextBlock}\n` : ''}
Retorne SOMENTE JSON válido (sem markdown) com os campos:
- "nfe_numero": string com o número da nota (ex: "000042") ou null
- "nfe_valor": number com o valor total em reais (ex: 1500.00) ou 0
- "nfe_competencia": string com o período (ex: "junho/2026") ou null
- "nfe_tomador_nome": string com o nome do tomador/contratante ou null
- "nfe_tomador_cnpj": string apenas com dígitos do CNPJ do tomador ou null
- "nfe_prestador_nome": string com o nome do prestador/emitente ou null
- "nfe_descricao": string com a descrição do serviço (máx 150 chars) ou null
- "cliente_reconhecido": boolean — true se o tomador da NF corresponde ao tomador esperado (compare nome e CNPJ se disponíveis, com flexibilidade para variações de grafia)
- "valor_confere": boolean — true se o valor da NF está dentro de R$ 1,00 do valor esperado (ou se não há valor esperado, retorne true)
- "divergencias": array de strings descrevendo divergências encontradas, vazio se tudo ok`;

    // Gemini 2.5 Flash com PDF: usar generateContent sem responseMimeType
    // (responseMimeType + PDF inline pode causar 500 em alguns modelos)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          maxOutputTokens: 1024,
          temperature: 0.1,
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

    // Validação cruzada server-side (reforça o que a IA fez)
    const tomadorNome = String(extracted.nfe_tomador_nome ?? '');
    const tomadorCnpj = cnpjDigits(String(extracted.nfe_tomador_cnpj ?? ''));
    const clienteNome = ctx.cliente_nome ?? '';
    const clienteCnpj = cnpjDigits(ctx.cliente_cnpj ?? '');

    let clienteReconhecido = Boolean(extracted.cliente_reconhecido);

    // Reforço por CNPJ (mais confiável que nome)
    if (clienteCnpj && tomadorCnpj && clienteCnpj === tomadorCnpj) {
      clienteReconhecido = true;
    } else if (clienteNome && tomadorNome) {
      const normalClient = normalizeName(clienteNome);
      const normalTomador = normalizeName(tomadorNome);
      if (
        normalClient.length > 3 &&
        (normalTomador.includes(normalClient) || normalClient.includes(normalTomador))
      ) {
        clienteReconhecido = true;
      }
    }

    const nfeValor = Number(extracted.nfe_valor) || 0;
    const valorConfere = ctx.valor
      ? Math.abs(nfeValor - ctx.valor) <= 1.0
      : true;

    const result = {
      nfe_numero:       extracted.nfe_numero ? String(extracted.nfe_numero) : null,
      nfe_valor:        nfeValor,
      nfe_competencia:  extracted.nfe_competencia ? String(extracted.nfe_competencia) : null,
      nfe_tomador_nome: tomadorNome || null,
      nfe_tomador_cnpj: tomadorCnpj || null,
      nfe_prestador_nome: extracted.nfe_prestador_nome ? String(extracted.nfe_prestador_nome) : null,
      nfe_descricao:    extracted.nfe_descricao ? String(extracted.nfe_descricao).slice(0, 150) : null,
      cliente_reconhecido: clienteReconhecido,
      valor_confere:    valorConfere,
      divergencias:     Array.isArray(extracted.divergencias) ? extracted.divergencias.map(String) : [],
      analisado_em:     new Date().toISOString(),
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
