import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Excluir minha conta (Perfil → Conta). Apaga de verdade, na hora:
// arquivos do usuário, acesso ao Google, perfil e a conta — o resto das tabelas
// (shows, clientes, despesas, horas, avisos…) sai junto por "on delete cascade".

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'backstage';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function listAllFiles(svc: any, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  const { data, error } = await svc.storage.from(BUCKET).list(prefix, { limit: 1000 });
  if (error || !data) return paths;
  for (const item of data) {
    const full = `${prefix}/${item.name}`;
    // Pasta não tem id; arquivo tem
    if (item.id) paths.push(full);
    else paths.push(...await listAllFiles(svc, full));
  }
  return paths;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const authClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return json({ success: false, error: 'Não autorizado' }, 401);

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'EXCLUIR') return json({ success: false, error: 'Confirmação inválida' }, 400);

  const svc = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  try {
    // 1. Fotos, recibos e notas enviados pelo usuário
    const files = await listAllFiles(svc, user.id);
    for (let i = 0; i < files.length; i += 100) {
      await svc.storage.from(BUCKET).remove(files.slice(i, i + 100));
    }

    // 2. Acesso ao Google Agenda: revoga no Google (melhor esforço)
    const { data: conn } = await svc.from('google_calendar_connections').select('refresh_token').eq('user_id', user.id).maybeSingle();
    if (conn?.refresh_token) {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(conn.refresh_token)}`, { method: 'POST' }).catch(() => null);
    }

    // 3. Catálogo de empresas é compartilhado: a empresa fica, sem o autor
    await svc.from('companies').update({ created_by: null }).eq('created_by', user.id);

    // 4. Perfil não apaga sozinho com a conta
    await svc.from('profiles').delete().eq('id', user.id);

    // 5. A conta — o resto sai em cascata
    const { error } = await svc.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ success: true, removed_files: files.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao excluir a conta';
    return json({ success: false, error: message }, 500);
  }
});
