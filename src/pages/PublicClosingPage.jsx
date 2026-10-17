import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  MapPin,
  Calendar,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Building2,
} from 'lucide-react';
import { fetchClosingShare } from '@/lib/closingShareLink';
import { generatePixQrDataUrl, generatePixPayload } from '@/lib/pixPayload';
import { getCategoryConfig } from '@/lib/categoryConfig';
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

  const categoryConfig = getCategoryConfig(data?.provider?.categoryId || 'lighting');

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
      <div className="min-h-screen bg-[#030712] text-slate-400 flex items-center justify-center p-6">
        Carregando fechamento...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center space-y-3">
          <p className="text-lg font-bold text-white">Demonstrativo de Fechamento</p>
          <p className="text-sm text-slate-400">
            Este link de fechamento é inválido ou está incompleto. Solicite um novo link ou o PDF diretamente ao profissional.
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

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 py-6 px-4 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Cabeçalho do Prestador */}
        <div
          className="rounded-2xl border p-5 sm:p-6 relative overflow-hidden"
          style={{
            borderColor: `${categoryConfig.primaryHex}45`,
            background:
              'linear-gradient(155deg, rgba(15,23,42,0.95) 0%, rgba(7,10,19,0.98) 100%)',
            boxShadow: `0 16px 40px -18px ${categoryConfig.primaryHex}35`,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                style={{
                  color: categoryConfig.primaryHex,
                  borderColor: `${categoryConfig.primaryHex}50`,
                  background: `${categoryConfig.primaryHex}15`,
                }}
              >
                <Sparkles className="w-3 h-3" /> Demonstrativo Oficial de Fechamento
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight pt-1">
                {provider.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">
                {provider.subtitle || provider.role}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 pt-1">
                {provider.doc && <span>CPF/CNPJ: {provider.doc}</span>}
                {provider.phone && <span>Tel/WhatsApp: {provider.phone}</span>}
                {provider.email && <span>{provider.email}</span>}
                {provider.city && <span>{provider.city}</span>}
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-950 transition-transform active:scale-95 shadow-lg"
              style={{ backgroundColor: categoryConfig.primaryHex }}
            >
              <Download className="w-4 h-4" />
              {downloadingPdf ? 'Gerando PDF...' : 'Baixar PDF Completo'}
            </button>
          </div>
        </div>

        {/* Dados do Evento & Contratante */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Contratante · {client.name}
              </p>
              <h2 className="text-lg font-bold text-white mt-0.5">{event.title}</h2>
              {client.doc && <p className="text-xs text-slate-400">CNPJ/CPF: {client.doc}</p>}
            </div>

            {event.isPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
                <ShieldCheck className="w-4 h-4" /> PAGO EM CONTA
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300">
                AGUARDANDO PAGAMENTO INTEGRAL
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300 pt-1 border-t border-slate-800/80">
            {periodLabel && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Período: <strong className="text-white">{periodLabel}</strong></span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">Local: <strong className="text-white">{event.location}</strong></span>
              </div>
            )}
            {event.dueDate && !event.isPaid && (
              <div className="flex items-center gap-2 text-amber-300">
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>Vencimento combinado: <strong>{fmtDate(event.dueDate)}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Documento Fiscal Vinculado (NF-e / NFS-e) */}
        {(nfe?.number || nfe?.fileUrl || nfe?.fileName) && (
          <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Nota Fiscal Vinculada (NF-e / NFS-e)
                </p>
                <p className="text-sm font-semibold text-white">
                  {nfe.number ? `Nota Nº ${nfe.number}` : (nfe.fileName || 'Documento Fiscal Anexado')}
                  {nfe.issuedAt ? ` · Emitida em ${fmtDate(nfe.issuedAt)}` : ''}
                </p>
              </div>
            </div>
            {nfe.fileUrl && (
              <a
                href={nfe.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3.5 py-2 text-xs font-bold text-amber-200 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Abrir / Baixar NF-e
              </a>
            )}
          </div>
        )}

        {/* Detalhamento de Diárias, Horas Extras e Reembolsos */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Resumo Financeiro do Evento
          </h3>

          {Array.isArray(closing.rows) && closing.rows.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-slate-300">Diárias e Horas Trabalhadas</p>
              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/50">
                {closing.rows.map((r, i) => (
                  <div key={r.d || i} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                    <div className="min-w-0">
                      <span className="font-mono font-bold text-white">{fmtShort(r.d)}</span>
                      <span className="text-slate-400 ml-2">
                        {r.st === 'sem_horas'
                          ? 'Diária padrão'
                          : r.in && r.out
                          ? `${r.in} às ${r.out} (${r.h}h${r.he > 0 ? ` · +${r.he}h extra` : ''})`
                          : 'Deslocamento / Viagem'}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-200 shrink-0">
                      {fmtBRL(r.sub)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {Array.isArray(closing.reembolsos) && closing.reembolsos.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-amber-300">Despesas Reembolsáveis</p>
              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/50">
                {closing.reembolsos.map((e, i) => (
                  <div key={i} className="flex items-center justify-between px-3.5 py-2 text-xs">
                    <span className="text-slate-300 truncate">
                      <strong className="font-mono text-slate-400">{fmtShort(e.d)}</strong> · {e.t}
                    </span>
                    <span className="font-mono font-semibold text-amber-300 shrink-0">
                      {fmtBRL(e.v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Diárias / Cachê Base</span>
              <span className="font-mono text-slate-200">
                {fmtBRL((closing.totalDiarias || 0) + (closing.totalAlimentacao || 0))}
              </span>
            </div>
            {closing.totalHorasExtras > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Horas Extras ({closing.totalHorasExtrasQtd}h)</span>
                <span className="font-mono text-slate-200">{fmtBRL(closing.totalHorasExtras)}</span>
              </div>
            )}
            {closing.totalReembolsos > 0 && (
              <div className="flex justify-between text-amber-300/90">
                <span>Total de Reembolsos</span>
                <span className="font-mono">{fmtBRL(closing.totalReembolsos)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-800 text-base font-extrabold text-white">
              <span>VALOR INTEGRAL A RECEBER</span>
              <span className="font-mono text-lg text-emerald-400">{fmtBRL(closing.total)}</span>
            </div>
          </div>
        </div>

        {/* Bloco PIX Interativo (QR Code + Copia e Cola) */}
        {pix?.key && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" /> Pagamento Instantâneo via PIX
                </p>
                <p className="text-xs text-slate-300">
                  Favorecido: <strong className="text-white">{provider.name}</strong>
                  {provider.doc ? ` (${provider.doc})` : ''}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400">{pix.type || 'Chave PIX'}:</span>
                  <code className="text-sm font-mono font-bold text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 truncate">
                    {pix.key}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-semibold text-slate-200 transition-colors shrink-0"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey ? 'Copiada' : 'Copiar Chave'}
                  </button>
                </div>
              </div>

              {qrDataUrl && (
                <div className="flex flex-col items-center bg-white p-2.5 rounded-xl shadow-md shrink-0 self-center">
                  <img src={qrDataUrl} alt="QR Code PIX" className="w-28 h-28" />
                  <span className="text-[10px] font-bold text-emerald-900 mt-1">ESCANEIE NO BANCO</span>
                </div>
              )}
            </div>

            {pixPayload && (
              <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300">
                    PIX Copia e Cola (Valor já preenchido: {fmtBRL(closing.total)})
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixPayload}
                    className="flex-1 rounded-xl bg-slate-950/90 border border-slate-800 px-3 py-2.5 text-[11px] font-mono text-slate-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPayload}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 transition-colors shrink-0"
                  >
                    {copiedPayload ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedPayload ? 'Código PIX Copiado!' : 'Copiar PIX Copia e Cola'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-slate-500 pt-2">
          Gerado via <strong className="text-slate-400">Backstage Pro</strong> · Gestão Financeira para Profissionais de Eventos
        </p>
      </div>
    </div>
  );
}
