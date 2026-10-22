import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Orçamento para a produtora (ideia #111). Dados montados em src/lib/quote.js (buildQuote).

const C = {
  navy: '#1B4882',
  accent: '#2563EB',
  white: '#FFFFFF',
  border: '#C9D6E8',
  text: '#1A1A2E',
  muted: '#6B7280',
  rowAlt: '#F2F6FC',
  goldBg: '#FFFBEB',
  goldBd: '#FDE68A',
  gold: '#92400E',
};

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtDate = (d) => (d ? d.split('-').reverse().join('/') : '');

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 42, backgroundColor: C.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: `2pt solid ${C.navy}` },
  techName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.navy },
  techSub: { fontSize: 8, color: C.muted, marginTop: 2 },
  docLabel: { fontSize: 8, color: C.muted, textAlign: 'right' },
  docTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right', marginTop: 2 },
  docNum: { fontSize: 8, color: C.muted, textAlign: 'right', marginTop: 2 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingBottom: 3, borderBottom: `0.5pt solid ${C.border}` },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { width: '50%', marginBottom: 7, paddingRight: 8 },
  label: { fontSize: 7, color: C.muted, marginBottom: 1 },
  value: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text },
  table: { border: `0.5pt solid ${C.border}`, borderRadius: 3 },
  tr: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 8, borderBottom: `0.5pt solid ${C.border}` },
  trAlt: { backgroundColor: C.rowAlt },
  th: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.muted, textTransform: 'uppercase' },
  td: { fontSize: 9 },
  colDesc: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colUnit: { flex: 1.4, textAlign: 'right' },
  colTotal: { flex: 1.4, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, backgroundColor: C.goldBg, borderTop: `1pt solid ${C.goldBd}` },
  totalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.gold, marginRight: 12 },
  totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: C.gold },
  term: { flexDirection: 'row', marginBottom: 4 },
  bullet: { width: 10, fontSize: 9, color: C.navy },
  termText: { flex: 1, fontSize: 8.5, lineHeight: 1.4 },
  sigBox: { width: '50%', marginTop: 40 },
  sigLine: { borderTop: `0.75pt solid ${C.text}`, marginBottom: 4 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  sigRole: { fontSize: 7, color: C.muted },
  footer: { position: 'absolute', bottom: 24, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7, color: C.muted },
});

export function QuotePDFDocument({ quote }) {
  const { provider, client, service, values, terms } = quote;
  const period = service.endDate && service.endDate !== service.startDate
    ? `${fmtDate(service.startDate)} a ${fmtDate(service.endDate)}`
    : fmtDate(service.startDate);
  const hours = service.startTime ? `${service.startTime}${service.endTime ? ` às ${service.endTime}` : ''}` : '';

  return (
    <Document title={`Orçamento ${quote.number}`} author={provider.name}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.techName}>{provider.name}</Text>
            {provider.subtitle ? <Text style={s.techSub}>{provider.subtitle}</Text> : null}
            {provider.doc ? <Text style={s.techSub}>{provider.doc}</Text> : null}
            {provider.phone || provider.city ? <Text style={s.techSub}>{[provider.phone, provider.city].filter(Boolean).join(' · ')}</Text> : null}
          </View>
          <View>
            <Text style={s.docLabel}>PROPOSTA DE SERVIÇO</Text>
            <Text style={s.docTitle}>ORÇAMENTO</Text>
            <Text style={s.docNum}>{quote.number}</Text>
            <Text style={s.docNum}>Emitido em {fmtDate(quote.issuedAt)} · válido até {fmtDate(quote.validUntil)}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Para</Text>
          <View style={s.grid}>
            <View style={s.item}>
              <Text style={s.label}>CONTRATANTE</Text>
              <Text style={s.value}>{client.name}</Text>
              {client.company ? <Text style={{ fontSize: 8, color: C.muted }}>{client.company}</Text> : null}
            </View>
            {client.phone || client.email ? (
              <View style={s.item}>
                <Text style={s.label}>CONTATO</Text>
                <Text style={s.value}>{[client.phone, client.email].filter(Boolean).join(' · ')}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Serviço</Text>
          <View style={s.grid}>
            <View style={s.item}>
              <Text style={s.label}>EVENTO</Text>
              <Text style={s.value}>{service.title}</Text>
            </View>
            <View style={s.item}>
              <Text style={s.label}>FUNÇÃO</Text>
              <Text style={s.value}>{service.functionLabel}</Text>
            </View>
            {period ? (
              <View style={s.item}>
                <Text style={s.label}>DATA</Text>
                <Text style={s.value}>{period}</Text>
              </View>
            ) : null}
            {hours ? (
              <View style={s.item}>
                <Text style={s.label}>HORÁRIO</Text>
                <Text style={s.value}>{hours}</Text>
              </View>
            ) : null}
            {service.location || service.city ? (
              <View style={{ ...s.item, width: '100%' }}>
                <Text style={s.label}>LOCAL</Text>
                <Text style={s.value}>{[service.location, service.city].filter(Boolean).join(' — ')}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Valores</Text>
          <View style={s.table}>
            <View style={s.tr}>
              <Text style={[s.th, s.colDesc]}>Descrição</Text>
              <Text style={[s.th, s.colQty]}>Diárias</Text>
              <Text style={[s.th, s.colUnit]}>Valor da diária</Text>
              <Text style={[s.th, s.colTotal]}>Total</Text>
            </View>
            <View style={[s.tr, s.trAlt]}>
              <Text style={[s.td, s.colDesc]}>{service.functionLabel} — {service.title}</Text>
              <Text style={[s.td, s.colQty]}>{values.days}</Text>
              <Text style={[s.td, s.colUnit]}>{fmt(values.dailyRate)}</Text>
              <Text style={[s.td, s.colTotal]}>{fmt(values.total)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TOTAL</Text>
              <Text style={s.totalValue}>{fmt(values.total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Condições</Text>
          {terms.map((t, i) => (
            <View key={i} style={s.term}>
              <Text style={s.bullet}>•</Text>
              <Text style={s.termText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={s.sigBox}>
          <View style={s.sigLine} />
          <Text style={s.sigName}>{provider.name}</Text>
          <Text style={s.sigRole}>Prestador de serviços</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>{quote.number}</Text>
          <Text style={s.footerText}>Gerado pelo Backstage Pro</Text>
        </View>
      </Page>
    </Document>
  );
}
