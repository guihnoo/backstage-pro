import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Copy, Download, ExternalLink } from 'lucide-react';
import { fetchClosingShare, notifyClosingPaid } from '@/lib/closingShareLink';
import { generatePixQrDataUrl, generatePixPayload } from '@/lib/pixPayload';
import appToast from '@/lib/appToast';

const fmtBRL = (v) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (iso) => {
  if (!iso) return '';
  const clean = String(iso).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return String(iso);
  const [y, m, d] = clean.split('-');
  return `${d}/${m}/${y}`;
};

const fmtShort = (iso) => {
  if (!iso) return '';
  const clean = String(iso).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return String(iso);
  const [, m, d] = clean.split('-');
  return `${d}/${m}`;
};

export default function PublicClosingPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') || '';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    if (!token) { setLoading(false); return undefined; }
    fetchClosingShare(token).then((d) => {
      if (!active) return;
      setData(d);
      setLoading(false);
    });
    return () => { active = false; };
  }, [token]);

  // PIX copia e cola gerado aqui, a partir da chave gravada pelo servidor (nunca vem pronto no link).
  const pixPayload = useMemo(() => {
    if (!data?.pix?.key) return '';
    try {
      return generatePixPayload({
        pixKey: data.pix.key,
        merchantName: data.provider?.name || 'Prestador',
        merchantCity: (data.provider?.city || 'Brasil').split(' - ')[0] || 'Brasil',
        amount: data.closing?.total || 0,
        txId: (data.event?.title || 'SHOW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
      }) || '';
    } catch {
      return '';
    }
  }, [data]);

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [noticeSent, setNoticeSent] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);

  useEffect(() => {
    let active = true;
    if (data?.pix?.key) {
      generatePixQrDataUrl({
        pixKey: data.pix.key,
        merchantName: data.provider?.name || 'Prestador',
        merchantCity: (data.provider?.city || 'Brasil').split(' - ')[0] || 'Brasil',
        amount: data.closing?.total || 0,
        txId: (data.event?.title || 'SHOW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
      }).then((url) => {
        if (active && url) setQrDataUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] text-[#6a6a6a] font-tag text-xs flex items-center justify-center p-6">
        CARREGANDO FECHAMENTO...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] text-[#111111] font-sans flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-[14px] bg-white border border-[#e3ddd0] p-6 text-center space-y-3">
          <p className="font-poster text-[26px] leading-none">FECHAMENTO DE SERVIÇO</p>
          <p className="text-sm text-[#4a4a4a]">
            Este link de fechamento é inválido, venceu ou foi cancelado. Peça um novo link ou o PDF diretamente ao profissional.
          </p>
        </div>
      </div>
    );
  }

  const { provider, client, event, nfe, pix, closing } = data;
  const periodLabel =
    event.endDate && event.endDate !== event.startDate
      ? `${fmtDate(event.startDate)} a ${fmtDate(event.endDate)}`
      : fmtDate(event.startDate);

  const handleCopyPayload = async () => {
    if (!pixPayload) return;
    await navigator.clipboard?.writeText(pixPayload);
    setCopiedPayload(true);
    appToast.success('PIX Copia e Cola copiado!', {
      description: 'Abra o app do banco e escolha PIX Copia e Cola.',
    });
    setTimeout(() => setCopiedPayload(false), 3000);
  };

  const handleCopyKey = async () => {
    if (!pix?.key) return;
    await navigator.clipboard?.writeText(pix.key);
    setCopiedKey(true);
    appToast.success('Chave PIX copiada!');
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleMarkPaid = async () => {
    if (sendingNotice || noticeSent) return;
    setSendingNotice(true);
    const ok = await notifyClosingPaid(token);
    setSendingNotice(false);
    if (ok) {
      setNoticeSent(true);
    } else {
      appToast.error('Não foi possível enviar o aviso', { description: 'O link pode ter vencido. Fale direto com o profissional.' });
    }
  };

  const handleDownloadPdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { EventPDFDocument } = await import('@/lib/EventPDFDocument');

      const syntheticEvent = {
        title: event.title,
        client_name: client.name,
        start_date: event.startDate,
        end_date: event.endDate,
        location: event.location,
        payment_due_date: event.dueDate,
        payment_status: event.isPaid ? 'paid' : 'pending',
        paid_amount: event.paidAmount,
        paid_at: event.paidAt,
        observacoes_md: event.notes,
        nfe_numero: nfe?.number,
        nf_number: nfe?.number,
        nf_issued_at: nfe?.issuedAt,
        nfe_arquivo_nome: nfe?.fileName,
        cache: closing.totalDiarias,
        daily_rate: closing.rows?.[0]?.diaria || closing.totalDiarias,
      };

      const syntheticWork = (closing.rows || [])
        .filter((r) => r.st !== 'sem_horas')
        .map((r) => ({
          work_date: r.d,
          entry_time: r.in,
          exit_time: r.out,
          total_hours: r.h,
          overtime_hours: r.he,
          daily_rate: r.diaria,
          meal_allowance: r.alim,
          total_value: r.sub,
          hours_origin: r.st === 'estimado' ? 'auto_12h' : 'manual',
        }));

      const syntheticExpenses = (closing.reembolsos || []).map((e, idx) => ({
        id: `reimb-${idx}`,
        expense_date: e.d,
        category: e.c,
        title: e.t,
        notes: e.t,
        amount: e.v,
        is_reimbursable: true,
      }));

      const blob = await pdf(
        <EventPDFDocument
          event={syntheticEvent}
          client={{ name: client.name, cnpj: client.doc, contact_name: client.contact }}
          work={syntheticWork}
          expenses={syntheticExpenses}
          profile={{
            name: provider.name,
            category: provider.categoryId,
            category_label: provider.role,
            phone: provider.phone,
            email: provider.email,
            city: provider.city,
          }}
          reportSettings={{
            report_full_name: provider.name,
            report_subtitle: provider.subtitle || provider.role,
            report_profession: provider.role,
            cpf_cnpj: provider.doc,
            phone: provider.phone,
            email: provider.email,
            pix_key: pix?.key,
            pix_key_type: pix?.type || 'Chave PIX',
            pix_qr_data_url: qrDataUrl || null,
          }}
        />
      ).toBlob();

      const slug = (client.name || event.title || 'Evento').replace(/\s+/g, '_').slice(0, 20);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fechamento_${slug}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      appToast.success('PDF de Fechamento baixado!');
    } catch (err) {
      appToast.error('Não foi possível gerar o PDF', { description: err.message });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const initial = (provider.name || 'P').trim().charAt(0).toUpperCase();
  const clientInitials = (client.name || 'C').trim().slice(0, 4).toUpperCase();
  const alreadyNotified = noticeSent || Boolean(data.clientNoticeAt);
  const expiresLabel = data.expiresAt ? fmtDate(String(data.expiresAt).slice(0, 10)) : '';
  const rows = Array.isArray(closing.rows) ? closing.rows : [];
  const reembolsos = Array.isArray(closing.reembolsos) ? closing.reembolsos : [];

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#111111] font-sans">
      <div className="max-w-xl mx-auto bg-[#f4f1ea] min-h-screen flex flex-col">
        {/* Cabeçalho do prestador */}
        <div className="bg-[#0a0a0a] text-white px-[18px] pt-4 pb-3.5">
          <div className="flex items-center justify-between">
            <span className="font-tag text-[10px] tracking-[2px] text-[#ffd400]">FECHAMENTO DE SERVIÇO</span>
            {event.isPaid && <span className="font-tag text-[10px] text-[#a8a8a8]">PAGO</span>}
          </div>
          <div className="flex items-center gap-3 mt-2.5">
            <div className="w-[52px] h-[52px] rounded-xl bg-[#ffd400] text-[#0a0a0a] flex items-center justify-center font-poster text-2xl shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="font-poster text-[26px] leading-none uppercase break-words">{provider.name}</div>
              <div className="text-xs text-[#c8c8c8]">{provider.subtitle || provider.role}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#a8a8a8] mt-2.5">
            {provider.doc && <span>CPF/CNPJ: {provider.doc}</span>}
            {provider.phone && <span>{provider.phone}</span>}
            {provider.email && <span>{provider.email}</span>}
            {provider.city && <span>{provider.city}</span>}
          </div>
        </div>
        <div
          className="h-1.5"
          style={{ background: 'repeating-linear-gradient(90deg, #ffd400 0 18px, #0a0a0a 18px 24px)' }}
        />

        <div className="flex-1 px-[18px] py-3.5 flex flex-col gap-2.5">
          {/* Contratante */}
          <div className="flex gap-2.5 items-center">
            <div className="w-10 h-10 rounded-[10px] bg-white border border-[#ddd8cc] flex items-center justify-center font-tag text-[9px] font-bold shrink-0">
              {clientInitials}
            </div>
            <div className="min-w-0">
              <div className="font-tag text-[10px] text-[#6a6a6a]">PARA</div>
              <div className="text-base font-extrabold break-words">{client.name}</div>
              {client.doc && <div className="text-[11px] text-[#6a6a6a]">CNPJ/CPF: {client.doc}</div>}
            </div>
          </div>

          {/* Evento e valores */}
          <div className="rounded-[14px] bg-white border border-[#e3ddd0] p-3">
            <div className="text-[15px] font-extrabold">{event.title}</div>
            <div className="text-xs text-[#6a6a6a] mb-1.5">
              {[event.location, periodLabel].filter(Boolean).join(' · ')}
            </div>

            {rows.map((r, i) => (
              <div key={r.d || i} className="flex justify-between gap-3 py-1.5 border-t border-[#efeae0] text-[13px]">
                <span className="min-w-0">
                  <span className="font-tag font-bold">{fmtShort(r.d)}</span>{' '}
                  <span className="text-[#8a8a8a] text-[11px]">
                    {r.st === 'sem_horas'
                      ? 'diária'
                      : r.in && r.out
                      ? `${r.in} às ${r.out} (${r.h}h${r.he > 0 ? ` · +${r.he}h extra` : ''})`
                      : 'deslocamento'}
                  </span>
                </span>
                <span className="font-tag font-bold shrink-0">{fmtBRL(r.sub)}</span>
              </div>
            ))}

            {reembolsos.map((e, i) => (
              <div key={`r${i}`} className="flex justify-between gap-3 py-1.5 border-t border-[#efeae0] text-[13px]">
                <span className="min-w-0 truncate">
                  Reembolso <span className="text-[#8a8a8a] text-[11px]">{fmtShort(e.d)} · {e.t}</span>
                </span>
                <span className="font-tag font-bold shrink-0">{fmtBRL(e.v)}</span>
              </div>
            ))}

            <div className="flex justify-between items-baseline pt-2 border-t-2 border-[#111111] mt-1">
              <span className="font-tag text-[11px] font-bold">TOTAL</span>
              <span className="font-poster text-[34px] leading-none">{fmtBRL(closing.total)}</span>
            </div>
            {event.dueDate && !event.isPaid && (
              <div className="text-[11px] text-[#6a6a6a] mt-1.5">Vencimento combinado: <b>{fmtDate(event.dueDate)}</b></div>
            )}
          </div>

          {/* Pagamento */}
          {event.isPaid ? (
            <div className="rounded-[14px] border-2 border-[#111111] p-3.5 text-center">
              <div className="font-poster text-[26px] leading-none">PAGO ✓</div>
              <div className="text-[13px] text-[#4a4a4a] mt-1">
                {event.paidAt ? `Recebido em ${fmtDate(event.paidAt)}.` : 'Pagamento confirmado.'}
              </div>
            </div>
          ) : (
            pix?.key && (
              <div className="rounded-[14px] bg-[#0a0a0a] text-white p-3 flex flex-col gap-2">
                <div className="font-tag text-[10px] tracking-[1px] text-[#ffd400]">PAGAR COM PIX</div>
                <div className="flex gap-2.5 items-center">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt="QR Code PIX" className="w-[84px] h-[84px] rounded-lg bg-white p-1.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#c8c8c8]">Chave ({pix.type || 'PIX'})</div>
                    <div className="text-[13px] font-extrabold break-all">{pix.key}</div>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#ffd400]"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedKey ? 'Chave copiada' : 'Copiar chave'}
                    </button>
                  </div>
                </div>
                {pixPayload && (
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="h-[46px] rounded-full bg-[#ffd400] text-[#0a0a0a] text-sm font-extrabold active:scale-[0.98] transition-transform"
                  >
                    {copiedPayload ? 'Copiado ✓' : 'Copiar código PIX (valor já preenchido)'}
                  </button>
                )}
                {alreadyNotified ? (
                  <div className="rounded-[14px] border border-[#444444] p-2.5 text-center">
                    <div className="font-poster text-xl leading-none">AVISO ENVIADO ✓</div>
                    <div className="text-xs text-[#c8c8c8] mt-1">
                      {provider.name} recebe o aviso e confirma quando o dinheiro cair.
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={sendingNotice}
                    className="h-10 rounded-full border border-[#444444] bg-transparent text-white text-[13px] font-bold disabled:opacity-60"
                  >
                    {sendingNotice ? 'Enviando...' : `Já paguei · avisar ${String(provider.name || '').split(' ')[0] || 'o profissional'}`}
                  </button>
                )}
              </div>
            )
          )}

          {/* Nota fiscal e PDF */}
          <div className="flex justify-between items-center gap-3 text-xs">
            <span className="text-[#4a4a4a] min-w-0">
              {nfe?.number || nfe?.fileUrl || nfe?.fileName ? (
                <>
                  Nota fiscal: <b>{nfe.number ? `Nº ${nfe.number}` : 'anexada'}</b>
                  {nfe.issuedAt ? ` · ${fmtDate(nfe.issuedAt)}` : ''}
                  {nfe.fileUrl && (
                    <>
                      {' '}
                      <a href={nfe.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-extrabold underline">
                        abrir <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  )}
                </>
              ) : (
                'Nota fiscal: não anexada'
              )}
            </span>
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-1 font-extrabold underline shrink-0 disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {downloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>
          </div>

          <div className="mt-auto pt-3 text-center font-tag text-[9px] text-[#8a8a8a]">
            gerado com BACKSTAGE PRO{expiresLabel ? ` · link válido até ${expiresLabel}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}
