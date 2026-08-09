import { expect, Page } from '@playwright/test';

type E2ERole = 'affiliate' | 'admin';

export async function authenticate(page: Page, role: E2ERole) {
  const prefix = role === 'admin' ? 'ADMIN' : 'AFFILIATE';
  const email = process.env[`E2E_${prefix}_EMAIL`];
  const password = process.env[`E2E_${prefix}_PASSWORD`];

  if (!email || !password) {
    throw new Error(`E2E_${prefix}_EMAIL and E2E_${prefix}_PASSWORD must be configured for database-backed E2E tests`);
  }

  const response = await page.request.post('/api/auth/login', {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
  await expect.poll(async () => (await page.request.get('/api/auth/me')).ok()).toBeTruthy();
}
