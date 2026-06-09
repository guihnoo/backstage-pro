import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatMessage = { role: string; content: string };
type FinancialContext = Record<string, unknown>;

function formatBRL(value: unknown) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function buildLocalAnswer(question: string, context: FinancialContext): string {
  const q = question.toLowerCase();
  const faturamento = Number(context.faturamento_mes) || 0;
  const aReceber = Number(context.a_receber) || 0;
  const eventosMes = Number(context.eventos_mes) || 0;
  const clientesAtivos = Number(context.clientes_ativos) || 0;
  const totalClientes = Number(context.total_clientes) || 0;
  const metaReceita = Number(context.meta_receita) || 0;
  const metaEventos = Number(context.meta_eventos) || 0;
  const proximos = (context.proximos_eventos as Array<Record<string, unknown>>) || [];
  const categoria = String(context.categoria || 'técnico de eventos');

  if (/faturamento|receita|ganh|fatur/.test(q)) {
    const pctMeta = metaReceita > 0 ? Math.round((faturamento / metaReceita) * 100) : null;
    let text = `📊 **Resumo financeiro do mês**\n\n`;
    text += `• Faturamento recebido: ${formatBRL(faturamento)}\n`;
    text += `• A receber: ${formatBRL(aReceber)}\n`;
    text += `• Eventos no mês: ${eventosMes}\n`;
    if (metaReceita > 0) {
      text += `• Meta de receita: ${formatBRL(metaReceita)} (${pctMeta}% atingido)\n`;
    }
    if (pctMeta !== null && pctMeta < 70) {
      text += `\n💡 Você está abaixo de 70% da meta. Vale priorizar cobranças pendentes e fechar novos eventos.`;
    } else if (pctMeta !== null && pctMeta >= 100) {
      text += `\n🎯 Parabéns! Meta de receita batida ou superada.`;
    }
    return text;
  }

  if (/próxim|proxim|semana|agenda|evento/.test(q)) {
    if (!proximos.length) {
      return '📅 Não encontrei eventos futuros na sua agenda. Que tal cadastrar um novo show no calendário?';
    }
    let text = `📅 **Próximos eventos**\n\n`;
    for (const ev of proximos.slice(0, 5)) {
      const valor = ev.valor ? ` — ${formatBRL(ev.valor)}` : '';
      text += `• ${ev.data} — ${ev.titulo || 'Evento'} (${ev.cliente || 'Sem cliente'})${valor}\n`;
    }
    return text.trim();
  }

  if (/cliente/.test(q)) {
    return `🏢 **Carteira de clientes**\n\n• Clientes ativos: ${clientesAtivos}\n• Total cadastrados: ${totalClientes}\n\nMantenha contato com quem mais contrata e registre cada job para ver tendências nos relatórios.`;
  }

  if (/meta|objetivo/.test(q)) {
    const pctR = metaReceita > 0 ? Math.round((faturamento / metaReceita) * 100) : 0;
    const pctE = metaEventos > 0 ? Math.round((eventosMes / metaEventos) * 100) : 0;
    return `🎯 **Suas metas do mês**\n\n• Receita: ${formatBRL(faturamento)} de ${formatBRL(metaReceita)} (${pctR}%)\n• Eventos: ${eventosMes} de ${metaEventos} (${pctE}%)\n\nAjuste metas no Perfil se quiser recalibrar o mês.`;
  }

  if (/resumo|mês passado|mes passado/.test(q)) {
    return `📋 **Panorama atual (${categoria})**\n\n• Faturamento: ${formatBRL(faturamento)}\n• Pendente: ${formatBRL(aReceber)}\n• Eventos: ${eventosMes}\n• Clientes ativos: ${clientesAtivos}\n\nPergunte sobre faturamento, agenda, clientes ou metas para detalhes.`;
  }

  if (/preço|precific|cachê|cache|valor|diária|diaria/.test(q)) {
    return `💰 **Precificação para ${categoria}**\n\nConsidere: diária base, horas extras, deslocamento, montagem/desmontagem e tipo de evento (corporativo costuma pagar mais que festa local).\n\nNo Backstage Pro, registre o cachê em cada evento para o relatório refletir sua média real.`;
  }

  return `Olá! Sou seu mentor financeiro do Backstage Pro (${categoria}).\n\nPosso ajudar com:\n• Faturamento e metas do mês\n• Próximos eventos na agenda\n• Carteira de clientes\n• Dicas de precificação\n\nExperimente: "Como está meu faturamento este mês?" ou "Quais eventos tenho na próxima semana?"`;
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[],
): Promise<string> {
  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    const msg = result.error?.message ?? `Gemini API ${response.status}`;
    throw new Error(msg);
  }

  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta vazia do Gemini');
  return text;
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

    const { messages = [], context = {} } = await req.json() as {
      messages?: ChatMessage[];
      context?: FinancialContext;
    };

    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    const question = lastUser?.content?.trim() || '';

    const systemPrompt = `Você é o AI Mentor do Backstage Pro, assistente financeiro para profissionais técnicos de eventos (som, luz, vídeo, DJ, iluminação).
Responda sempre em português do Brasil, de forma clara e objetiva, com emojis moderados.
Use os dados do contexto quando relevante — não invente números.
${Object.keys(context).length > 0 ? `\nContexto do usuário:\n${JSON.stringify(context, null, 2)}` : ''}`;

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    let answer: string;
    let provider = 'local';

    if (geminiKey && messages.length > 0) {
      try {
        answer = await callGemini(geminiKey, systemPrompt, messages);
        provider = 'gemini';
      } catch (err) {
        console.warn('[ai-chat] Gemini falhou, usando motor local:', err);
        answer = buildLocalAnswer(question, context);
        provider = 'local-fallback';
      }
    } else {
      answer = buildLocalAnswer(question, context);
    }

    return new Response(JSON.stringify({ answer, provider }), {
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
