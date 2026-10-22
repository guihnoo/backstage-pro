// `test` dos E2E com a trava do banco: toda gravação (POST/PATCH) que o app manda ao
// Supabase é conferida contra as colunas reais (helpers/dbSchema.js). Se o banco de
// verdade recusaria, o teste falha — mesmo que o banco falso tenha respondido 200.
import { test as base, expect } from '@playwright/test';
import { checkRestWrite } from './dbSchema.js';

export const test = base.extend({
  page: async ({ page }, runTest) => {
    const problems = new Set();
    page.on('request', (request) => {
      if (!request.url().includes('/rest/v1/')) return;
      for (const p of checkRestWrite(request)) problems.add(p);
    });
    page.dbWrites = () => [...problems];

    await runTest(page);

    if (problems.size) {
      throw new Error(`O banco real recusaria ${problems.size} gravação(ões):\n- ${[...problems].join('\n- ')}`);
    }
  },
});

export { expect };
