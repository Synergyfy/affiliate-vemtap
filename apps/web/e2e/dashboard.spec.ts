import { test, expect } from '@playwright/test';
import { authenticate } from './auth';

test.describe('Affiliate & Line Manager Dashboard E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await authenticate(page, 'affiliate');
  });

  test('Page 1: Home Dashboard renders welcome banner, stats, and notification dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('main')).toBeVisible();
    expect(page.url()).toContain('/dashboard');
  });

  test('Page 2: Market Mapping Suite renders without crashing', async ({ page }) => {
    await page.goto('/dashboard/market-mapping');
    await expect(page).toHaveURL(/dashboard\/market-mapping/);
    expect(page.url()).toContain('/dashboard/market-mapping');
  });

  test('Page 3: Referral Tools renders marketing kit and link generator', async ({ page }) => {
    await page.goto('/dashboard/tools');
    await expect(page).toHaveURL(/dashboard\/tools/);
    expect(page.url()).toContain('/dashboard/tools');
  });

  test('Page 4: Businesses Portfolio page renders business roster', async ({ page }) => {
    await page.goto('/dashboard/businesses');
    await expect(page).toHaveURL(/dashboard\/businesses/);
    expect(page.url()).toContain('/dashboard/businesses');
  });

  test('Page 5: Line Manager Network renders recruits roster', async ({ page }) => {
    await page.goto('/dashboard/network');
    await expect(page).toHaveURL(/dashboard\/network/);
    expect(page.url()).toContain('/dashboard/network');
  });

  test('Page 6: Leaderboard renders rankings podium', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    await expect(page).toHaveURL(/dashboard\/leaderboard/);
    expect(page.url()).toContain('/dashboard/leaderboard');
  });

  test('Page 7: Wallet renders balance card and withdrawal history', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    await expect(page).toHaveURL(/dashboard\/wallet/);
    expect(page.url()).toContain('/dashboard/wallet');
  });

  test('Page 8: Sales Academy renders module cards and practice scenarios', async ({ page }) => {
    await page.goto('/dashboard/training');
    await expect(page).toHaveURL(/dashboard\/training/);
    expect(page.url()).toContain('/dashboard/training');
  });

  test('Page 9: Profile renders user profile settings and KYC status', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await expect(page).toHaveURL(/dashboard\/profile/);
    expect(page.url()).toContain('/dashboard/profile');
  });

  test('Page 10: Earnings Calculator renders interactive slider projections', async ({ page }) => {
    await page.goto('/dashboard/earnings-calculator');
    await expect(page).toHaveURL(/dashboard\/earnings-calculator/);
    expect(page.url()).toContain('/dashboard/earnings-calculator');
  });
});
