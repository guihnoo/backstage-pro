import { buildEventClosing } from '@/lib/eventClosing';
import { generatePixPayload } from '@/lib/pixPayload';
import { getCategoryLabel } from '@/lib/categoryConfig';

function toBase64Url(str) {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  );
  return btoa(utf8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64url) {
  const b64 = String(b64url || '').replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const pct = Array.from(bin)
    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
    .join('');
  return decodeURIComponent(pct);
}

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

  const pixPayloadStr = pixKey
    ? generatePixPayload({
        pixKey,
        merchantName: providerName,
        merchantCity: profile?.city || event?.location_city || 'Brasil',
        amount: closing.total,
        txId: (event?.title || clientName || 'SHOW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
      })
    : '';

  return {
    v: 1,
    emittedAt: new Date().toISOString().slice(0, 10),
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
      payload: pixPayloadStr,
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

export function encodeClosingSharePayload(data) {
  return toBase64Url(JSON.stringify(data));
}

export function decodeClosingSharePayload(token) {
  if (!token) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(token));
    if (!parsed || typeof parsed !== 'object' || !parsed.closing) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildClosingShareUrl(params, origin = '') {
  const base =
    origin || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
  const data = buildClosingShareData(params);
  const token = encodeClosingSharePayload(data);
  return `${base}/fechamento?d=${token}`;
}
