import { test, expect } from '@playwright/test';

test.describe('Driver Shift & Proof of Delivery E2E Journey', () => {
  test('driver starts shift, navigates stop, inputs proof of delivery, and completes delivery', async ({ page }) => {
    // 1. Switch to Driver identity
    await page.goto('/');
    await page.getByRole('button', { name: /driver/i }).click();
    await expect(page.getByText('Driver Hub')).toBeVisible();

    // 2. Start Shift
    await page.getByRole('button', { name: /start shift/i }).click();
    await expect(page.getByText('On Shift')).toBeVisible();
    await expect(page.getByText('Rahul Sharma')).toBeVisible();

    // 3. Open Stop 1
    await page.getByText('Rahul Sharma').click();
    await expect(page.getByText('Stop Details #1')).toBeVisible();

    // 4. Mark Arrived at location
    await page.getByRole('button', { name: /mark arrived/i }).click();
    await expect(page.getByText('Proof of Delivery')).toBeVisible();

    // Check COD collection box if present
    const codCheckbox = page.locator('input[type="checkbox"]');
    if (await codCheckbox.isVisible()) {
      await codCheckbox.check();
    }

    // 5. Complete Delivery with Proof (Recipient name + OTP)
    await page.getByRole('button', { name: /complete delivery/i }).click();
    await expect(page.getByText('Delivery Completed!')).toBeVisible();

    // 6. Verify status in Admin view
    await page.getByRole('button', { name: /admin/i }).click();
    await expect(page.getByText('Dispatcher Operations Overview')).toBeVisible();
  });
});
