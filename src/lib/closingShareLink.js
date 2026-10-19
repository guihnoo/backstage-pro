import { buildEventClosing } from '@/lib/eventClosing';
import { getCategoryLabel } from '@/lib/categoryConfig';
import { todayLocalISO } from '@/components/utils/dateUtils';

/**
 * Monta um payload compacto e autocontido do Fechamento de Evento
 * para ser aberto pelo contratante/produtora no navegador sem login.
 */
export function buildClosingShareData({
  event,
  client,
  work = [],
  expenses = [],
  profile = {},
  userSettings = {},
}) {
  const closing = buildEventClosing(event, work, expenses);
  const providerName =
    userSettings?.report_full_name || profile?.name || profile?.full_name || 'Prestador';
  const categoryId = profile?.category || 'lighting';
  const categoryLabel =
    userSettings?.report_profession ||
    profile?.category_label ||
    getCategoryLabel(categoryId) ||
    'Profissional de Eventos';
  const providerDoc =
    userSettings?.cpf_cnpj ||
    profile?.cnpj ||
    profile?.cpf_cnpj ||
    event?.nfe_analise?.prestador_cnpj ||
    '';
  const pixKey = userSettings?.pix_key || profile?.pix_key || '';
  const pixKeyType = userSettings?.pix_key_type || profile?.pix_key_type || 'Chave PIX';
  const clientName = client?.name || event?.client_name || 'Contratante';


  return {
    v: 1,
    emittedAt: todayLocalISO(),
    provider: {
      name: providerName,
      role: categoryLabel,
      subtitle: userSettings?.report_subtitle || '',
      doc: providerDoc,
      phone: profile?.phone || '',
      email: profile?.email || '',
      city: [profile?.city, profile?.state].filter(Boolean).join(' - '),
      categoryId,
    },
    client: {
      name: clientName,
      doc: client?.cnpj || client?.cpf || '',
      contact: [client?.contact_name, client?.phone].filter(Boolean).join(' · '),
    },
    event: {
      title: event?.title || 'Evento',
      startDate: event?.start_date || '',
      endDate: event?.end_date || event?.start_date || '',
      location: [
        event?.location,
        [event?.location_city, event?.location_state].filter(Boolean).join('/'),
      ]
        .filter(Boolean)
        .join(' — '),
      dueDate: event?.payment_due_date || '',
      isPaid: event?.payment_status === 'paid',
      paidAmount: Number(event?.paid_amount) || 0,
      paidAt: event?.paid_at ? String(event.paid_at).slice(0, 10) : '',
      notes: (event?.observacoes_md || event?.description || '').slice(0, 280),
    },
    nfe: {
      number: event?.nfe_numero || event?.nf_number || event?.nfe_analise?.numero_nota || '',
      issuedAt: event?.nf_issued_at || event?.nfe_analise?.data_emissao || '',
      fileName: event?.nfe_arquivo_nome || '',
      fileUrl:
        typeof event?.nfe_arquivo_url === 'string' && event.nfe_arquivo_url.startsWith('http')
          ? event.nfe_arquivo_url
          : '',
    },
    pix: {
      key: pixKey,
      type: pixKeyType,
    },
    closing: {
      totalDiarias: closing.totalDiarias,
      totalAlimentacao: closing.totalAlimentacao,
      totalHoras: closing.totalHoras,
      totalHorasExtrasQtd: closing.totalHorasExtrasQtd,
      totalHorasExtras: closing.totalHorasExtras,
      totalServicos: closing.totalServicos,
      totalReembolsos: closing.totalReembolsos,
      total: closing.total,
      rows: closing.rows.map((r) => ({
        d: r.date,
        in: r.entry || '',
        out: r.exit || '',
        h: r.totalHours || 0,
        he: r.overtimeHours || 0,
        diaria: r.diaria || 0,
        alim: r.alimentacao || 0,
        sub: r.subtotal || 0,
        st: r.status,
      })),
      reembolsos: closing.reembolsaveis.map((e) => ({
        d: e.expense_date || e.date || '',
        c: e.category || 'outros',
        t: String(e.title || e.notes || e.description || 'Despesa').slice(0, 60),
        v: Number(e.amount) || 0,
      })),
    },
  };
}

/**
 * Cria o link seguro no banco (migration 040) e devolve a URL publica com um codigo aleatorio.
 * Nenhum dado pessoal vai na URL; nome do prestador e chave PIX sao gravados pelo servidor
 * a partir do cadastro do usuario.
 */
export async function createClosingShareLink(params, { client: sb, origin = '', dias = 30 } = {}) {
  const supa = sb || (await import('@/lib/supabase')).supabase;
  const data = buildClosingShareData(params);
  const { data: token, error } = await supa.rpc('criar_link_fechamento', {
    p_event_id: params?.event?.id,
    p_snapshot: data,
    p_dias: dias,
  });
  if (error) throw new Error(error.message || 'Nao foi possivel criar o link');
  if (!token) throw new Error('Link nao foi criado');
  const base = origin || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  return `${base}/fechamento?t=${encodeURIComponent(token)}`;
}

/** Busca o fechamento pelo codigo do link (visitante sem login). */
export async function fetchClosingShare(token, { client: sb } = {}) {
  if (!token || String(token).length < 48) return null;
  const supa = sb || (await import('@/lib/supabase')).supabase;
  const { data, error } = await supa.rpc('ver_link_fechamento', { p_token: token });
  if (error) return null;
  return data && typeof data === 'object' && data.closing ? data : null;
}
