import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client without forcing authentication
export const base44 = createClient({
  appId: "6876d7e2075f2bcac1883323",
  requiresAuth: false
});
