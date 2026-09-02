import { test, expect } from '@playwright/test';

test.describe('Customer End-to-End Order Journey', () => {
  test('customer can log in via OTP, browse products, select address/slot, place order, and verify server confirmation', async ({ page }) => {
    // 1. Navigate to Profile page
    await page.goto('/profile');
    
    // 2. If logged in, click Logout to surface OTP login screen
    const logoutBtn = page.getByRole('button', { name: /logout/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }

    // 3. Fill phone number and request OTP
    const phoneInput = page.getByPlaceholder('+919876543210');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    await phoneInput.fill('+919876543210');
    await page.getByRole('button', { name: /send otp/i }).click();

    // 4. Fill 6-digit OTP code (master code 123456)
    const otpInput = page.getByPlaceholder('123456');
    await expect(otpInput).toBeVisible({ timeout: 10000 });
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /verify & login/i }).click();

    // 5. Confirm logged-in profile details
    await expect(page.getByText('+919876543210')).toBeVisible();

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

    // Select Morning slot
    const morningSlot = page.getByText('Morning Slot').first();
    await morningSlot.click();

    // 13. Continue to Payment
    await page.getByRole('button', { name: /continue to checkout/i }).click();
    await expect(page.getByText('Checkout & Payment')).toBeVisible();

    // 14. Place Order (Submits to POST /api/v1/orders)
    await page.getByRole('button', { name: /confirm order/i }).click();

    // 15. Verify Order Confirmation screen
    await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 15000 });
  });
});
