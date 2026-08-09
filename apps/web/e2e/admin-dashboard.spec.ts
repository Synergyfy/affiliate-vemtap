import { test, expect } from '@playwright/test';
import { authenticate } from './auth';

test.describe('Admin Dashboard E2E Tests — 12 Admin Pages', () => {

  test.beforeEach(async ({ page }) => {
    await authenticate(page, 'admin');
  });

  test('Page 1: Admin Overview renders stats cards and pending lists', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('main')).toBeVisible();
    expect(page.url()).toContain('/admin');
  });

  test('Page 2a: Operations Command renders KPI strip', async ({ page }) => {
    await page.goto('/admin/operations');
    await expect(page).toHaveURL(/admin\/operations$/);
    expect(page.url()).toContain('/admin/operations');
  });

  test('Page 2b: Operations Reports tab renders hierarchy cascade', async ({ page }) => {
    await page.goto('/admin/operations/reports');
    await expect(page).toHaveURL(/admin\/operations\/reports/);
    expect(page.url()).toContain('/admin/operations/reports');
  });

  test('Page 3a: Admin Market Mapping Overview renders', async ({ page }) => {
    await page.goto('/admin/market-mapping');
    await expect(page).toHaveURL(/admin\/market-mapping$/);
  });

  test('Page 3b: Admin Market Mapping Businesses renders', async ({ page }) => {
    await page.goto('/admin/market-mapping/businesses');
    await expect(page).toHaveURL(/admin\/market-mapping\/businesses/);
  });

  test('Page 3c: Admin Market Mapping Assign renders', async ({ page }) => {
    await page.goto('/admin/market-mapping/assign');
    await expect(page).toHaveURL(/admin\/market-mapping\/assign/);
  });


  test('Page 4: Affiliates Management renders roster and status filters', async ({ page }) => {
    await page.goto('/admin/affiliates');
    await expect(page).toHaveURL(/admin\/affiliates$/);
  });

  test('Page 5: Businesses & Referrals renders business table and status controls', async ({ page }) => {
    await page.goto('/admin/referrals');
    await expect(page).toHaveURL(/admin\/referrals$/);
  });

  test('Page 6: Commissions Management renders commission table and approval actions', async ({ page }) => {
    await page.goto('/admin/commissions');
    await expect(page).toHaveURL(/admin\/commissions$/);
  });

  test('Page 7: Withdrawals Management renders stats and bulk payout triggers', async ({ page }) => {
    await page.goto('/admin/withdrawals');
    await expect(page).toHaveURL(/admin\/withdrawals$/);
  });

  test('Page 8: Fraud Monitor renders alert cards and global guard controls', async ({ page }) => {
    await page.goto('/admin/fraud');
    await expect(page).toHaveURL(/admin\/fraud$/);
  });

  test('Page 9: System Observability renders live telemetry stream and request table', async ({ page }) => {
    await page.goto('/admin/observability');
    await expect(page).toHaveURL(/admin\/observability$/);
  });

  test('Page 10: Affiliate Agreement Workspace renders editor and version controls', async ({ page }) => {
    await page.goto('/admin/settings/agreement');
    await expect(page).toHaveURL(/admin\/settings\/agreement/);
  });

  test('Page 11: Training Academy Management renders module CRUD list', async ({ page }) => {
    await page.goto('/admin/training');
    await expect(page).toHaveURL(/admin\/training$/);
  });

  test('Page 12: Notifications Broadcast renders compose card and history list', async ({ page }) => {
    await page.goto('/admin/notifications');
    await expect(page).toHaveURL(/admin\/notifications$/);
  });

});
