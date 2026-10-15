import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { buildEventClosing } from './eventClosing';

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
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.pixBorder,
    borderRadius: 3,
    padding: 10,
    backgroundColor: C.pixBg,
  },
  pixTitle: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.pixText, marginBottom: 4 },
  pixSub: { fontSize: 8, color: C.text, marginBottom: 4 },
  pixKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pixKeyLabel: { fontSize: 8, color: C.muted },
  pixKeyVal: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.text },

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
        const desc = exp.notes || exp.title || exp.description || '-';
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
  // Dados do prestador
  const prestadorName = reportSettings.report_full_name || profile.name || 'Prestador';
  const subtitle = reportSettings.report_subtitle || '';
  const profession = reportSettings.report_profession || profile.category || '';
  const cityState = [profile.city, profile.state].filter(Boolean).join(' - ');
  const pixKey = reportSettings.pix_key || '';
  const pixKeyType = reportSettings.pix_key_type || 'Chave PIX';

  // Dados do evento
  const clientName = client?.name || event?.client_name || 'Contratante';
  const location = event?.location || '';
  const startDate = event?.start_date ? fmtDate(event.start_date) : '';
  const endDate = event?.end_date && event.end_date !== event.start_date ? fmtDate(event.end_date) : null;
  const periodo = endDate ? `${startDate} a ${endDate}` : startDate;
  const emissao = new Date().toLocaleDateString('pt-BR');

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
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>FECHAMENTO DE SERVIÇOS</Text>
            {periodo ? <Text style={s.headerMeta}>Período do Job: {periodo}</Text> : null}
            <Text style={s.headerMeta}>Data de Emissão: {emissao}</Text>
          </View>
        </View>

        {/* ── Info block ─────────────────────────────────────────────────── */}
        <View style={s.infoBlock}>
          <View style={[s.infoCol, s.infoColLeft]}>
            <Text style={s.infoLabel}>PRESTADOR:</Text>
            <Text style={s.infoName}>{prestadorName}</Text>
            {cityState ? <Text style={s.infoDetail}>{cityState}</Text> : null}
            {profession ? <Text style={s.infoDetail}>{profession}</Text> : null}
          </View>
          <View style={s.infoCol}>
            <Text style={s.infoLabel}>CONTRATANTE:</Text>
            <Text style={s.infoName}>{clientName}</Text>
            {location ? <Text style={s.infoDetail}>{location}</Text> : null}
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

        {/* ── Summary ───────────────────────────────────────────────────── */}
        <View style={s.summaryWrap}>
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
              <Text style={s.totalLabel}>VALOR TOTAL A RECEBER:</Text>
              <Text style={s.totalVal}>{fmt(totalReceber)}</Text>
            </View>
          </View>
        </View>

        {/* ── PIX ───────────────────────────────────────────────────────── */}
        {pixKey ? (
          <View style={s.pixBox}>
            <Text style={s.pixTitle}>Dados Cadastrados para Pagamento:</Text>
            <Text style={s.pixSub}>Favor efetuar o depósito do valor total para a chave informada abaixo.</Text>
            <View style={s.pixKeyRow}>
              <Text style={s.pixKeyLabel}>{pixKeyType} ({pixKeyType}):</Text>
              <Text style={s.pixKeyVal}>{pixKey}</Text>
            </View>
          </View>
        ) : null}

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
