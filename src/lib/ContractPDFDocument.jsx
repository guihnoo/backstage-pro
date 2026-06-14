import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: C.text, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 42, backgroundColor: C.white },
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 14, borderBottom: `2pt solid ${C.navy}` },
  techName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.navy },
  techSub: { fontSize: 8, color: C.muted, marginTop: 2 },
  docLabel: { fontSize: 8, color: C.muted, textAlign: 'right' },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.accent, textAlign: 'right', marginTop: 2 },
  docNum: { fontSize: 7, color: C.muted, textAlign: 'right', marginTop: 1 },
  // Sections
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, paddingBottom: 3, borderBottom: `0.5pt solid ${C.border}` },
  // Party grid
  partyGrid: { flexDirection: 'row', gap: 12 },
  partyBox: { flex: 1, backgroundColor: C.rowAlt, borderRadius: 3, padding: 8, border: `0.5pt solid ${C.border}` },
  partyRole: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.accent, marginBottom: 3, textTransform: 'uppercase' },
  partyName: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.text, marginBottom: 2 },
  partyLine: { fontSize: 8, color: C.muted },
  // Event box
  eventBox: { backgroundColor: C.rowAlt, borderRadius: 3, padding: 10, border: `0.5pt solid ${C.border}`, marginBottom: 0 },
  eventTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 6 },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eventItem: { width: '45%' },
  eventLabel: { fontSize: 7, color: C.muted, marginBottom: 1 },
  eventValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },
  // Payment box
  paymentBox: { backgroundColor: C.greenBg, borderRadius: 3, padding: 10, border: `0.5pt solid ${C.greenBd}` },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  paymentLabel: { fontSize: 8, color: C.green },
  paymentValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.green },
  pixRow: { marginTop: 4, paddingTop: 4, borderTop: `0.5pt solid ${C.greenBd}` },
  pixLabel: { fontSize: 7, color: C.green, marginBottom: 1 },
  pixKey: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.green },
  // Clauses
  clauseItem: { marginBottom: 6 },
  clauseNum: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.navy, marginBottom: 1 },
  clauseText: { fontSize: 8, color: C.text, lineHeight: 1.5 },
  // Signatures
  sigGrid: { flexDirection: 'row', gap: 20, marginTop: 4 },
  sigBox: { flex: 1 },
  sigLine: { borderTop: `0.5pt solid ${C.text}`, marginBottom: 4, marginTop: 32 },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.text },
  sigRole: { fontSize: 7, color: C.muted },
  // Footer
  footer: { position: 'absolute', bottom: 20, left: 42, right: 42, flexDirection: 'row', justifyContent: 'space-between', borderTop: `0.5pt solid ${C.border}`, paddingTop: 6 },
  footerText: { fontSize: 7, color: C.muted },
});

export function ContractPDFDocument({ event, client, settings = {} }) {
  const {
    report_full_name: techName,
    report_subtitle: techSubtitle,
    pix_key: pixKey,
    pix_key_type: pixKeyType,
    contract_clauses: extraClauses,
  } = settings;

  const displayName = techName || 'Profissional Técnico';
  const amount = event?.cache_value ?? event?.cache_diaria ?? 0;
  const startDate = fmtDate(event?.start_date);
  const endDate = event?.end_date && event.end_date !== event.start_date ? fmtDate(event.end_date) : null;
  const datePeriod = endDate ? `${startDate} a ${endDate}` : startDate;
  const contractDate = fmtLong(new Date().toISOString().slice(0, 10));
  const docNum = `CTR-${Date.now().toString().slice(-6)}`;

  const defaultClauses = [
    {
      num: '1. OBJETO',
      text: `O CONTRATADO obriga-se a prestar serviços técnicos de ${event?.category || 'áudio/iluminação/produção'} para o evento "${event?.title || 'Evento'}", conforme especificações acordadas entre as partes.`,
    },
    {
      num: '2. PRAZO E LOCAL',
      text: `Os serviços serão prestados em ${datePeriod}${event?.location ? `, no endereço: ${event.location}` : ''}. O CONTRATADO se compromete a estar presente com antecedência necessária para montagem e testes.`,
    },
    {
      num: '3. REMUNERAÇÃO',
      text: `Pelo serviço prestado, o CONTRATANTE pagará ao CONTRATADO o valor de ${fmt(amount)}${event?.payment_due_date ? `, com vencimento em ${fmtDate(event.payment_due_date)}` : ', na data acordada entre as partes'}. O não pagamento no prazo acarretará multa de 2% ao mês.`,
    },
    {
      num: '4. CANCELAMENTO',
      text: 'Em caso de cancelamento pelo CONTRATANTE com menos de 72 horas de antecedência, será devida multa de 50% do valor contratado. Cancelamentos com aviso prévio superior a 72 horas ficam isentos de multa.',
    },
    {
      num: '5. EQUIPAMENTOS',
      text: 'Os equipamentos necessários para a prestação dos serviços serão de responsabilidade do CONTRATADO, salvo especificação contrária previamente acordada por escrito. Danos causados por terceiros ao equipamento do CONTRATADO serão de responsabilidade do CONTRATANTE.',
    },
    {
      num: '6. IMAGEM',
      text: 'O CONTRATANTE autoriza o CONTRATADO a utilizar fotos e vídeos do evento para fins de portfólio e divulgação profissional, desde que não exponha informações sigilosas do CONTRATANTE.',
    },
  ];

  const clauses = extraClauses?.length ? extraClauses : defaultClauses;

  return (
    <Document title={`Contrato — ${event?.title || 'Evento'}`} author={displayName}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.techName}>{displayName}</Text>
            {techSubtitle && <Text style={s.techSub}>{techSubtitle}</Text>}
          </View>
          <View>
            <Text style={s.docLabel}>DOCUMENTO</Text>
            <Text style={s.docTitle}>CONTRATO DE SERVIÇOS</Text>
            <Text style={s.docNum}>Nº {docNum} · Emitido em {contractDate}</Text>
          </View>
        </View>

        {/* Partes */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Das Partes</Text>
          <View style={s.partyGrid}>
            <View style={s.partyBox}>
              <Text style={s.partyRole}>Contratado (Prestador)</Text>
              <Text style={s.partyName}>{displayName}</Text>
              {techSubtitle && <Text style={s.partyLine}>{techSubtitle}</Text>}
            </View>
            <View style={s.partyBox}>
              <Text style={s.partyRole}>Contratante (Cliente)</Text>
              <Text style={s.partyName}>{client?.name || '________________________________'}</Text>
              {client?.email && <Text style={s.partyLine}>{client.email}</Text>}
              {client?.phone && <Text style={s.partyLine}>{client.phone}</Text>}
              {client?.document && <Text style={s.partyLine}>Doc: {client.document}</Text>}
            </View>
          </View>
        </View>

        {/* Evento */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Do Evento</Text>
          <View style={s.eventBox}>
            <Text style={s.eventTitle}>{event?.title || 'Evento'}</Text>
            <View style={s.eventGrid}>
              <View style={s.eventItem}>
                <Text style={s.eventLabel}>Data</Text>
                <Text style={s.eventValue}>{datePeriod}</Text>
              </View>
              {(event?.start_time) && (
                <View style={s.eventItem}>
                  <Text style={s.eventLabel}>Horário</Text>
                  <Text style={s.eventValue}>{event.start_time.slice(0, 5)}{event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''}</Text>
                </View>
              )}
              {event?.location && (
                <View style={s.eventItem}>
                  <Text style={s.eventLabel}>Local</Text>
                  <Text style={s.eventValue}>{event.location}</Text>
                </View>
              )}
              {event?.location_city && (
                <View style={s.eventItem}>
                  <Text style={s.eventLabel}>Cidade</Text>
                  <Text style={s.eventValue}>{event.location_city}{event.location_state ? ` – ${event.location_state}` : ''}</Text>
                </View>
              )}
              {event?.category && (
                <View style={s.eventItem}>
                  <Text style={s.eventLabel}>Tipo de Serviço</Text>
                  <Text style={s.eventValue}>{event.category}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Pagamento */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Do Pagamento</Text>
          <View style={s.paymentBox}>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Valor Total dos Serviços</Text>
              <Text style={s.paymentValue}>{fmt(amount)}</Text>
            </View>
            {event?.payment_due_date && (
              <View style={s.paymentRow}>
                <Text style={s.paymentLabel}>Vencimento</Text>
                <Text style={[s.paymentLabel, { fontFamily: 'Helvetica-Bold' }]}>{fmtDate(event.payment_due_date)}</Text>
              </View>
            )}
            {pixKey && (
              <View style={s.pixRow}>
                <Text style={s.pixLabel}>Chave PIX para pagamento:</Text>
                <Text style={s.pixKey}>{pixKeyType ? `${pixKeyType}: ` : ''}{pixKey}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Cláusulas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Das Cláusulas</Text>
          {clauses.map((c, i) => (
            <View key={i} style={s.clauseItem}>
              <Text style={s.clauseNum}>{c.num}</Text>
              <Text style={s.clauseText}>{c.text}</Text>
            </View>
          ))}
        </View>

        {/* Assinaturas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Assinaturas</Text>
          <Text style={[s.clauseText, { marginBottom: 4 }]}>
            {`Por estarem de acordo com os termos estabelecidos, as partes assinam o presente contrato em 2 (duas) vias de igual teor, na cidade de ${event?.location_city || '________________'}, em ${contractDate}.`}
          </Text>
          <View style={s.sigGrid}>
            <View style={s.sigBox}>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{displayName}</Text>
              <Text style={s.sigRole}>Contratado</Text>
            </View>
            <View style={s.sigBox}>
              <View style={s.sigLine} />
              <Text style={s.sigName}>{client?.name || '________________________________'}</Text>
              <Text style={s.sigRole}>Contratante</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{displayName} · Contrato de Serviços Técnicos</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
