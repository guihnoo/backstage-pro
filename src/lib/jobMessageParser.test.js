import { describe, it, expect } from 'vitest';
import { parseJobMessage, normalizeText, aiResultToParsed, findClient } from './jobMessageParser';

// Quinta-feira, 22/10/2026
const today = new Date(2026, 9, 22);
const clients = [
  { id: 'c1', name: 'Palco Norte Produções' },
  { id: 'c2', name: 'Ana Ribeiro' },
];
const functions = ['lighting', 'video', 'audio'];
const parse = (text) => parseJobMessage(text, { today, clients, functions });

describe('parseJobMessage — mensagens reais', () => {
  it('produtora com tudo: data, chegada, horário, local, cachê e cliente', () => {
    const { fields, found } = parse(`Fala Guih! Tudo certo?
*Show do Jorge & Mateus*
Dia 25/10 (sábado)
Chegada 14h, show das 21h às 23h30
Local: Allianz Parque - Av. Francisco Matarazzo, 1705 - São Paulo/SP
Cachê R$ 900,00
Produtora: Palco Norte`);
    expect(fields).toMatchObject({
      title: 'Show do Jorge & Mateus',
      start_date: '2026-10-25',
      end_date: '2026-10-25',
      start_time: '14:00',
      end_time: '23:30',
      location: 'Allianz Parque - Av. Francisco Matarazzo, 1705 - São Paulo/SP',
      location_city: 'São Paulo',
      location_state: 'SP',
      daily_cache_value: 900,
      client_id: 'c1',
    });
    expect(found).toEqual(expect.arrayContaining(['data', 'horário', 'local', 'cachê', 'cliente', 'nome']));
  });

  it('vários dias, montagem, cidade, diária e função', () => {
    const { fields } = parse(`Bom dia! Preciso de iluminador para a Feira Agro
dias 12 a 14/11
montagem 8h, evento 10h às 18h
Ribeirão Preto/SP
Diária de 850`);
    expect(fields).toMatchObject({
      title: 'Feira Agro',
      start_date: '2026-11-12',
      end_date: '2026-11-14',
      start_time: '08:00',
      end_time: '18:00',
      location_city: 'Ribeirão Preto',
      location_state: 'SP',
      daily_cache_value: 850,
      category: 'lighting',
    });
  });

  it('dia da semana, virada de madrugada e "reais"', () => {
    const { fields } = parse(`Oi, tem job sábado?
Casamento da Ana em Campinas
das 22h às 4h
700 reais`);
    expect(fields).toMatchObject({ start_date: '2026-10-24', start_time: '22:00', end_time: '04:00', daily_cache_value: 700 });
    expect(fields.title).toMatch(/^Casamento da Ana/);
  });

  it('mês por extenso, intervalo e milhar com ponto', () => {
    const { fields } = parse(`Evento: Congresso Médico
25 a 27 de novembro
Cachê 1.200`);
    expect(fields).toMatchObject({ title: 'Congresso Médico', start_date: '2026-11-25', end_date: '2026-11-27', daily_cache_value: 1200 });
  });

  it('amanhã às 19h', () => {
    const { fields } = parse('Consegue amanhã às 19h? Valor R$ 650');
    expect(fields).toMatchObject({ start_date: '2026-10-23', start_time: '19:00', daily_cache_value: 650 });
  });

  it('cliente achado pelo nome no meio da mensagem e "dia 7" no mês seguinte', () => {
    const { fields } = parse('Oi, aqui é a Ana Ribeiro, casamento dia 7, valor R$ 800');
    expect(fields).toMatchObject({ client_id: 'c2', start_date: '2026-11-07', daily_cache_value: 800 });
  });

  it('horário com dois-pontos e lista de dias', () => {
    const { fields } = parse('Formatura UNICAMP — 5, 6 e 7/12 — 18:00 - 23:00 — som e luz');
    expect(fields).toMatchObject({ start_date: '2026-12-05', end_date: '2026-12-07', start_time: '18:00', end_time: '23:00' });
  });

  it('cliente que não está na lista vem como nome novo', () => {
    const { fields, clientName, found } = parse('Produtora: Live Mais\n30/10 20h');
    expect(fields.client_id).toBeUndefined();
    expect(clientName).toBe('Live Mais');
    expect(found).toContain('cliente (novo)');
  });
});

describe('parseJobMessage — o que não pode acontecer', () => {
  it('mensagem sem nada útil não inventa campos', () => {
    const { fields, found } = parse('Oi tudo bem?');
    expect(found).toEqual([]);
    expect(Object.keys(fields)).toEqual(['observacoes_md']);
  });

  it('telefone não vira cachê, data nem horário', () => {
    const { fields } = parse('Contato do produtor: (11) 98888-7777');
    expect(fields.daily_cache_value).toBeUndefined();
    expect(fields.start_date).toBeUndefined();
    expect(fields.start_time).toBeUndefined();
  });

  it('data bem para trás é do ano que vem; recente fica neste ano', () => {
    expect(parse('15/01').fields.start_date).toBe('2027-01-15');
    expect(parse('20/10').fields.start_date).toBe('2026-10-20');
  });

  it('dia do pagamento não vira cachê', () => {
    const { fields } = parse('Show 31/10 21h. Pagamento dia 30/11');
    expect(fields.daily_cache_value).toBeUndefined();
  });

  it('função só entra se o técnico tiver mais de uma no Perfil', () => {
    expect(parseJobMessage('Job de luz 30/10', { today, functions: ['lighting'] }).fields.category).toBeUndefined();
    expect(parseJobMessage('Job de vídeo 30/10', { today, functions }).fields.category).toBe('video');
  });

  it('guarda a mensagem inteira nas observações', () => {
    expect(parse('Show 30/10\nchegada 15h').fields.observacoes_md).toBe('Show 30/10\nchegada 15h');
  });
});

describe('normalizeText', () => {
  it('tira acento sem mudar o tamanho', () => {
    const s = 'Ribeirão Preto 📍 São';
    expect(normalizeText(s)).toHaveLength(s.length);
    expect(normalizeText('ÁÉÍÓÚ Ç')).toBe('aeiou c');
  });
});

describe('aiResultToParsed — resposta da IA (credencial / "Ler com IA")', () => {
  it('aproveita o que veio certo e acha o cliente da lista', () => {
    const r = aiResultToParsed({
      title: 'Rock in Rio 2026',
      client_name: 'Palco Norte',
      start_date: '2026-11-13',
      end_date: '2026-11-15',
      start_time: '12:00',
      end_time: null,
      location: 'Parque Olímpico',
      location_city: 'Rio de Janeiro',
      location_state: 'RJ',
      daily_cache_value: null,
      function: 'lighting',
      notes: 'Acesso: backstage palco Mundo',
    }, { clients, functions, source: 'credencial' });
    expect(r.fields).toMatchObject({
      title: 'Rock in Rio 2026',
      client_id: 'c1',
      start_date: '2026-11-13',
      end_date: '2026-11-15',
      start_time: '12:00',
      location_city: 'Rio de Janeiro',
      location_state: 'RJ',
      category: 'lighting',
    });
    expect(r.fields.daily_cache_value).toBeUndefined();
    expect(r.fields.observacoes_md).toContain('Lido da foto da credencial');
    expect(r.fields.observacoes_md).toContain('backstage palco Mundo');
  });

  it('descarta formato errado que a IA devolver', () => {
    const r = aiResultToParsed({
      start_date: '13/11/2026', start_time: '25:00', location_state: 'XX',
      daily_cache_value: 'muito', function: 'astronauta', title: '  ',
    }, { clients, functions });
    expect(r.found).toEqual([]);
    expect(r.fields).toEqual({});
  });

  it('cliente que não está na lista vem como novo', () => {
    const r = aiResultToParsed({ client_name: 'Live Mais', start_date: '2026-11-01' }, { clients });
    expect(r.clientName).toBe('Live Mais');
    expect(r.found).toContain('cliente (novo)');
  });

  it('resposta vazia não preenche nada', () => {
    expect(aiResultToParsed(null).found).toEqual([]);
  });
});

describe('findClient', () => {
  it('pelo rótulo nos dois sentidos e pelo texto', () => {
    expect(findClient({ name: 'Palco Norte' }, clients)?.id).toBe('c1');
    expect(findClient({ name: 'palco norte produções ltda' }, clients)?.id).toBe('c1');
    expect(findClient({ text: 'falei com a Ana Ribeiro ontem' }, clients)?.id).toBe('c2');
    expect(findClient({ name: 'Ana' }, clients)).toBeNull();
  });
});
