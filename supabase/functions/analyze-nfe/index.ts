import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

/**
 * Faz upload do PDF para a Google AI Files API via upload resumível.
 * Retorna o fileUri que será usado na chamada ao Gemini.
 * Isso é necessário porque gemini-2.5-flash NÃO suporta inline_data para PDFs.
 */
async function uploadPdfToGemini(pdfBytes: ArrayBuffer, geminiKey: string): Promise<string> {
  const numBytes = pdfBytes.byteLength;

  // 1. Inicia sessão de upload resumível
  const startRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(geminiKey)}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(numBytes),
        'X-Goog-Upload-Header-Content-Type': 'application/pdf',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: 'nfe.pdf' } }),
    },
  );

  if (!startRes.ok) {
    const err = await startRes.text().catch(() => '');
    throw new Error(`Falha ao iniciar upload do PDF para IA: ${startRes.status} ${err.slice(0, 120)}`);
  }

  const resumableUrl = startRes.headers.get('x-goog-upload-url');
  if (!resumableUrl) throw new Error('URL de upload não retornada pela Google AI Files API');

  // 2. Envia os bytes do PDF
  const uploadRes = await fetch(resumableUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(numBytes),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
      'Content-Type': 'application/pdf',
    },
    body: pdfBytes,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text().catch(() => '');
    throw new Error(`Erro ao enviar PDF para IA: ${uploadRes.status} ${err.slice(0, 120)}`);
  }

  const fileInfo = await uploadRes.json();
  const fileUri = fileInfo.file?.uri;
  if (!fileUri) throw new Error('fileUri não retornado após upload para Google AI Files API');

  return fileUri;
}

/** Remove arquivo da Google AI Files API após uso (não bloqueia). */
function deleteGeminiFile(fileUri: string, geminiKey: string): void {
  try {
    const name = fileUri.split('/').pop();
    fetch(
      `https://generativelanguage.googleapis.com/v1beta/files/${name}?key=${encodeURIComponent(geminiKey)}`,
      { method: 'DELETE' },
    ).catch(() => {});
  } catch { /* ignorar */ }
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

    // 1. Baixa o PDF do Supabase Storage
    const pdfRes = await fetch(body.pdf_url);
    if (!pdfRes.ok) throw new Error(`Erro ao buscar PDF: ${pdfRes.status}`);
    const pdfBytes = await pdfRes.arrayBuffer();

    // 2. Faz upload do PDF para a Google AI Files API
    //    (gemini-2.5-flash requer Files API para PDFs — inline_data não funciona)
    const fileUri = await uploadPdfToGemini(pdfBytes, geminiKey);

    const ctx = body.event_context ?? {};
    const contextBlock = [
      ctx.titulo       ? `Serviço/evento: "${ctx.titulo}"`                : null,
      ctx.cliente_nome ? `Tomador esperado: "${ctx.cliente_nome}"`        : null,
      ctx.cliente_cnpj ? `CNPJ esperado do tomador: ${ctx.cliente_cnpj}` : null,
      ctx.valor        ? `Valor esperado: R$ ${ctx.valor.toFixed(2)}`     : null,
    ].filter(Boolean).join('\n');

    const prompt = `Você é especialista em Notas Fiscais de Serviços Eletrônicas (NFS-e) brasileiras.

Analise este documento e extraia os dados principais da NF-e.

${contextBlock ? `Contexto do evento que originou esta NF-e:\n${contextBlock}\n` : ''}
Retorne SOMENTE JSON válido (sem markdown, sem blocos de código, sem texto adicional) com os campos:
- "nfe_numero": string com o número da nota (ex: "000042") ou null
- "nfe_valor": number com o valor total em reais (ex: 1500.00) ou 0
- "nfe_competencia": string com o período de competência (ex: "junho/2026") ou null
- "nfe_tomador_nome": string com o nome do tomador/contratante ou null
- "nfe_tomador_cnpj": string apenas com dígitos do CNPJ do tomador ou null
- "nfe_prestador_nome": string com o nome do prestador/emitente ou null
- "nfe_descricao": string com a descrição do serviço (máx 150 chars) ou null
- "cliente_reconhecido": boolean — true se o tomador da NF corresponde ao tomador esperado (compare nome e CNPJ, seja flexível com variações de grafia)
- "valor_confere": boolean — true se o valor da NF está dentro de R$ 1,00 do valor esperado (se não há valor esperado, retorne true)
- "divergencias": array de strings descrevendo divergências encontradas (vazio se tudo ok)`;

    // 3. Chama Gemini usando file_data (Files API — único modo suportado para PDFs)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { file_data: { mime_type: 'application/pdf', file_uri: fileUri } },
            { text: prompt },
          ],
        }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    // Cleanup do arquivo do Gemini (não bloqueia)
    deleteGeminiFile(fileUri, geminiKey);

    const geminiJson = await geminiRes.json();
    if (!geminiRes.ok) {
      throw new Error(geminiJson.error?.message ?? `Gemini API ${geminiRes.status}`);
    }

    const candidate = geminiJson.candidates?.[0];
    const finishReason = candidate?.finishReason ?? 'UNKNOWN';
    const text: string = candidate?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      throw new Error(`IA não retornou análise do PDF (finishReason: ${finishReason}). Verifique se o arquivo é uma NF-e válida.`);
    }

    let extracted: Record<string, unknown>;
    try {
      // Strip markdown code block if present (```json ... ``` or ``` ... ```)
      const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      extracted = JSON.parse(stripped);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Resposta da IA em formato inválido: ' + text.slice(0, 300));
      extracted = JSON.parse(match[0]);
    }

    // Validação cruzada server-side (reforça o que a IA fez)
    const tomadorNome = String(extracted.nfe_tomador_nome ?? '');
    const tomadorCnpj = cnpjDigits(String(extracted.nfe_tomador_cnpj ?? ''));
    const clienteNome = ctx.cliente_nome ?? '';
    const clienteCnpj = cnpjDigits(ctx.cliente_cnpj ?? '');

    let clienteReconhecido = Boolean(extracted.cliente_reconhecido);

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
      nfe_numero:          extracted.nfe_numero ? String(extracted.nfe_numero) : null,
      nfe_valor:           nfeValor,
      nfe_competencia:     extracted.nfe_competencia ? String(extracted.nfe_competencia) : null,
      nfe_tomador_nome:    tomadorNome || null,
      nfe_tomador_cnpj:    tomadorCnpj || null,
      nfe_prestador_nome:  extracted.nfe_prestador_nome ? String(extracted.nfe_prestador_nome) : null,
      nfe_descricao:       extracted.nfe_descricao ? String(extracted.nfe_descricao).slice(0, 150) : null,
      cliente_reconhecido: clienteReconhecido,
      valor_confere:       valorConfere,
      divergencias:        Array.isArray(extracted.divergencias) ? extracted.divergencias.map(String) : [],
      analisado_em:        new Date().toISOString(),
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
