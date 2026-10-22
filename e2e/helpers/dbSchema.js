// Retrato das colunas do banco de produção (Supabase cwtallnetgodoacuoaow), tirado em 2026-10-22.
// "!" = obrigatória sem valor padrão (NOT NULL sem default) — o banco recusa a gravação sem ela.
// Ao aplicar uma migração que mexe em colunas, atualize aqui (SQL no fim do arquivo).
// Inclui as colunas da migração 046 (ideias novas): publicar o app só DEPOIS de aplicá-la.
//
// Por que existe: em 22/10 o botão CHEGUEI gravava sem `work_date` e o banco recusava;
// os testes não pegavam porque o banco falso aceitava tudo. Agora todo POST/PATCH dos
// testes é conferido contra este retrato (ver helpers/test.js).
export const DB_SCHEMA = {
  ai_conversations: "id user_id! title messages context created_at updated_at",
  client_interactions: "id user_id! client_id! type notes follow_up_date created_at",
  clients: "id user_id! name! email phone company city state notes is_favorite total_events total_spent created_at updated_at contact_person logo_url policy_default_payment_model policy_allows_meio_e_dobra_juntos default_daily_cache invoice_portal_url profile_complete brand_color company_id client_type meal_policy meal_daily_value",
  closing_shares: "id token user_id! event_id! snapshot! expires_at revoked_at created_at client_notice_at",
  companies: "id name! trading_name cnpj city state address phone email website logo_url cnae porte status source verified created_by created_at updated_at",
  company_changes: "id! company_id! changed_by changed_at action! field old_value new_value",
  company_suggestions: "id! company_id! suggested_by field! current_value suggested_value! status created_at reviewed_at",
  daily_work: "id user_id! event_id work_date! hours_worked description status created_at updated_at date total_hours entry_time exit_time overtime_hours daily_cache photo_url notes regime hora_extra origem meal_allowance",
  event_templates: "id user_id! name! title color payment_model daily_cache_value notes created_at updated_at",
  events: "id user_id! title! description event_date! start_time end_time location client_id category category_label status payment_status daily_rate estimated_revenue actual_revenue notes created_at updated_at start_date end_date color paid auto_hours_applied daily_cache_value cache_valor_base payment_model payment_due_date observacoes_md paid_amount paid_date google_event_id google_calendar_id google_synced_at location_city location_state location_lat location_lng client_rating client_rating_notes nf_number nf_issued_at checklist_items nfe_numero nfe_arquivo_url nfe_arquivo_nome nfe_analise payment_method meal_policy google_origin work_log_mode equipment_items",
  expenses: "id user_id! event_id title! category amount! expense_date! payment_method notes receipt_url created_at updated_at is_reimbursable reimbursed description distance_km",
  feedback: "id user_id user_email rating message! created_at type page_path app_version screenshot_url status owner_notes updated_at",
  google_calendar_connections: "user_id! refresh_token! access_token token_expires_at created_at updated_at scope",
  notifications: "id user_id! title! message type priority is_read action_url created_at",
  profiles: "id! name phone city state category category_label specialties years_experience daily_rate monthly_goal_events monthly_goal_revenue avatar_url onboarding_complete created_at updated_at role tour_completed_at work_log_mode role_rates",
  push_sent_log: "user_id! notification_key! sent_date sent_at",
  push_subscriptions: "id user_id! endpoint! p256dh! auth! user_agent created_at updated_at",
  user_settings: "id user_id! theme notifications_enabled email_notifications currency language timezone created_at updated_at financial_visibility google_calendar_connected widget_order hidden_widgets notification_preferences google_account_email google_last_sync_at google_calendar_id push_enabled push_events push_payments push_goals pix_key pix_key_type cpf_cnpj report_full_name report_subtitle report_profession google_push_enabled google_import_enabled google_import_calendar_id google_import_keywords google_busy_check_enabled google_last_sync_error km_rate equipment_kit",
};

export const DB_RPC = [
  'aplicar_12h_automaticas', 'avisar_pagamento_fechamento', 'cnpj_valido', 'criar_link_fechamento',
  'is_app_owner', 'nomes_usuarios_para_dono', 'revisar_sugestao_empresa', 'ver_link_fechamento',
];

const TABLES = Object.fromEntries(
  Object.entries(DB_SCHEMA).map(([table, spec]) => {
    const cols = spec.split(' ');
    return [table, {
      cols: new Set(cols.map((c) => c.replace('!', ''))),
      required: cols.filter((c) => c.endsWith('!')).map((c) => c.slice(0, -1)).filter((c) => c !== 'id'),
    }];
  })
);

/**
 * Confere uma requisição do app ao PostgREST como o banco real faria.
 * Devolve a lista de problemas (vazia = gravação aceitável).
 */
export function checkRestWrite(request) {
  const method = request.method();
  if (!['POST', 'PATCH', 'PUT'].includes(method)) return [];
  const url = new URL(request.url());
  const m = url.pathname.match(/\/rest\/v1\/(rpc\/)?([^/?]+)/);
  if (!m) return [];
  const [, isRpc, name] = m;
  if (isRpc) return DB_RPC.includes(name) ? [] : [`rpc "${name}" não existe no banco`];

  const table = TABLES[name];
  if (!table) return [`${method} em tabela inexistente "${name}"`];

  let body;
  try { body = request.postDataJSON(); } catch { return []; }
  if (!body || typeof body !== 'object') return [];
  const rows = Array.isArray(body) ? body : [body];
  const problems = [];
  for (const row of rows) {
    const unknown = Object.keys(row).filter((k) => !table.cols.has(k));
    if (unknown.length) problems.push(`${method} ${name}: coluna(s) inexistente(s) ${unknown.join(', ')}`);
    if (method === 'POST') {
      const missing = table.required.filter((k) => row[k] === undefined || row[k] === null);
      if (missing.length) problems.push(`POST ${name}: falta coluna obrigatória ${missing.join(', ')}`);
    }
  }
  return problems;
}

/*
SQL para gerar de novo (rodar no Supabase e trocar o objeto DB_SCHEMA):
select json_object_agg(t, cols) from (
  select table_name t, string_agg(column_name || case when is_nullable='NO' and column_default is null then '!' else '' end, ' ' order by ordinal_position) cols
  from information_schema.columns where table_schema='public' group by table_name) s;
*/
