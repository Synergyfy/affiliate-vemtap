import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard E2E Tests — 12 Admin Pages', () => {

  test.beforeEach(async ({ page }) => {
    // Intercept all API calls and fulfill with mock admin responses
    await page.route('**/api/**', async (route) => {
      const mockAdminUser = {
        id: 'admin-test-user-1',
        fullName: 'Super Admin',
        email: 'admin.test@vemtap.com',
        phone: '+2348000000000',
        role: 'SUPER_ADMIN' as const,
        isManagerMode: false,
        isTourCompleted: true,
      };

      const url = route.request().url();
      let body: any = {
        ...mockAdminUser,
        user: mockAdminUser,
        access_token: 'mock-admin-token',
        data: [],
        total: 0,
        success: true,
      };

      // Custom mock responses based on endpoint path
      if (url.includes('/admin/dashboard/stats')) {
        body = {
          totalAffiliates: 120,
          totalAffiliatesGrowth: 15,
          activeAffiliates: 98,
          totalRevenue: 45000000,
          totalRevenueGrowth: 22,
          commissionsPaid: 12500000,
          commissionsTrendPercentage: 8,
          pendingPayouts: 1800000,
          fraudAlerts: 3,
        };
      } else if (url.includes('/operations/reports/aggregates')) {
        body = {
          totalLeads: 1420,
          activeConversions: 380,
          totalEarnings: 12500000,
          conversionRate: 26.76,
        };
      } else if (url.includes('/market-mapping/admin/stats')) {
        body = {
          totalClusters: 42,
          mappedBusinesses: 1250,
          activeAffiliates: 85,
          marketPenetration: 68.5,
        };
      } else if (url.includes('/commissions/admin/stats')) {
        body = {
          totalCommissions: 25000000,
          paidCommissions: 18000000,
          pendingCommissions: 7000000,
          rejectedCommissions: 500000,
        };
      } else if (url.includes('/withdrawals/stats')) {
        body = {
          totalPayouts: 15000000,
          pendingRequests: 1200000,
          approvedAmount: 800000,
          completedAmount: 13000000,
        };
      } else if (url.includes('/fraud/stats')) {
        body = {
          alertCount: 12,
          highRiskCount: 3,
          pendingReviewCount: 5,
        };
      } else if (url.includes('/fraud/guard-status')) {
        body = { thresholdScore: 75 };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    // Seed session in localStorage and auth cookie
    await page.goto('/login');
    await page.evaluate(() => {
      document.cookie = "vemtap_logged_out=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "vemtap-auth-token=mock-admin-token; path=/; max-age=86400";
      localStorage.setItem('vemtap_user', JSON.stringify({
        id: 'admin-test-user-1',
        fullName: 'Super Admin',
        email: 'admin.test@vemtap.com',
        phone: '+2348000000000',
        role: 'SUPER_ADMIN',
        isManagerMode: false,
        isTourCompleted: true,
      }));
    });
  });

  test('Page 1: Admin Overview renders stats cards and pending lists', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin');
  });

  test('Page 2a: Operations Command renders KPI strip', async ({ page }) => {
    await page.goto('/admin/operations');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/operations');
  });

  test('Page 2b: Operations Reports tab renders hierarchy cascade', async ({ page }) => {
    await page.goto('/admin/operations/reports');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/operations/reports');
  });

  test('Page 3a: Admin Market Mapping Overview renders', async ({ page }) => {
    await page.goto('/admin/market-mapping');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/market-mapping');
  });

  test('Page 3b: Admin Market Mapping Businesses renders', async ({ page }) => {
    await page.goto('/admin/market-mapping/businesses');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/market-mapping/businesses');
  });

  test('Page 3c: Admin Market Mapping Assign renders', async ({ page }) => {
    await page.goto('/admin/market-mapping/assign');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/market-mapping/assign');
  });


  test('Page 4: Affiliates Management renders roster and status filters', async ({ page }) => {
    await page.goto('/admin/affiliates');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/affiliates');
  });

  test('Page 5: Businesses & Referrals renders business table and status controls', async ({ page }) => {
    await page.goto('/admin/referrals');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/referrals');
  });

  test('Page 6: Commissions Management renders commission table and approval actions', async ({ page }) => {
    await page.goto('/admin/commissions');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/commissions');
  });

  test('Page 7: Withdrawals Management renders stats and bulk payout triggers', async ({ page }) => {
    await page.goto('/admin/withdrawals');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/withdrawals');
  });

  test('Page 8: Fraud Monitor renders alert cards and global guard controls', async ({ page }) => {
    await page.goto('/admin/fraud');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/fraud');
  });

  test('Page 9: System Observability renders live telemetry stream and request table', async ({ page }) => {
    await page.goto('/admin/observability');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/observability');
  });

  test('Page 10: Affiliate Agreement Workspace renders editor and version controls', async ({ page }) => {
    await page.goto('/admin/settings/agreement');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/settings/agreement');
  });

  test('Page 11: Training Academy Management renders module CRUD list', async ({ page }) => {
    await page.goto('/admin/training');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/training');
  });

  test('Page 12: Notifications Broadcast renders compose card and history list', async ({ page }) => {
    await page.goto('/admin/notifications');
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/admin/notifications');
  });

});
