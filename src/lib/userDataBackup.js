import { supabase } from './supabase';
import { todayLocalISO } from '@/components/utils/dateUtils';

const TABLES = ['events', 'daily_work', 'clients', 'expenses'];
const PAGE_SIZE = 500;

async function readAllRows(table, userId) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from(table).select('*')
      .eq('user_id', userId).order('id', { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
    if (error || !Array.isArray(data)) throw new Error('Não foi possível consultar todos os dados. Nenhum arquivo foi gerado. Tente novamente.');
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
  }
}

/** Exportação dos cadastros listados no manifesto, não um backup restaurável. */
export async function createBackup(_args) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (authError || !userId) return { data: { success: false, error: 'Usuário não autenticado.' } };

    const [collections, settingsRes] = await Promise.all([
      Promise.all(TABLES.map(table => readAllRows(table, userId))),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);
    if (settingsRes.error) throw new Error('Não foi possível consultar as configurações. Nenhum arquivo foi gerado. Tente novamente.');
    const { data: currentAuth, error: currentAuthError } = await supabase.auth.getUser();
    if (currentAuthError || currentAuth?.user?.id !== userId) throw new Error('A conta mudou durante a exportação. Inicie novamente.');

    const snapshot = {
      export_version: 2,
      exported_at: new Date().toISOString(),
      user_id: userId,
      ...Object.fromEntries(TABLES.map((table, index) => [table, collections[index]])),
      user_settings: settingsRes.data || null,
      manifest: {
        included: [...TABLES, 'user_settings'],
        excluded: ['profiles', 'event_templates', 'mentor_history', 'attachment_files'],
        attachment_links_only: true,
        restore_available: false,
        consistency: 'independent_queries',
      },
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    try {
      a.href = url;
      a.download = `backstage-dados-${todayLocalISO()}.json`;
      document.body.appendChild(a);
      a.click();
    } finally {
      a.remove();
      // Permitir que o navegador consuma a URL antes de liberá-la.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return { data: { success: true } };
  } catch (error) {
    return { data: { success: false, error: error.message || 'Falha ao exportar dados.' } };
  }
}

export async function exportUserSnapshot(args) {
  return createBackup(args);
}
