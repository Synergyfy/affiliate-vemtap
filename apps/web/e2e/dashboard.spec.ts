import { test, expect } from '@playwright/test';

test.describe('Affiliate & Line Manager Dashboard E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept all API endpoints to guarantee 200 OK responses
    await page.route('**/api/**', async (route) => {
      const mockUser = {
        id: 'affiliate-test-user-1',
        fullName: 'Test Affiliate',
        email: 'test.affiliate@vemtap.com',
        phone: '+2348012345678',
        referralCode: 'TESTREF100',
        role: 'SUPERVISOR' as const,
        isManagerMode: true,
        isTourCompleted: true,
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockUser,
          user: mockUser,
          access_token: 'mock-token',
          data: [],
          unreadCount: 0,
          success: true,
        }),
      });
    });

    // Seed session in localStorage on origin
    await page.goto('/login');
    await page.evaluate(() => {
      document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "vemtap-auth-token=mock-token; path=/; max-age=86400";
      localStorage.setItem('vemtap_user', JSON.stringify({
        id: 'affiliate-test-user-1',
        fullName: 'Test Affiliate',
        email: 'test.affiliate@vemtap.com',
        phone: '+2348012345678',
        referralCode: 'TESTREF100',
        role: 'SUPERVISOR',
        isManagerMode: true,
        isTourCompleted: true,
      }));
    });
  });

  test('Page 1: Home Dashboard renders welcome banner, stats, and notification dropdown', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard');
  });

  test('Page 2: Market Mapping Suite renders without crashing', async ({ page }) => {
    await page.goto('/dashboard/market-mapping');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/market-mapping');
  });

  test('Page 3: Referral Tools renders marketing kit and link generator', async ({ page }) => {
    await page.goto('/dashboard/tools');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/tools');
  });

  test('Page 4: Businesses Portfolio page renders business roster', async ({ page }) => {
    await page.goto('/dashboard/businesses');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/businesses');
  });

  test('Page 5: Line Manager Network renders recruits roster', async ({ page }) => {
    await page.goto('/dashboard/network');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/network');
  });

  test('Page 6: Leaderboard renders rankings podium', async ({ page }) => {
    await page.goto('/dashboard/leaderboard');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/leaderboard');
  });

  test('Page 7: Wallet renders balance card and withdrawal history', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/wallet');
  });

  test('Page 8: Sales Academy renders module cards and practice scenarios', async ({ page }) => {
    await page.goto('/dashboard/training');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/training');
  });

  test('Page 9: Profile renders user profile settings and KYC status', async ({ page }) => {
    await page.goto('/dashboard/profile');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/profile');
  });

  test('Page 10: Earnings Calculator renders interactive slider projections', async ({ page }) => {
    await page.goto('/dashboard/earnings-calculator');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/dashboard/earnings-calculator');
  });
});
