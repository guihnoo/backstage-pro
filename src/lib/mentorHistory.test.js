import { describe, it, expect } from 'vitest';
import { loadMentorHistory, saveMentorHistory } from './mentorHistory';

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

describe('Histórico do Mentor por conta', () => {
  it('não expõe mensagens de A para B nem para visitante', () => {
    const storage = memoryStorage();
    saveMentorHistory('A', [{ id: 'a', messages: [{ content: 'Exemplo privado A' }] }], storage);
    saveMentorHistory('B', [{ id: 'b' }], storage);
    expect(loadMentorHistory('B', storage)).toEqual([{ id: 'b' }]);
    expect(loadMentorHistory(null, storage)).toEqual([]);
    expect(loadMentorHistory('A', storage)[0].id).toBe('a');
  });
  it('preserva legado sem atribuí-lo automaticamente ao usuário que entrar', () => {
    const storage = memoryStorage();
    storage.setItem('backstage_ai_conversations', JSON.stringify([{ id: 'dono-desconhecido' }]));
    expect(loadMentorHistory('novo-usuario', storage)).toEqual([]);
    expect(storage.getItem('backstage_ai_conversations')).toContain('dono-desconhecido');
  });
  it('tolera armazenamento inválido ou bloqueado sem mostrar dados estranhos', () => {
    expect(loadMentorHistory('A', { getItem: () => '{invalido' })).toEqual([]);
    expect(loadMentorHistory('A', { getItem: () => '{}' })).toEqual([]);
    expect(loadMentorHistory('A', { getItem: () => { throw new Error('bloqueado'); } })).toEqual([]);
  });
});
