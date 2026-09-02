import { test, expect } from '@playwright/test';

test.describe('Exceptions, Role Isolation & Data Reset E2E', () => {
  test('seed exception triggers work and report in Admin exceptions queue', async ({ page }) => {
    await page.goto('/');

    // 1. Open Debugger
    await page.getByRole('button', { name: /debugger/i }).click();
    await expect(page.getByText('Simulated Time Provider')).toBeVisible();

    // 2. Trigger seed unassigned order
    await page.getByRole('button', { name: /\+ seed unassigned order/i }).click();

    // 3. Switch to Admin role and open Exceptions
    await page.getByRole('button', { name: /admin/i }).click();
    await page.getByRole('link', { name: /exceptions/i }).click();
    await expect(page.getByText('Delivery & Depot Exceptions Queue')).toBeVisible();
    await expect(page.getByText('Depot Assignment Failure').first()).toBeVisible();
  });

  test('role isolation prevents customer from seeing admin or driver controls', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /customer/i }).click();

    // Verify customer bottom nav is present
    await expect(page.getByRole('link', { name: /home/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /profile/i })).toBeVisible();

    // Verify admin sidebar navigation is NOT visible
    await expect(page.getByText('Dispatcher Portal')).not.toBeVisible();
  });

  test('prototype data reset returns state cleanly to seed defaults', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /debugger/i }).click();
    await page.getByRole('button', { name: /reset prototype data/i }).click();

    // Reload page and verify state resets cleanly
    await page.reload();
    await expect(page.getByText('Farm Fresh Products')).toBeVisible();
  });
});
