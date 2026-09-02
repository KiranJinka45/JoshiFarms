import { test, expect } from '@playwright/test';

test.describe('Admin Dispatch & Multi-Depot Operations E2E', () => {
  test('admin can view orders, verify primary depot assignment, and execute manual depot override with audit log', async ({ page }) => {
    // 1. Create an order as customer first
    await page.goto('/');
    await page.getByRole('button', { name: /customer/i }).click();
    await page.getByText('Fresh Cow Milk').first().click();
    await page.getByRole('button', { name: /add to cart/i }).click();
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await page.getByRole('button', { name: /proceed to delivery details/i }).click();
    await page.getByRole('button', { name: /continue to date & slot/i }).click();
    
    // Select Tomorrow tab to get guaranteed open slot
    await page.getByRole('button', { name: /tmrw/i }).click();

    const morningCard = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningCard).toContainText('AVAILABLE');
    await morningCard.click();
    await page.getByRole('button', { name: /continue to checkout/i }).click();
    await page.getByRole('button', { name: /pay.*from wallet|confirm.*order|pay.*via razorpay/i }).click();
    await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 15000 });

    // 2. Switch to Admin role
    await page.getByRole('button', { name: /admin/i }).click();
    await expect(page.getByText('Dispatcher Operations Overview')).toBeVisible();

    // 3. Go to Orders section
    await page.getByRole('link', { name: /orders/i }).click();
    await expect(page.getByText('Multi-Depot Order Operations')).toBeVisible();
    await expect(page.getByText('Koramangala Main Depot').first()).toBeVisible();

    // 4. Click Reassign Depot
    await page.getByRole('button', { name: /reassign depot/i }).first().click();
    await expect(page.getByRole('heading', { name: /override depot assignment/i })).toBeVisible();

    // 5. Select Whitefield Distribution Center (depot-3) inside the modal and enter mandatory reason
    await page.locator('div.fixed select').selectOption('depot-3');
    await page.locator('textarea').fill('Rerouting order to Whitefield due to vehicle capacity');
    await page.getByRole('button', { name: /apply reassignment/i }).click();

    // 6. Verify depot status updated to Whitefield
    await expect(page.getByText('Whitefield Distribution Center').first()).toBeVisible();
    await expect(page.getByText('manual').first()).toBeVisible();
  });
});
