import { describe, expect, it } from 'vitest';
import {
  buildLocationBackfillPatch,
  inferCityFromLocation,
  inferStateFromLocation,
  normalizeStateCode,
  parseLocationFromEvent,
} from './parseEventLocation';

describe('inferStateFromLocation', () => {
  it('reconhece sigla UF', () => {
    expect(inferStateFromLocation('Show em Campinas, SP')).toBe('SP');
    expect(inferStateFromLocation('RJ — turnê')).toBe('RJ');
  });

  it('reconhece nome completo do estado', () => {
    expect(inferStateFromLocation('Curitiba, Paraná')).toBe('PR');
  });
});

describe('inferCityFromLocation', () => {
  it('extrai cidade com vírgula e UF', () => {
    expect(inferCityFromLocation('São Paulo, SP')).toBe('São Paulo');
  });

  it('extrai cidade com barra', () => {
    expect(inferCityFromLocation('Niterói/RJ')).toBe('Niterói');
  });

  it('extrai cidade em formato cidade - UF', () => {
    expect(inferCityFromLocation('Belo Horizonte - MG')).toBe('Belo Horizonte');
  });
});

describe('normalizeStateCode', () => {
  it('normaliza sigla e nome', () => {
    expect(normalizeStateCode('sp')).toBe('SP');
    expect(normalizeStateCode('Rio de Janeiro')).toBe('RJ');
  });
});

describe('parseLocationFromEvent', () => {
  it('prioriza campos estruturados', () => {
    expect(
      parseLocationFromEvent({
        location: 'Outra, RS',
        location_city: 'Porto Alegre',
        location_state: 'RS',
      })
    ).toEqual({ city: 'Porto Alegre', state: 'RS' });
  });

  it('faz fallback a partir de location texto', () => {
    expect(
      parseLocationFromEvent({ location: 'Recife, PE' })
    ).toEqual({ city: 'Recife', state: 'PE' });
  });
});

describe('buildLocationBackfillPatch', () => {
  it('retorna patch quando faltam campos estruturados', () => {
    expect(
      buildLocationBackfillPatch({ location: 'Florianópolis, SC' })
    ).toEqual({
      location_city: 'Florianópolis',
      location_state: 'SC',
    });
  });

  it('retorna null quando não há location ou nada a preencher', () => {
    expect(buildLocationBackfillPatch({})).toBeNull();
    expect(
      buildLocationBackfillPatch({
        location: 'São Paulo, SP',
        location_city: 'São Paulo',
        location_state: 'SP',
      })
    ).toBeNull();
  });
});
