/**
 * Dono do app: role no Supabase OU e-mail em VITE_OWNER_EMAIL (só UI; RLS exige role = owner).
 */
export function isAppOwner(user, profile) {
  if (profile?.role === 'owner') return true;
  const ownerEmail = (import.meta.env.VITE_OWNER_EMAIL || '').trim().toLowerCase();
  if (!ownerEmail || !user?.email) return false;
  return user.email.toLowerCase() === ownerEmail;
}
