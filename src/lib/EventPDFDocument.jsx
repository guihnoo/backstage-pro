import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { buildEventClosing } from './eventClosing';
import { getCategoryLabel } from './categoryConfig';
import { generatePixPayload } from './pixPayload';

// ── Palette (matches the reference PDF) ──────────────────────────────────────
const C = {
  navy:       '#1B4882',
  navyDark:   '#122F5C',
  accent:     '#2563EB',
  white:      '#FFFFFF',
  rowAlt:     '#F2F6FC',
  border:     '#C9D6E8',
  text:       '#1A1A2E',
  muted:      '#6B7280',
  totalBg:    '#EBF3FF',
  pixBg:      '#F0FDF4',
  pixBorder:  '#BBF7D0',
  pixText:    '#14532D',
  nfeBg:      '#EFF6FF',
  nfeBorder:  '#BFDBFE',
  nfeText:    '#1E3A8A',
  red:        '#B91C1C',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(value) {
  // O banco pode devolver valores como texto ("150.50"); converte antes de formatar.
  const parsed = Number(value);
  const n = Number.isFinite(parsed) ? parsed : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

function fmtShortDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    backgroundColor: C.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.navy,
  },
  headerName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.navy, letterSpacing: 1 },
  headerSubtitle: { fontSize: 7.5, color: C.muted, marginTop: 2, letterSpacing: 0.5 },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.navy },
  headerMeta: { fontSize: 8, color: C.muted, marginTop: 3, textAlign: 'right' },

  // Info block (prestador / contratante)
  infoBlock: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
    borderRadius: 3,
  },
  infoCol: { flex: 1, padding: 9 },
  infoColLeft: { borderRightWidth: 1, borderRightColor: C.border },
  infoLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.muted,
    marginBottom: 5,
    letterSpacing: 0.8,
  },
  infoName: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 2 },
  infoDetail: { fontSize: 8, color: C.muted, marginTop: 1 },

  // Section title
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5, marginTop: 12 },
  sectionBar: { width: 3, height: 13, backgroundColor: C.accent, marginRight: 6 },
  sectionTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy },

  // Table
  tHeader: {
    flexDirection: 'row',
    backgroundColor: C.navyDark,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 2,
  },
  tHCell: { color: C.white, fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  tRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  tCell: { fontSize: 8, color: C.text },
  tCellMuted: { fontSize: 8, color: C.muted },

  // Summary
  summaryWrap: { alignItems: 'flex-end', marginTop: 10 },
  summaryBox: { width: 230, borderWidth: 1, borderColor: C.border, borderRadius: 3 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  summaryLabel: { fontSize: 8, color: C.muted },
  summaryVal: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.totalBg,
    borderRadius: 2,
  },
  totalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy },
  totalVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.navy },

  // PIX box
  pixBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.pixBorder,
    borderRadius: 3,
    padding: 10,
    backgroundColor: C.pixBg,
  },
  pixTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.pixText, marginBottom: 4 },
  pixSub: { fontSize: 8, color: C.text, marginBottom: 5 },
  pixKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  pixKeyLabel: { fontSize: 8, color: C.muted },
  pixKeyVal: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: C.text },
  pixPayloadBox: {
    marginTop: 5,
    padding: 6,
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.pixBorder,
    borderRadius: 2,
  },
  pixPayloadLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.pixText, marginBottom: 2 },
  pixPayloadCode: { fontSize: 6.5, fontFamily: 'Courier', color: C.text },

  // NF-e box
  nfeBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: C.nfeBorder,
    borderRadius: 3,
    padding: 9,
    backgroundColor: C.nfeBg,
  },
  nfeTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.nfeText, marginBottom: 3 },
  nfeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 },
  nfeItem: { fontSize: 8, color: C.text },
  nfeItemBold: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.nfeText },

  // Notes box
  notesBox: {
    marginTop: 10,
    borderWidth: 0.75,
    borderColor: C.border,
    borderRadius: 3,
    padding: 8,
    backgroundColor: C.rowAlt,
  },
  notesTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 3 },
  notesText: { fontSize: 8, color: C.text, lineHeight: 1.35 },

  // Page number
  pageNum: {
    position: 'absolute',
    bottom: 16,
    right: 40,
    fontSize: 7,
    color: C.muted,
  },
});

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <View style={s.sectionRow}>
      <View style={s.sectionBar} />
      <Text style={s.sectionTitle}>{children}</Text>
    </View>
  );
}

// ── Seção 1 — Diárias ──────────────────────────────────────────────────────────

const COL1 = [
  { label: 'Data',              flex: 0.55 },
  { label: 'Local',             flex: 1.0  },
  { label: 'Horário Solicitado',flex: 1.5  },
  { label: 'Total Horas',       flex: 0.8  },
  { label: 'H.E.',              flex: 0.5  },
  { label: 'Alimentação',       flex: 0.9  },
  { label: 'Valor Base',        flex: 0.9  },
  { label: 'Subtotal',          flex: 0.9  },
];

function DailyTable({ rows, event }) {
  const totalFlex = COL1.reduce((s, c) => s + c.flex, 0);
  return (
    <View>
      {/* header */}
      <View style={s.tHeader}>
        {COL1.map((c) => (
          <View key={c.label} style={{ flex: c.flex / totalFlex }}>
            <Text style={s.tHCell}>{c.label}</Text>
          </View>
        ))}
      </View>
      {/* rows: todos os dias do evento (fechamento do evento inteiro) */}
      {rows.map((r, i) => {
        const w = r.work;
        let schedule;
        if (!w) schedule = 'Sem horas lançadas (diária)';
        else if (!w.entry_time && !w.exit_time) schedule = 'Deslocamento / Viagem';
        else schedule = `${w.entry_time || ''} às ${w.exit_time || ''}${r.status === 'estimado' ? ' (12 h automáticas)' : ''}`;
        const local = w?.notes && r.status !== 'estimado' ? String(w.notes).substring(0, 22) : (event?.location || '-');
        const heHours = r.overtimeHours ? `${r.overtimeHours}h` : '-';
        const totalH = r.totalHours ? `${r.totalHours}h` : '-';
        const meal = r.alimentacao ? fmt(r.alimentacao) : 'R$ 0,00';
        const rowStyle = [s.tRow, i % 2 === 1 ? { backgroundColor: C.rowAlt } : {}];
        return (
          <View key={r.date || i} style={rowStyle} wrap={false}>
            <View style={{ flex: COL1[0].flex / totalFlex }}><Text style={s.tCell}>{fmtShortDate(r.date)}</Text></View>
            <View style={{ flex: COL1[1].flex / totalFlex }}><Text style={s.tCell}>{local}</Text></View>
            <View style={{ flex: COL1[2].flex / totalFlex }}><Text style={s.tCellMuted}>{schedule}</Text></View>
            <View style={{ flex: COL1[3].flex / totalFlex }}><Text style={s.tCell}>{totalH}</Text></View>
            <View style={{ flex: COL1[4].flex / totalFlex }}><Text style={s.tCell}>{heHours}</Text></View>
            <View style={{ flex: COL1[5].flex / totalFlex }}><Text style={s.tCellMuted}>{meal}</Text></View>
            <View style={{ flex: COL1[6].flex / totalFlex }}><Text style={s.tCell}>{fmt(r.diaria)}</Text></View>
            <View style={{ flex: COL1[7].flex / totalFlex }}><Text style={{ ...s.tCell, fontFamily: 'Helvetica-Bold' }}>{fmt(r.subtotal)}</Text></View>
          </View>
        );
      })}
    </View>
  );
}

// ── Seção 2 — Horas Extras ────────────────────────────────────────────────────

const COL2 = [
  { label: 'Descrição',              flex: 3.0 },
  { label: 'Total de Horas',         flex: 1.0 },
  { label: 'Custo da Hora Base\n(Diária/12)', flex: 1.2 },
  { label: 'Total\nAcumulado',       flex: 1.0 },
];

function OvertimeTable({ closing }) {
  const totalFlex = COL2.reduce((s, c) => s + c.flex, 0);
  // Mesmos números do fechamento: a hora extra já faz parte do valor de cada dia,
  // aqui ela só é detalhada (não é somada de novo).
  const totalOT = closing.totalHorasExtrasQtd;
  const hourCost = closing.valorHora;
  const totalOTValue = closing.totalHorasExtras;
  if (!totalOTValue) return null;

  return (
    <View>
      <View style={s.tHeader}>
        {COL2.map((c) => (
          <View key={c.label} style={{ flex: c.flex / totalFlex }}>
            <Text style={s.tHCell}>{c.label}</Text>
          </View>
        ))}
      </View>
      <View style={[s.tRow]} wrap={false}>
        <View style={{ flex: COL2[0].flex / totalFlex }}>
          <Text style={s.tCell}>Horas extras acima de 12 h por dia (já incluídas no subtotal de cada dia)</Text>
        </View>
        <View style={{ flex: COL2[1].flex / totalFlex }}>
          <Text style={s.tCell}>{totalOT} {totalOT === 1 ? 'hora' : 'horas'}</Text>
        </View>
        <View style={{ flex: COL2[2].flex / totalFlex }}>
          <Text style={s.tCell}>{fmt(hourCost)}</Text>
        </View>
        <View style={{ flex: COL2[3].flex / totalFlex }}>
          <Text style={{ ...s.tCell, fontFamily: 'Helvetica-Bold' }}>{fmt(totalOTValue)}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Seção 3 — Reembolsos ──────────────────────────────────────────────────────

const COL3 = [
  { label: 'Data',      flex: 0.6 },
  { label: 'Categoria', flex: 1.0 },
  { label: 'Descrição do Gasto / Trajeto', flex: 3.5 },
  { label: 'Valor',     flex: 0.9 },
];

const CATEGORY_LABELS = {
  transporte:   'Transporte',
  alimentacao:  'Alimentação',
  hospedagem:   'Hospedagem',
  equipamento:  'Equipamento',
  combustivel:  'Combustível',
  quilometragem: 'Quilometragem',
  manutencao:   'Manutenção',
  passagem:     'Passagem',
  uber:         'Uber',
  outros:       'Outros',
};

function ReimbursementTable({ expenses }) {
  const reimbursable = expenses.filter(e => e.is_reimbursable);
  if (reimbursable.length === 0) return null;
  const totalFlex = COL3.reduce((s, c) => s + c.flex, 0);

  return (
    <View>
      <View style={s.tHeader}>
        {COL3.map((c) => (
          <View key={c.label} style={{ flex: c.flex / totalFlex }}>
            <Text style={s.tHCell}>{c.label}</Text>
          </View>
        ))}
      </View>
      {reimbursable.map((exp, i) => {
        const cat = CATEGORY_LABELS[exp.category] || (exp.category || 'Outros');
        const baseDesc = exp.notes || exp.title || exp.description || '-';
        const hasReceipt = Boolean(exp.receipt_data_url || exp.receipt_url);
        const desc = hasReceipt ? `${baseDesc} (Comprovante anexo)` : baseDesc;
        const rowStyle = [s.tRow, i % 2 === 1 ? { backgroundColor: C.rowAlt } : {}];
        return (
          <View key={exp.id || i} style={rowStyle} wrap={false}>
            <View style={{ flex: COL3[0].flex / totalFlex }}>
              <Text style={s.tCell}>{fmtShortDate(exp.expense_date || exp.date)}</Text>
            </View>
            <View style={{ flex: COL3[1].flex / totalFlex }}>
              <Text style={s.tCell}>{cat}</Text>
            </View>
            <View style={{ flex: COL3[2].flex / totalFlex }}>
              <Text style={s.tCellMuted}>{desc}</Text>
            </View>
            <View style={{ flex: COL3[3].flex / totalFlex }}>
              <Text style={s.tCell}>{fmt(exp.amount || 0)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Document ──────────────────────────────────────────────────────────────────

export function EventPDFDocument({ event, client, work = [], expenses = [], profile = {}, reportSettings = {} }) {
  // Dados completos do prestador
  const prestadorName = reportSettings.report_full_name || profile.name || profile.full_name || 'Prestador';
  const categoryLabel = profile.category_label || (profile.category ? getCategoryLabel(profile.category) : '');
  const profession = reportSettings.report_profession || categoryLabel || '';
  const specialties = Array.isArray(profile.specialties) && profile.specialties.length > 0
    ? profile.specialties.join(' · ')
    : '';
  const subtitle = reportSettings.report_subtitle || profession || '';
  const cityState = [profile.city, profile.state].filter(Boolean).join(' - ');
  const prestadorPhone = reportSettings.phone || profile.phone || '';
  const prestadorEmail = reportSettings.email || profile.email || '';
  const prestadorDoc = reportSettings.cpf_cnpj || profile.cnpj || profile.cpf_cnpj || event?.nfe_analise?.prestador_cnpj || '';
  const pixKey = reportSettings.pix_key || profile.pix_key || '';
  const pixKeyType = reportSettings.pix_key_type || profile.pix_key_type || 'Chave PIX';

  // Dados completos do evento e contratante
  const clientName = client?.name || event?.client_name || 'Contratante';
  const eventTitle = event?.title && event.title !== clientName ? event.title : (event?.title || '');
  const clientDoc = client?.cnpj || client?.cpf || '';
  const clientContact = [client?.contact_name, client?.phone, client?.email].filter(Boolean).join(' · ');
  const locationParts = [
    event?.location,
    [event?.location_city, event?.location_state].filter(Boolean).join('/'),
  ].filter(Boolean);
  const location = locationParts.join(' — ');
  const startDate = event?.start_date ? fmtDate(event.start_date) : '';
  const endDate = event?.end_date && event.end_date !== event.start_date ? fmtDate(event.end_date) : null;
  const periodo = endDate ? `${startDate} a ${endDate}` : startDate;
  const emissao = new Date().toLocaleDateString('pt-BR');
  const dueDate = event?.payment_due_date ? fmtDate(event.payment_due_date) : '';
  const isPaid = event?.payment_status === 'paid';
  const paidDate = event?.paid_at ? fmtDate(String(event.paid_at).slice(0, 10)) : '';
  const eventNotes = (event?.observacoes_md || event?.description || '').trim();

  // Dados Fiscais (NF-e / NFS-e)
  const nfeNumber = event?.nfe_numero || event?.nf_number || event?.nfe_analise?.numero_nota || '';
  const nfeIssuedRaw = event?.nf_issued_at || event?.nfe_analise?.data_emissao || '';
  const nfeIssued = nfeIssuedRaw
    ? (/^\d{4}-\d{2}-\d{2}/.test(String(nfeIssuedRaw)) ? fmtDate(String(nfeIssuedRaw).slice(0, 10)) : String(nfeIssuedRaw))
    : '';
  const nfeFileName = event?.nfe_arquivo_nome || '';
  const nfeIssuer = event?.nfe_analise?.prestador_nome || '';
  const hasNFe = Boolean(nfeNumber || nfeFileName || nfeIssued);

  // Fechamento do evento inteiro (todos os dias, sem somar hora extra duas vezes)
  const closing = buildEventClosing(event, work, expenses);
  const workDays = closing.rows.filter((r) => r.work && (r.work.entry_time || r.work.exit_time)).length
    + closing.semHoras.length;
  const travelDays = closing.rows.filter((r) => r.work && !r.work.entry_time && !r.work.exit_time).length;

  const subtotalDiarias = closing.totalDiarias + closing.totalAlimentacao;
  const totalOT = closing.totalHorasExtrasQtd;
  const subtotalHE = closing.totalHorasExtras;
  const reimbursable = closing.reembolsaveis;
  const subtotalReembolsos = closing.totalReembolsos;
  const totalReceber = closing.total;
  const paidAmountVal = isPaid && Number(event?.paid_amount) > 0 ? Number(event.paid_amount) : totalReceber;

  // Payload PIX Copia e Cola (EMV BACEN)
  const pixPayloadStr = pixKey
    ? generatePixPayload({
        pixKey,
        merchantName: prestadorName,
        merchantCity: profile.city || event?.location_city || 'Brasil',
        amount: totalReceber,
        txId: (event?.title || clientName || 'SHOW').replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***',
      })
    : '';

  const hasHE = subtotalHE > 0;
  const hasReembolsos = reimbursable.length > 0;

  const diariasLabel = travelDays > 0
    ? `${workDays} ${workDays === 1 ? 'dia' : 'dias'} + ${travelDays} ${travelDays === 1 ? 'Viagem' : 'Viagens'}`
    : `${workDays} ${workDays === 1 ? 'dia' : 'dias'}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header} fixed>
          <View>
            <Text style={s.headerName}>{prestadorName.toUpperCase()}</Text>
            {subtitle ? <Text style={s.headerSubtitle}>{subtitle.toUpperCase()}</Text> : null}
            {specialties ? <Text style={s.headerSubtitle}>{specialties}</Text> : null}
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>FECHAMENTO DE SERVIÇOS</Text>
            {periodo ? <Text style={s.headerMeta}>Período do Job: {periodo}</Text> : null}
            <Text style={s.headerMeta}>Data de Emissão: {emissao}</Text>
            {nfeNumber ? <Text style={s.headerMeta}>NF-e / NFS-e Nº: {nfeNumber}</Text> : null}
          </View>
        </View>

        {/* ── Info block (Prestador & Contratante/Evento) ────────────────── */}
        <View style={s.infoBlock}>
          <View style={[s.infoCol, s.infoColLeft]}>
            <Text style={s.infoLabel}>PRESTADOR DE SERVIÇOS:</Text>
            <Text style={s.infoName}>{prestadorName}</Text>
            {profession ? <Text style={s.infoDetail}>Função: {profession}</Text> : null}
            {prestadorDoc ? <Text style={s.infoDetail}>CPF/CNPJ: {prestadorDoc}</Text> : null}
            {prestadorPhone ? <Text style={s.infoDetail}>Tel / WhatsApp: {prestadorPhone}</Text> : null}
            {prestadorEmail ? <Text style={s.infoDetail}>E-mail: {prestadorEmail}</Text> : null}
            {cityState ? <Text style={s.infoDetail}>Base: {cityState}</Text> : null}
          </View>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>CONTRATANTE &amp; EVENTO:</Text>
            <Text style={s.infoName}>{clientName}</Text>
            {eventTitle ? <Text style={s.infoDetail}>Evento: {eventTitle}</Text> : null}
            {clientDoc ? <Text style={s.infoDetail}>CNPJ/CPF: {clientDoc}</Text> : null}
            {clientContact ? <Text style={s.infoDetail}>Contato: {clientContact}</Text> : null}
            {location ? <Text style={s.infoDetail}>Local: {location}</Text> : null}
            {dueDate && !isPaid ? <Text style={s.infoDetail}>Vencimento acordado: {dueDate}</Text> : null}
            {isPaid ? (
              <Text style={{ ...s.infoDetail, color: C.pixText, fontFamily: 'Helvetica-Bold' }}>
                Status: PAGO EM CONTA ({fmt(paidAmountVal)}{paidDate ? ` em ${paidDate}` : ''})
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Seção 1 ───────────────────────────────────────────────────── */}
        {closing.rows.length > 0 && (
          <View>
            <SectionTitle>1. CONTROLE DE DIÁRIAS E HORAS TRABALHADAS</SectionTitle>
            <DailyTable rows={closing.rows} event={event} />
          </View>
        )}

        {/* ── Seção 2 ───────────────────────────────────────────────────── */}
        {hasHE && (
          <View>
            <SectionTitle>2. APURAÇÃO DE HORAS EXTRAS (H.E.)</SectionTitle>
            <OvertimeTable closing={closing} />
          </View>
        )}

        {/* ── Seção 3 ───────────────────────────────────────────────────── */}
        {hasReembolsos && (
          <View>
            <SectionTitle>
              {hasHE ? '3.' : '2.'} LOGÍSTICA E REEMBOLSOS AUTORIZADOS
            </SectionTitle>
            <ReimbursementTable expenses={expenses} />
          </View>
        )}

        {/* ── Observações do Evento (se houver) ─────────────────────────── */}
        {eventNotes ? (
          <View style={s.notesBox} wrap={false}>
            <Text style={s.notesTitle}>OBSERVAÇÕES DO EVENTO / FECHAMENTO:</Text>
            <Text style={s.notesText}>{eventNotes}</Text>
          </View>
        ) : null}

        {/* ── Summary ───────────────────────────────────────────────────── */}
        <View style={s.summaryWrap} wrap={false}>
          <View style={s.summaryBox}>
            {closing.rows.length > 0 && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal Diárias ({diariasLabel}):</Text>
                <Text style={s.summaryVal}>{fmt(subtotalDiarias)}</Text>
              </View>
            )}
            {hasHE && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal Horas Extras ({totalOT}h):</Text>
                <Text style={s.summaryVal}>{fmt(subtotalHE)}</Text>
              </View>
            )}
            {hasReembolsos && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal Reembolsos:</Text>
                <Text style={s.summaryVal}>{fmt(subtotalReembolsos)}</Text>
              </View>
            )}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>{isPaid ? 'VALOR TOTAL FECHADO:' : 'VALOR TOTAL A RECEBER:'}</Text>
              <Text style={s.totalVal}>{fmt(totalReceber)}</Text>
            </View>
          </View>
        </View>

        {/* ── NF-e / Dados Fiscais ──────────────────────────────────────── */}
        {hasNFe ? (
          <View style={s.nfeBox} wrap={false}>
            <Text style={s.nfeTitle}>Documento Fiscal Vinculado (NF-e / NFS-e):</Text>
            <View style={s.nfeRow}>
              {nfeNumber ? (
                <Text style={s.nfeItem}>
                  Número da Nota: <Text style={s.nfeItemBold}>Nº {nfeNumber}</Text>
                </Text>
              ) : null}
              {nfeIssued ? (
                <Text style={s.nfeItem}>
                  Emissão: <Text style={s.nfeItemBold}>{nfeIssued}</Text>
                </Text>
              ) : null}
              {nfeIssuer ? (
                <Text style={s.nfeItem}>
                  Emitente: <Text style={s.nfeItemBold}>{nfeIssuer}</Text>
                </Text>
              ) : null}
              {nfeFileName ? (
                <Text style={s.nfeItem}>
                  Anexo no sistema: <Text style={s.nfeItemBold}>{nfeFileName}</Text>
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── PIX ───────────────────────────────────────────────────────── */}
        {pixKey ? (
          <View style={s.pixBox} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.pixTitle}>Dados Cadastrados para Pagamento (PIX):</Text>
                <Text style={s.pixSub}>
                  Favorecido: {prestadorName}{prestadorDoc ? ` (${prestadorDoc})` : ''} · Valor integral: {fmt(totalReceber)}
                </Text>
                <View style={s.pixKeyRow}>
                  <Text style={s.pixKeyLabel}>{pixKeyType}:</Text>
                  <Text style={s.pixKeyVal}>{pixKey}</Text>
                </View>
                {pixPayloadStr ? (
                  <View style={s.pixPayloadBox}>
                    <Text style={s.pixPayloadLabel}>PIX Copia e Cola (padrão BACEN — copie o código abaixo no app do banco):</Text>
                    <Text style={s.pixPayloadCode}>{pixPayloadStr}</Text>
                  </View>
                ) : null}
              </View>
              {reportSettings.pix_qr_data_url ? (
                <View style={{ alignItems: 'center', backgroundColor: C.white, padding: 5, borderRadius: 3, borderWidth: 0.5, borderColor: C.pixBorder }}>
                  <Image src={reportSettings.pix_qr_data_url} style={{ width: 66, height: 66 }} />
                  <Text style={{ fontSize: 6.2, fontFamily: 'Helvetica-Bold', color: C.pixText, marginTop: 2 }}>
                    QR CODE PIX
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ── Anexo de Comprovantes de Reembolso ───────────────────────── */}
        {(() => {
          const withReceipts = reimbursable.filter((e) => e.receipt_data_url || (typeof e.receipt_url === 'string' && e.receipt_url.startsWith('data:image/')));
          if (withReceipts.length === 0) return null;
          return (
            <View style={{ marginTop: 14 }}>
              <SectionTitle>Comprovantes de Despesas Reembolsáveis</SectionTitle>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {withReceipts.map((exp, idx) => {
                  const imgSrc = exp.receipt_data_url || exp.receipt_url;
                  const cat = CATEGORY_LABELS[exp.category] || (exp.category || 'Outros');
                  const label = exp.title || exp.notes || exp.description || cat;
                  return (
                    <View
                      key={exp.id || idx}
                      wrap={false}
                      style={{
                        width: 150,
                        borderWidth: 0.75,
                        borderColor: C.border,
                        borderRadius: 3,
                        padding: 6,
                        backgroundColor: C.rowAlt,
                      }}
                    >
                      <Image src={imgSrc} style={{ width: 138, height: 110, objectFit: 'contain', backgroundColor: C.white, borderRadius: 2 }} />
                      <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.navy, marginTop: 4 }}>
                        {fmtShortDate(exp.expense_date || exp.date)} · {cat}
                      </Text>
                      <Text style={{ fontSize: 7, color: C.text, marginTop: 1 }}>
                        {String(label).slice(0, 32)}
                      </Text>
                      <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.accent, marginTop: 2 }}>
                        {fmt(exp.amount || 0)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

        {/* ── Page number ───────────────────────────────────────────────── */}
        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
