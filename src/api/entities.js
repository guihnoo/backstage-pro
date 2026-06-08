import { supabase } from '@/lib/supabase';

// Mapa de nomes de tabela por entity
const _TABLE_MAP = {
  events: 'events',
  daily_work: 'daily_work',
  clients: 'clients',
  expenses: 'expenses',
  user_settings: 'user_settings',
  notifications: 'notifications',
};

// Normaliza payload: converte owner_id → user_id para compatibilidade
function normalizePayload(data) {
  if (!data || typeof data !== 'object') return data;
  const d = { ...data };
  if (d.owner_id !== undefined && d.user_id === undefined) {
    d.user_id = d.owner_id;
  }
  delete d.owner_id;
  delete d.created_by;
  delete d.created_by_email;
  return d;
}

// Normaliza filtros: owner_id → user_id, descarta campos desconhecidos
function normalizeFilters(filters) {
  const result = {};
  for (const [k, v] of Object.entries(filters || {})) {
    if (k === 'owner_id') result.user_id = v;
    else if (k !== 'created_by' && k !== 'created_by_email') result[k] = v;
  }
  return result;
}

function makeEntity(tableName) {
  return {
    name: tableName,

    async create(data) {
      const payload = normalizePayload(data);
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async update(id, data) {
      const payload = normalizePayload(data);
      delete payload.id;
      const { data: result, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },

    // filter() é compatível com a assinatura Base44: filter(filters, orderBy?, limit?)
    async filter(filters = {}, _orderBy, _limit) {
      const normalized = normalizeFilters(filters);
      let query = supabase.from(tableName).select('*');
      for (const [k, v] of Object.entries(normalized)) {
        query = query.eq(k, v);
      }
      if (_limit) query = query.limit(_limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  };
}

export const Event = makeEntity('events');
export const DailyWork = makeEntity('daily_work');
export const Client = makeEntity('clients');
export const Expense = makeEntity('expenses');
export const UserSettings = makeEntity('user_settings');
export const Notification = makeEntity('notifications');

// Entidades menos críticas — stub que não quebra imports
const noop = () => Promise.resolve(null);
const stubEntity = { create: noop, update: noop, delete: noop, filter: () => Promise.resolve([]) };

export const UserDashboardSettings = stubEntity;
export const Feedback = stubEntity;
export const Report = stubEntity;
export const EventTemplate = stubEntity;
export const SystemBackup = { ...stubEntity, filter: () => Promise.resolve([]) };
export const Invoice = stubEntity;
export const UserBehaviorProfile = stubEntity;
export const AuditLog = stubEntity;
export const MentorConfig = stubEntity;

// User — retorna o usuário atual do Supabase Auth
export const User = {
  async me() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
