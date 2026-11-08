/**
 * Conferência da nota fiscal (NF-e / NFS-e) com o trabalho no app — regra única, sem rede.
 *
 * Empresa: o CNPJ manda. Sem CNPJ igual, compara os nomes conhecidos do cliente (nome do
 * cadastro, razão social e nome fantasia da empresa vinculada), ignorando acentos, pontuação
 * e terminações como LTDA/ME/EPP — assim "Palco Norte" reconhece "PALCO NORTE PRODUCOES LTDA".
 *
 * Valor: compara com o valor calculado do trabalho (cachê + horas extras + dobras + alimentação),
 * não com o cachê base. Se for diferente, o usuário escolhe "valor da nota" ou "valor do app";
 * a escolha fica em `nfe_analise.escolha_valor` e vale para A receber, Recebi e relatórios.
 */

const SUFIXOS = new Set(['ltda', 'me', 'epp', 'eireli', 'sa', 's/a', 'ss', 'mei', 'cia', 'limitada', 'eireli-me']);

export function onlyDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeCompanyName(value) {
  const words = String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/s\/a\b/g, 'sa')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !SUFIXOS.has(w));
  return words.join(' ');
}

/** Empresa vinculada (join `company:companies(...)`) ou null — `company` também pode ser texto antigo. */
function linkedCompany(client) {
  return client?.company && typeof client.company === 'object' ? client.company : null;
}

/** Nomes pelos quais o cliente pode aparecer na nota. */
export function clientKnownNames(client) {
  if (!client) return [];
  const company = linkedCompany(client);
  const names = [client.name, typeof client.company === 'string' ? client.company : null, company?.name, company?.trading_name];
  return [...new Set(names.map(normalizeCompanyName).filter((n) => n.length >= 2))];
}

export function clientCnpj(client) {
  const company = linkedCompany(client);
  const digits = onlyDigits(company?.cnpj || client?.cnpj);
  return digits.length === 14 ? digits : '';
}

function namesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  const [shortName, longName] = a.length <= b.length ? [a, b] : [b, a];
  if (shortName.length >= 4 && (` ${longName} `).includes(` ${shortName} `)) return true;
  const ta = new Set(a.split(' '));
  const tb = new Set(b.split(' '));
  const common = [...ta].filter((t) => t.length > 1 && tb.has(t)).length;
  return common >= 2 && common / Math.min(ta.size, tb.size) >= 0.6;
}

const cents = (v) => Math.round((Number(v) || 0) * 100);

/**
 * @returns {{
 *   empresa: 'cnpj'|'nome'|'cnpj_diferente'|'nome_diferente'|'sem_dados',
 *   podeVincularCnpj: boolean,
 *   valor: 'confere'|'diferente'|'sem_valor',
 *   valorNota: number, valorApp: number, diferenca: number,
 *   escolha: 'nota'|'app'|null,
 * }}
 */
export function reconcileNFe({ analise, client, expectedAmount }) {
  const notaCnpj = onlyDigits(analise?.nfe_tomador_cnpj);
  const notaNome = normalizeCompanyName(analise?.nfe_tomador_nome);
  const cadastroCnpj = clientCnpj(client);
  const nomes = clientKnownNames(client);

  let empresa = 'sem_dados';
  // O usuário confirmou 'é a mesma empresa' e o CNPJ foi guardado no cadastro.
  if (analise?.cnpj_guardado && notaCnpj) empresa = 'cnpj';
  else if (notaCnpj && cadastroCnpj) empresa = notaCnpj === cadastroCnpj ? 'cnpj' : 'cnpj_diferente';
  else if (notaNome && nomes.some((n) => namesMatch(n, notaNome))) empresa = 'nome';
  else if (notaNome || notaCnpj) empresa = 'nome_diferente';

  const valorNota = Math.max(0, cents(analise?.nfe_valor)) / 100;
  const valorApp = Math.max(0, cents(expectedAmount)) / 100;
  let valor = 'sem_valor';
  if (valorNota > 0) valor = Math.abs(cents(valorNota) - cents(valorApp)) <= 100 ? 'confere' : 'diferente';

  const escolha = ['nota', 'app'].includes(analise?.escolha_valor) ? analise.escolha_valor : null;
  return {
    empresa,
    // O cliente ainda não tem CNPJ e a nota tem: dá para guardar (o usuário confirma).
    podeVincularCnpj: Boolean(notaCnpj.length === 14 && !cadastroCnpj && !analise?.cnpj_guardado && client?.client_type !== 'pessoa'),
    valor,
    valorNota,
    valorApp,
    diferenca: (cents(valorNota) - cents(valorApp)) / 100,
    escolha,
  };
}

/** Valor escolhido "da nota" para o trabalho, ou null quando vale o cálculo do app. */
export function nfeChosenAmount(event) {
  const a = event?.nfe_analise;
  if (!a || a.escolha_valor !== 'nota') return null;
  const v = Number(a.nfe_valor);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : null;
}
