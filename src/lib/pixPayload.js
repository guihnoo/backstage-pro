/**
 * Gerador de payload PIX "Copia e Cola" — padrão EMV QR Code (BACEN).
 * Compatível com todos os bancos brasileiros.
 */

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(id, value) {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Normaliza texto para campos do PIX (sem acentos, máx 25 chars).
 */
function normalizeField(str = '', maxLen = 25) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen)
    || 'N/A';
}

/**
 * Gera o payload PIX "Copia e Cola".
 *
 * @param {object} opts
 * @param {string}  opts.pixKey       — Chave PIX (CPF, CNPJ, e-mail, telefone, chave aleatória)
 * @param {string}  [opts.merchantName] — Nome do recebedor (para o QR)
 * @param {string}  [opts.merchantCity] — Cidade do recebedor
 * @param {number}  [opts.amount]      — Valor em R$ (0 ou omitido = sem valor fixo)
 * @param {string}  [opts.txId]        — Identificador da transação (max 25 chars alfanumérico)
 * @returns {string} Payload PIX pronto para copiar e colar
 */
export function generatePixPayload({
  pixKey,
  merchantName = 'Tecnico',
  merchantCity = 'Brasil',
  amount = 0,
  txId = '***',
}) {
  if (!pixKey) return '';

  const name = normalizeField(merchantName, 25);
  const city = normalizeField(merchantCity, 15);
  const ref  = txId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || '***';

  // MAI — Merchant Account Information for PIX
  const mai = tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', pixKey);

  // ADFT — Additional Data Field Template
  const adft = tlv('05', ref);

  let payload =
    tlv('00', '01') +           // Payload Format Indicator
    tlv('26', mai) +            // Merchant Account Information
    tlv('52', '0000') +         // Merchant Category Code
    tlv('53', '986') +          // Transaction Currency (BRL = 986)
    (amount > 0 ? tlv('54', amount.toFixed(2)) : '') +
    tlv('58', 'BR') +           // Country Code
    tlv('59', name) +           // Merchant Name
    tlv('60', city) +           // Merchant City
    tlv('62', adft) +           // Additional Data
    '6304';                     // CRC tag (value appended below)

  return payload + crc16(payload);
}

/**
 * Monta a mensagem WhatsApp com chave PIX + payload copia e cola.
 */
export function buildPixWhatsAppMessage({ clientName, eventTitle, amount, pixKey, pixKeyType, pixPayloadStr }) {
  const name = clientName || 'Cliente';
  const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount || 0);
  const lines = [
    `Olá ${name}! 👋`,
    ``,
    `Segue o PIX para pagamento${eventTitle ? ` do show "${eventTitle}"` : ''}:`,
    ``,
    `💰 Valor: *${value}*`,
    `🔑 ${pixKeyType || 'Chave PIX'}: *${pixKey}*`,
    ``,
  ];
  if (pixPayloadStr) {
    lines.push(`📋 *Copia e Cola:*`);
    lines.push(pixPayloadStr);
    lines.push(``);
  }
  lines.push(`Qualquer dúvida, me chama! 🙏`);
  return lines.join('\n');
}
