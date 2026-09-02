import { test, expect } from '@playwright/test';

test.describe('Seven-Hour Cutoff Boundary E2E Verification', () => {
  test('exact 10:30 PM boundary is Available, 10:31 PM is Booking Closed for tomorrow morning', async ({ page }) => {
    // 1. Set initial time to 10:30 PM (22:30) on 2026-08-31
    await page.addInitScript(() => {
      localStorage.setItem('prototypeCurrentTime', '2026-08-31T22:30:00+05:30');
    });

    await page.goto('/');
    await page.getByRole('button', { name: /customer/i }).click();

    // Add item to cart
    await page.getByText('Fresh Cow Milk').first().click();
    await page.getByRole('button', { name: /add to cart/i }).click();

    // Navigate to Date & Slot selection
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await page.getByRole('button', { name: /proceed to delivery details/i }).click();
    await page.getByRole('button', { name: /continue to date & slot/i }).click();

    // Click "Tmrw" (Tomorrow: 2026-09-01) tab
    await page.getByRole('button', { name: /tmrw/i }).click();

    // Verify Morning slot for Tomorrow is AVAILABLE at 10:30 PM
    const morningSlot = page.locator('div', { hasText: 'Morning Slot' }).first();
    await expect(morningSlot).toContainText('AVAILABLE');

    // 2. Advance simulated time by 1 minute to 10:31 PM (22:31)
    await page.evaluate(() => {
      localStorage.setItem('prototypeCurrentTime', '2026-08-31T22:31:00+05:30');
    });

    // Reload page to re-render date slot with new time
    await page.reload();

    // Re-select Tmrw tab
    await page.getByRole('button', { name: /tmrw/i }).click();

    // Verify Morning slot is now CLOSED at 10:31 PM
    const morningSlotAt2231 = page.locator('div', { hasText: 'Morning Slot' }).first();
    await expect(morningSlotAt2231).toContainText('CLOSED');

    // Verify Evening slot REMAINS AVAILABLE at 10:31 PM
    const eveningSlotAt2231 = page.locator('div', { hasText: 'Evening Slot' }).first();
    await expect(eveningSlotAt2231).toContainText('AVAILABLE');
  });
});
