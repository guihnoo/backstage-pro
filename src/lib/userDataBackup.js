import { supabase } from './supabase';

/**
 * Exporta todos os dados do usuário autenticado como JSON e dispara download.
 * Retorno compatível com o contrato legado Base44: { data: { success, error? } }
 */
export async function createBackup(_args) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) {
      return { data: { success: false, error: 'Usuário não autenticado.' } };
    }

    const [eventsRes, dailyWorkRes, clientsRes, expensesRes, settingsRes] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', userId),
      supabase.from('daily_work').select('*').eq('user_id', userId),
      supabase.from('clients').select('*').eq('user_id', userId),
      supabase.from('expenses').select('*').eq('user_id', userId),
      supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const snapshot = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      events: eventsRes.data || [],
      daily_work: dailyWorkRes.data || [],
      clients: clientsRes.data || [],
      expenses: expensesRes.data || [],
      user_settings: settingsRes.data || null,
    };

    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backstage-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { data: { success: true } };
  } catch (error) {
    console.error('createBackup:', error);
    return { data: { success: false, error: error.message || 'Falha ao exportar dados.' } };
  }
}

/** Alias — mesmo comportamento que createBackup */
export async function exportUserSnapshot(args) {
  return createBackup(args);
}
