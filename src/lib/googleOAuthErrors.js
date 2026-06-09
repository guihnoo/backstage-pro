const OAUTH_ERROR_MESSAGES = {
  access_denied: 'Você cancelou a autorização no Google. Nenhuma alteração foi feita.',
  invalid_state: 'Sessão OAuth expirada. Abra o Perfil e toque em Conectar ao Google novamente.',
  missing_code_or_state: 'Resposta incompleta do Google. Tente conectar de novo.',
  missing_refresh_token:
    'O Google não devolveu permissão offline. Desconecte, aguarde alguns segundos e conecte outra vez (aceite todas as permissões).',
  token_exchange_failed: 'Falha ao validar o código com o Google. Verifique redirect URI e secrets no Supabase.',
};

export function formatGoogleOAuthError(rawError) {
  if (!rawError) return 'Erro desconhecido na conexão com Google Calendar.';

  const decoded = decodeURIComponent(String(rawError)).trim();
  const normalized = decoded.toLowerCase();

  for (const [key, message] of Object.entries(OAUTH_ERROR_MESSAGES)) {
    if (normalized === key || normalized.includes(key)) return message;
  }

  if (normalized.includes('redirect_uri_mismatch')) {
    return 'Redirect URI incorreto no Google Cloud. Deve apontar para a Edge Function google-calendar-callback.';
  }

  return decoded.length > 160 ? `${decoded.slice(0, 160)}…` : decoded;
}
