import { test, expect } from '@playwright/test';

test.describe('Seven-Hour Cutoff Boundary E2E Verification', () => {
  test('exact 10:30 PM boundary is Available, 10:31 PM is Booking Closed for tomorrow morning', async ({ page }) => {
    // 1. Navigate to Home first, then set initial time to 10:30 PM (22:30) on 2026-08-31
    await page.goto('/');
    await page.evaluate(() => {
      const timeStr = '2026-08-31T22:30:00+05:30';
      localStorage.setItem('prototypeCurrentTime', timeStr);
      const raw = localStorage.getItem('farmFreshDairyState_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.data.simulatedTimeISO = timeStr;
        localStorage.setItem('farmFreshDairyState_v1', JSON.stringify(parsed));
      }
    });

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
    const morningSlotCard = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningSlotCard).toContainText('AVAILABLE', { timeout: 10000 });

    // 2. Advance simulated time by 1 minute to 10:31 PM (22:31)
    await page.evaluate(() => {
      const timeStr = '2026-08-31T22:31:00+05:30';
      localStorage.setItem('prototypeCurrentTime', timeStr);
      const raw = localStorage.getItem('farmFreshDairyState_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.data.simulatedTimeISO = timeStr;
        localStorage.setItem('farmFreshDairyState_v1', JSON.stringify(parsed));
      }
    });

    // Reload page to re-render date slot with new time
    await page.reload();

    // Click Tmrw tab
    await page.getByRole('button', { name: /tmrw/i }).click();

    // Verify Morning slot is now CLOSED at 10:31 PM
    const morningSlotCardAt2231 = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningSlotCardAt2231).toContainText('CLOSED', { timeout: 10000 });

    // Verify Evening slot REMAINS AVAILABLE at 10:31 PM
    const eveningSlotCardAt2231 = page.getByRole('heading', { name: 'Evening Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(eveningSlotCardAt2231).toContainText('AVAILABLE', { timeout: 10000 });
  });
});
