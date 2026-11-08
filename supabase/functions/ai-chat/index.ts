import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Roadie (08/11): o assistente do Backstage Pro. O app manda o retrato da conta
// (src/lib/roadie/context.js, mesmas regras das telas); aqui só conversamos com a IA.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ChatMessage = { role: string; content: string };
type Ctx = Record<string, any>;

function brl(value: unknown) {
  const n = Number(value) || 0;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Rotas que o Roadie pode oferecer como botão ([texto](/rota)). */
const ROTAS = `
- /pendencias?grupo=receber — dar baixa no que já recebeu
- /pendencias?grupo=pagosSemValor — preencher valores que faltam
- /pendencias?grupo=semHoras — registrar horas que faltam
- /pendencias?grupo=saidaAberta — registrar a saída esquecida
- /reports — Dinheiro (mês)
- /reports?aba=receber — quem deve, por empresa
- /calendar — Agenda
- /calendar?event=ID — abrir um trabalho (use o id do contexto)
- /calendar?action=new-event — novo trabalho
- /goals — Metas
- /clients — Clientes`;

/** Ações que o app executa depois do "Confirmar" do usuário (fase 2). */
const ACOES = `
- /acao/baixa?event=ID — dar baixa num trabalho de a_receber (opcional &valor=700&data=AAAA-MM-DD só se o usuário disser)
- /acao/horas?event=ID&dia=AAAA-MM-DD&entrada=HH:MM&saida=HH:MM — registrar horas de um dia de falta_horas (só com os horários que o usuário disse)
- /acao/saida?work=WORK_ID&saida=HH:MM — fechar uma saida_aberta (só com o horário que o usuário disse)
- /acao/cobrar?event=ID — abrir a cobrança no WhatsApp
- /acao/novo?titulo=...&inicio=AAAA-MM-DD&fim=AAAA-MM-DD&cliente=CLIENTE_ID&cache=800 — abrir o formulário de novo trabalho preenchido (use o id de clientes)`;

function systemPrompt(ctx: Ctx) {
  return `Você é o ROADIE, o assistente do Backstage Pro — o app de técnicos de eventos (som, luz, vídeo, DJ, produção) que trabalham por diária.
Personalidade: parceiro de bastidor, direto, prático, gente boa. Fala como alguém da equipe técnica, sem formalidade e sem enrolação.

REGRAS
- Português do Brasil. Respostas CURTAS: no máximo 6 linhas ou uma lista curta. Comece pela resposta.
- Use SÓ os números do CONTEXTO. Nunca invente valor, data, cliente ou trabalho. Se não estiver no contexto, diga que não encontrou e sugira onde ver.
- Valores em reais no formato R$ 1.234,56. Datas no formato 24/10.
- Sempre que existir uma ação no app, termine com 1 ou 2 botões em markdown, só destas rotas:${ROTAS}
  Exemplo: [Dar baixa](/pendencias?grupo=receber)
- Você não grava nada sozinho: prepare e o usuário confirma no app. Para AGIR, use estes botões (o app mostra o resumo e pede "Confirmar"):${ACOES}
  Ex.: "já recebi da Ana" → [Dar baixa: Show Allianz](/acao/baixa?event=ID). "trabalhei ontem das 8 às 20" → [Registrar 8h–20h](/acao/horas?event=ID&dia=...&entrada=08:00&saida=20:00).
  Use SÓ ids que estão no CONTEXTO. Se faltar dado (qual trabalho, horário), pergunte em 1 linha em vez de chutar. Um botão por trabalho.
- "Quem me deve": use a_receber (cliente, trabalho, valor, dias desde o fim). "Paga mais rápido": prazo_medio_pagamento_dias em clientes (menor = mais rápido; null = sem dado confiável).
- "Quanto cobrar": compare media_por_trabalho dos clientes e o cache_dia dos próximos trabalhos; sugira um valor e explique em 1 linha.
- Se houver pendências (saída aberta, horas, valores), mencione a mais urgente no fim, em 1 linha.

CONTEXTO (dados reais da conta, hoje ${ctx?.hoje ?? ''}):
${JSON.stringify(ctx ?? {}, null, 0)}`;
}

/** Sem IA: responde o básico com os próprios números do contexto. */
function localAnswer(question: string, ctx: Ctx): string {
  const q = question.toLowerCase();
  const receber = (ctx?.a_receber ?? []) as Array<Record<string, any>>;
  const mes = ctx?.mes_atual ?? {};
  if (/dev|receber|pag/.test(q)) {
    if (!receber.length) return 'Ninguém te deve agora. 🙌';
    const linhas = receber.slice(0, 5).map((r) => `• ${r.cliente} — ${r.trabalho}: ${brl(r.valor)} (${r.dias_desde_fim} dias)`).join('\n');
    const botoes = receber.slice(0, 3).map((r) => `[Já recebi: ${r.trabalho}](/acao/baixa?event=${r.id})`).join('\n\n');
    return `Falta receber ${brl(ctx.a_receber_total)}:\n${linhas}\n\n${botoes}\n\n[Ver todos](/pendencias?grupo=receber)`;
  }
  if (/m[eê]s|ganhei|fatur|entrou/.test(q)) {
    return `Neste mês entrou ${brl(mes.entrou)}, faturou ${brl(mes.faturado)} e gastou ${brl(mes.despesas)}. Horas: ${mes.horas ?? 0} h.\n\n[Ver Dinheiro](/reports)`;
  }
  if (/pend|resolver|falta/.test(q)) {
    const p = ctx?.pendencias ?? {};
    return `Pendências: ${p.confirmar_recebimento ?? 0} para confirmar recebimento, ${(p.falta_valor ?? []).length} sem valor, ${(p.falta_horas ?? []).length} sem horas.\n\n[Abrir pendências](/pendencias)`;
  }
  return 'Pergunte quem te deve, como foi o mês ou o que falta resolver. 🎛️';
}

async function callGemini(apiKey: string, system: string, messages: ChatMessage[]): Promise<string> {
  const contents = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-12)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: 900, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } },
    }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error?.message ?? `Gemini API ${response.status}`);
  const text = result.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new Error('Resposta vazia do Gemini');
  return text;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages = [], context = {} } = await req.json() as { messages?: ChatMessage[]; context?: Ctx };
    const question = [...messages].reverse().find((m) => m.role === 'user')?.content?.trim() || '';

    const geminiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    let answer: string;
    let provider = 'local';
    if (geminiKey && messages.length > 0) {
      try {
        answer = await callGemini(geminiKey, systemPrompt(context), messages);
        provider = 'gemini';
      } catch (err) {
        console.warn('[roadie] IA falhou, usando respostas locais:', err);
        answer = localAnswer(question, context);
        provider = 'local-fallback';
      }
    } else {
      answer = localAnswer(question, context);
    }

    return new Response(JSON.stringify({ answer, provider }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
