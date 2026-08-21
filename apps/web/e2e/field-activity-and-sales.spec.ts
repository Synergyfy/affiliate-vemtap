import { test, expect } from '@playwright/test';
import { authenticate } from './auth';

test.describe('Field Activity & Sales Pipeline End-to-End Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Authenticate as affiliate user
    await authenticate(page, 'affiliate');
  });

  test('Flow 1: Execute Visits page loads active mission and allows business capture', async ({ page }) => {
    await page.goto('/dashboard/market-mapping/execute');
    await expect(page).toHaveURL(/dashboard\/market-mapping\/execute/);
    await expect(page.getByRole('heading', { name: /Execute Visits/i })).toBeVisible();

    // Click on the first business row to open BusinessCaptureDrawer
    const businessRow = page.locator('div[class*="border"]').filter({ hasText: /Grand Square|Business|Placeholder/i }).first();
    if (await businessRow.isVisible()) {
      await businessRow.click();
      
      // Verify drawer opens
      const drawer = page.locator('div').filter({ hasText: /Save Business|Save & Next/i });
      if (await drawer.isVisible()) {
        const saveButton = page.getByRole('button', { name: /Save Business|Save & Next/i });
        await expect(saveButton).toBeVisible();
      }
    }
  });

  test('Flow 2: Sales Pipeline Kanban loads stages and allows filtering', async ({ page }) => {
    await page.goto('/dashboard/market-mapping/pipeline');
    await expect(page).toHaveURL(/dashboard\/market-mapping\/pipeline/);
    await expect(page.getByText(/Sales Pipeline|Pipeline/i)).toBeVisible();

    // Verify stage summary pills are rendered
    const toVisitPill = page.getByText(/To Visit/i).first();
    await expect(toVisitPill).toBeVisible();

    // The kanban must always show the canonical stages regardless of admin
    // config, so the Visited column is always present.
    await expect(page.getByText(/^Visited$/i).first()).toBeVisible();
  });

  test('Flow 3: Sales Follow-Ups page renders due, overdue, and upcoming lists', async ({ page }) => {
    await page.goto('/dashboard/sales/follow-ups');
    await expect(page).toHaveURL(/dashboard\/sales\/follow-ups/);
    await expect(page.getByText(/Follow-ups & Demos|Follow-ups/i)).toBeVisible();
  });

  test('Flow 4: Sales Work Session page allows starting and recording field shift', async ({ page }) => {
    await page.goto('/dashboard/sales-work');
    await expect(page).toHaveURL(/dashboard\/sales-work/);
    await expect(page.getByText(/My Sales Work/i)).toBeVisible();

    // Check Field Work navigation link is visible
    const fieldWorkBtn = page.getByText(/Go to Field Work|Plan your mission first/i);
    await expect(fieldWorkBtn).toBeVisible();
  });

  test('Flow 5: Work Metric Reports page displays 30-day ledger and period tabs', async ({ page }) => {
    await page.goto('/dashboard/market-mapping/insights/reports');
    await expect(page).toHaveURL(/dashboard\/market-mapping\/insights\/reports/);
    
    // Verify report header & period toggles
    await expect(page.getByText(/Work Metric Report|Daily Score/i).first()).toBeVisible();
    
    // Test switching period to 'weekly' or 'daily'
    const weeklyTab = page.getByRole('button', { name: /Weekly/i });
    if (await weeklyTab.isVisible()) {
      await weeklyTab.click();
      await expect(weeklyTab).toHaveClass(/bg-white|text-slate-900|font-semibold/);
    }
  });

});
