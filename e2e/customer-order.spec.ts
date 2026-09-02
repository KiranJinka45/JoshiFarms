import { test, expect } from '@playwright/test';

test.describe('Customer End-to-End Order Journey', () => {
  test('customer can log in via OTP, browse products, select address/slot, place order, and verify server confirmation', async ({ page }) => {
    // 1. Navigate to Profile page
    await page.goto('/profile');
    
    // 2. If logged in, click Sign Out / Logout to surface OTP login screen
    const logoutBtn = page.getByRole('button', { name: /sign out|logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }

    // Mock OTP request network endpoint to prevent sending live emails during automated E2E runs
    await page.route('**/api/v1/auth/otp/request', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'otp_sent',
          email: 'customer@joshidairy.com',
          expires_in_seconds: 300,
          dev_otp: '123456'
        })
      });
    });

    // 3. Fill email address and request OTP
    const emailInput = page.getByPlaceholder('customer@joshidairy.com');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('customer@joshidairy.com');
    await page.getByRole('button', { name: /continue with email/i }).click();

    // 4. Fill 6-digit OTP code (master code 123456)
    const otpInput = page.getByPlaceholder('123456');
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /verify & login/i }).click();

    // 5. Confirm logged-in profile details
    await expect(page.getByText('customer@joshidairy.com')).toBeVisible();

    // 6. Navigate to Home tab
    await page.goto('/');

    // 7. Select product "Fresh Cow Milk"
    await page.getByText('Fresh Cow Milk').first().click();

    // 8. Add to Cart
    await page.getByRole('button', { name: /add to cart/i }).click();

    // 9. Go to Cart
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await expect(page.getByText('Fresh Cow Milk')).toBeVisible();

    // 10. Proceed to Delivery Details (Address Selection)
    await page.getByRole('button', { name: /proceed to delivery details/i }).click();
    await expect(page.getByText('Select Delivery Address')).toBeVisible();

    // 11. Continue to Date & Slot
    await page.getByRole('button', { name: /continue to date & slot/i }).click();
    await expect(page.getByText('Select Time Slot')).toBeVisible();

    // 12. Select Tomorrow tab for open slot
    await page.getByRole('button', { name: /tmrw/i }).click();

    const morningCard = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningCard).toContainText('AVAILABLE');
    await morningCard.click();

    // 13. Continue to Payment
    await page.getByRole('button', { name: /continue to checkout/i }).click();
    await expect(page.getByText('Checkout & Payment')).toBeVisible();

    // 14. Place Order (Submits to POST /api/v1/orders via Wallet/COD/Razorpay)
    await page.getByRole('button', { name: /pay.*from wallet|confirm.*order|pay.*via razorpay/i }).click();

    // 15. Verify Order Confirmation screen
    await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 15000 });
  });
});
