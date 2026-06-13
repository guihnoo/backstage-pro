import { test, expect } from '@playwright/test';
import { seedGoalsAuth } from '../helpers/fakeGoals.js';

test('metas exibe streak e projeção de shows com dados mockados', async ({ page }) => {
  await seedGoalsAuth(page);

  await page.goto('/goals', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('Carregando...')).toBeHidden({ timeout: 20_000 });

  await expect(page.getByText(/meses seguidos batendo a meta/i)).toBeVisible();
  await expect(page.getByText(/show ainda|shows ainda/i)).toBeVisible();
});
