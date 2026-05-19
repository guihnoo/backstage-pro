import { createClient } from '@base44/sdk';

/** @deprecated Migração para Supabase. requiresAuth:false evita redirect para base44.app no boot. */
export const base44 = createClient({
  appId: '6876d7e2075f2bcac1883323',
  requiresAuth: false,
});
