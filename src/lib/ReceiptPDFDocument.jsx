import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { getEventCacheAmount } from '@/lib/eventFinance';

const C = {
  navy:    '#1B4882',
  accent:  '#2563EB',
  white:   '#FFFFFF',
  border:  '#C9D6E8',
  text:    '#1A1A2E',
  muted:   '#6B7280',
  rowAlt:  '#F2F6FC',
  green:   '#14532D',
  greenBg: '#F0FDF4',
  greenBd: '#BBF7D0',
  gold:    '#92400E',
  goldBg:  '#FFFBEB',
  goldBd:  '#FDE68A',
};

function fmt(v) {
  const n = typeof v === 'number' && !Number.isNaN(v) ? v : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}
function fmtDate(d) {
  if (!d) return '___/___/______';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtLong(d) {
  if (!d) return '';
  return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function amountInWords(v) {
  // Simple: just return formatted value as "R$ X,XX (VALOR NUMÉRICO)"
  // Full extenso is complex — we show numeric form clearly
  const n = typeof v === 'number' ? v : 0;
  return fmt(n);
}
function recNum() {
  const n = String(Date.now()).slice(-6);
  return `REC-${n}`;
}

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 42, backgroundColor: C.white },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: `2pt solid ${C.navy}` },
  techName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.navy },
  techSub: { fontSize: 8, color: C.muted, marginTop: 2 },
  docLabel: { fontSize: 8, color: C.muted, textAlign: 'right' },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right', marginTop: 2 },
  docNum: { fontSize: 7, color: C.muted, textAlign: 'right', marginTop: 1 },

  // Stamp
  stamp: { alignSelf: 'flex-end', border: `2pt solid ${C.green}`, borderRadius: 4, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 16 },
  stampText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.green, letterSpacing: 1.5 },

  // Declara
  declBox: { backgroundColor: C.greenBg, border: `0.5pt solid ${C.greenBd}`, borderRadius: 3, padding: 14, marginBottom: 14 },
  declText: { fontSize: 10, color: C.green, lineHeight: 1.7, fontFamily: 'Helvetica' },
  declHighlight: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.green },

  // Event details
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingBottom: 3, borderBottom: `0.5pt solid ${C.border}` },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  detailItem: { width: '45%', marginBottom: 6 },
  detailLabel: { fontSize: 7, color: C.muted, marginBottom: 1 },
  detailValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },

  // Payment method
  payRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  payLabel: { fontSize: 8, color: C.muted, width: 90 },
  payValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },

  // Signatures
  sigGrid: { flexDirection: 'row', gap: 30, marginTop: 40 },
  sigBox: { flex: 1 },
  sigLine: { borderTop: `0.75pt solid ${C.text}`, marginBottom: 4 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },
  sigRole: { fontSize: 7, color: C.muted },

  // Footer
  footer: { position: 'absolute', bottom: 24, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 7, color: C.muted },
});

export function ReceiptPDFDocument({ event, client, settings = {} }) {
  const techName = settings.tech_name || settings.name || 'Técnico de Eventos';
  const techDoc  = settings.tech_cpf || settings.tech_cnpj || '';
  const techCity = settings.tech_city || '';
  const pixKey   = settings.pix_key || '';
  const pixType  = settings.pix_key_type || 'PIX';

  const clientName = client?.name || event?.client_name || 'Contratante';
  const clientDoc  = client?.cnpj || client?.cpf || client?.document || '';

  const amount = event?.paid_amount ? Number(event.paid_amount) : getEventCacheAmount(event);

  const paidDateStr  = event?.paid_date ? fmtLong(event.paid_date) : fmtLong(new Date().toISOString().slice(0, 10));
  const eventDateStr = event?.start_date ? fmtDate(event.start_date) : '';
  const eventEndStr  = event?.end_date   ? fmtDate(event.end_date)   : '';
  const venue        = event?.location   || '';
  const city         = event?.location_city || '';
  const rn           = recNum();
  const today        = fmtLong(new Date().toISOString().slice(0, 10));

  return (
    <Document title={`Recibo ${rn}`} author={techName}>
      <Page size="A4" style={s.page}>

        {/* ─── HEADER ─── */}
        <View style={s.header}>
          <View>
            <Text style={s.techName}>{techName}</Text>
            {techDoc  ? <Text style={s.techSub}>{techDoc}</Text>  : null}
            {techCity ? <Text style={s.techSub}>{techCity}</Text> : null}
          </View>
          <View>
            <Text style={s.docLabel}>DOCUMENTO</Text>
            <Text style={s.docTitle}>RECIBO DE PAGAMENTO</Text>
            <Text style={s.docNum}>{rn}</Text>
          </View>
        </View>

        {/* ─── CARIMBO PAGO ─── */}
        <View style={s.stamp}>
          <Text style={s.stampText}>✓  PAGO</Text>
        </View>

        {/* ─── DECLARAÇÃO ─── */}
        <View style={s.declBox}>
          <Text style={s.declText}>
            {'Recebi de '}
            <Text style={s.declHighlight}>{clientName}</Text>
            {clientDoc ? ` (${clientDoc})` : ''}
            {' a quantia de '}
            <Text style={s.declHighlight}>{amountInWords(amount)}</Text>
            {`, referente à prestação de serviços técnicos de eventos conforme descrito abaixo, em plena quitação do débito, sem quaisquer ressalvas.`}
          </Text>
        </View>

        {/* ─── DETALHES DO EVENTO ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Dados do Serviço</Text>
          <View style={s.detailGrid}>
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>EVENTO / SHOW</Text>
              <Text style={s.detailValue}>{event?.title || '—'}</Text>
            </View>
            {eventDateStr ? (
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>DATA DO EVENTO</Text>
                <Text style={s.detailValue}>{eventDateStr}{eventEndStr && eventEndStr !== eventDateStr ? ` a ${eventEndStr}` : ''}</Text>
              </View>
            ) : null}
            {venue ? (
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>LOCAL</Text>
                <Text style={s.detailValue}>{venue}{city ? ` — ${city}` : ''}</Text>
              </View>
            ) : null}
            <View style={s.detailItem}>
              <Text style={s.detailLabel}>DATA DO PAGAMENTO</Text>
              <Text style={s.detailValue}>{paidDateStr}</Text>
            </View>
          </View>
        </View>

        {/* ─── PAGAMENTO ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pagamento</Text>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Valor recebido:</Text>
            <Text style={{ ...s.payValue, fontSize: 13, color: C.green }}>{fmt(amount)}</Text>
          </View>
          {pixKey ? (
            <View style={s.payRow}>
              <Text style={s.payLabel}>Chave {pixType}:</Text>
              <Text style={s.payValue}>{pixKey}</Text>
            </View>
          ) : null}
          <View style={s.payRow}>
            <Text style={s.payLabel}>Forma de pagamento:</Text>
            <Text style={s.payValue}>PIX / Transferência bancária</Text>
          </View>
        </View>

        {/* ─── PARTES ─── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Partes</Text>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Prestador de serviços:</Text>
            <Text style={s.payValue}>{techName}{techDoc ? ` — ${techDoc}` : ''}</Text>
          </View>
          <View style={s.payRow}>
            <Text style={s.payLabel}>Contratante:</Text>
            <Text style={s.payValue}>{clientName}{clientDoc ? ` — ${clientDoc}` : ''}</Text>
          </View>
        </View>

        {/* ─── ASSINATURAS ─── */}
        <View style={s.sigGrid}>
          <View style={s.sigBox}>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{techName}</Text>
            <Text style={s.sigRole}>Prestador de Serviços</Text>
          </View>
          <View style={s.sigBox}>
            <View style={s.sigLine} />
            <Text style={s.sigName}>{clientName}</Text>
            <Text style={s.sigRole}>Contratante</Text>
          </View>
        </View>

        {/* ─── FOOTER ─── */}
        <View style={s.footer}>
          <Text style={s.footerText}>{techCity || ''}</Text>
          <Text style={s.footerText}>{today}</Text>
          <Text style={s.footerText}>{rn}</Text>
        </View>

      </Page>
    </Document>
  );
}
