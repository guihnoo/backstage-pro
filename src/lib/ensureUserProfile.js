import { supabase } from './supabase';

/** Garante que todo usuário autenticado (OAuth ou email) tenha linha em profiles. */
export async function ensureUserProfile(user) {
  if (!user?.id) return null;

  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (existing) return existing;

  const meta = user.user_metadata || {};
  const name =
    meta.full_name ||
    meta.name ||
    user.email?.split('@')[0] ||
    'Profissional';

  const avatar =
    meta.avatar_url ||
    meta.picture ||
    null;

  const { data: created, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name,
      avatar_url: avatar,
      onboarding_complete: false,
    })
    .select()
    .single();

  if (error) {
    // Concorrência: outro request já criou o perfil
    if (error.code === '23505') {
      const { data: retry } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      return retry;
    }
    console.error('[ensureUserProfile]', error);
    throw error;
  }

  return created;
}
