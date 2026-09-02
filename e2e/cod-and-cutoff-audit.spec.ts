import { test, expect } from '@playwright/test';

test.describe('Manual Walkthrough Audit: COD Restrictions, Slot Windows, and Cutoffs', () => {

  test('1. Morning Slot: COD is strictly greyed out, disabled, and clicking it does not change payment method', async ({ page }) => {
    await page.goto('/');
    
    // 1. Add product to cart
    await page.getByText('Fresh Cow Milk').first().click();
    await page.getByRole('button', { name: /add to cart/i }).click();

    // 2. Go to Cart -> Address -> Date & Slot
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await page.getByRole('button', { name: /proceed to delivery details/i }).click();
    await page.getByRole('button', { name: /continue to date & slot/i }).click();

    // 3. Verify 1-hour slot text for Morning
    await page.getByRole('button', { name: /tmrw/i }).click();
    await expect(page.getByText('5:30 AM – 6:30 AM')).toBeVisible();

    const morningCard = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningCard).toContainText('AVAILABLE');
    await morningCard.click();

    // 4. Continue to Checkout
    await page.getByRole('button', { name: /continue to checkout/i }).click();
    await expect(page.getByText('Checkout & Payment')).toBeVisible();

    // 5. Assert COD card styling and disabled state
    const codCard = page.getByText('Cash on Delivery (COD)').locator('xpath=ancestor::div[contains(@class, "rounded-xl border")]');
    await expect(codCard).toHaveClass(/cursor-not-allowed/);
    await expect(codCard).toHaveClass(/opacity-60/);
    await expect(page.getByText('Evening Slots Only')).toBeVisible();
    await expect(page.getByText(/Unavailable for 5:30 AM drop-offs/)).toBeVisible();

    const codRadio = codCard.locator('input[type="radio"]');
    await expect(codRadio).toBeDisabled();
    await expect(codRadio).not.toBeChecked();

    // 6. Attempt click on COD card
    await codCard.click({ force: true });

    // Assert COD is still NOT checked and payment method remains Wallet
    await expect(codRadio).not.toBeChecked();
    await expect(page.getByRole('button', { name: /pay.*from wallet/i })).toBeVisible();
  });

  test('2. Evening Slot: COD is fully active, selectable, and completes order through Driver QR and Cash collection check', async ({ page }) => {
    await page.goto('/');

    // 1. Add product to cart
    await page.getByText('Fresh Cow Milk').first().click();
    await page.getByRole('button', { name: /add to cart/i }).click();

    // 2. Go to Cart -> Address -> Date & Slot
    await page.getByRole('link', { name: 'Cart', exact: true }).click();
    await page.getByRole('button', { name: /proceed to delivery details/i }).click();
    await page.getByRole('button', { name: /continue to date & slot/i }).click();

    // 3. Verify 1-hour slot text for Evening & Select it
    await page.getByRole('button', { name: /tmrw/i }).click();
    await expect(page.getByText('5:30 PM – 6:30 PM')).toBeVisible();

    const eveningCard = page.getByRole('heading', { name: 'Evening Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(eveningCard).toContainText('AVAILABLE');
    await eveningCard.click();

    // 4. Continue to Checkout
    await page.getByRole('button', { name: /continue to checkout/i }).click();
    await expect(page.getByText('Checkout & Payment')).toBeVisible();

    // 5. Select Cash on Delivery (COD)
    const codCard = page.getByText('Cash on Delivery (COD)').locator('xpath=ancestor::div[contains(@class, "rounded-xl border")]');
    await expect(codCard).toHaveClass(/cursor-pointer/);
    await expect(page.getByText('Pay at Doorstep')).toBeVisible();

    await codCard.click();

    const codRadio = codCard.locator('input[type="radio"]');
    await expect(codRadio).toBeChecked();

    // 6. Submit COD Order
    const placeOrderBtn = page.getByRole('button', { name: /confirm cod order/i });
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // 7. Verify Confirmation
    await expect(page.getByText('Order Placed!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('COD', { exact: true })).toBeVisible();

    // 8. Driver Flow for COD fulfillment
    await page.getByRole('button', { name: /driver/i }).click();
    await expect(page.getByText('Driver Hub')).toBeVisible();

    await page.getByRole('button', { name: /start shift/i }).click();
    await page.getByText('Rahul Sharma').click();
    await expect(page.getByText('Stop Details #1')).toBeVisible();

    // Verify Doorstep COD card
    await expect(page.getByText(/Collect ₹.* at Doorstep/)).toBeVisible();

    // Open & Close QR modal
    await page.getByRole('button', { name: /show qr/i }).click();
    await expect(page.getByText(/Scan & Pay/)).toBeVisible();
    await page.getByRole('button', { name: /close qr/i }).click();

    // Mark Arrived
    await page.getByRole('button', { name: /mark arrived/i }).click();
    await expect(page.getByText('Proof of Delivery')).toBeVisible();

    // Check cash collection confirmation box
    const cashBox = page.locator('input[type="checkbox"]');
    await expect(cashBox).toBeVisible();
    await cashBox.check();
    await expect(cashBox).toBeChecked();

    // Complete delivery
    await page.getByRole('button', { name: /complete delivery/i }).click();
    await expect(page.getByText('Delivery Completed!')).toBeVisible();
  });

  test('3. Cutoff Math: 1-hour window slot starts at 5:30 AM/PM with exact 10:30 PM / 10:30 AM 7-hour cutoffs', async ({ page }) => {
    // Helper to set simulated time
    const setTime = async (timeStr: string) => {
      await page.evaluate((iso) => {
        localStorage.setItem('prototypeCurrentTime', iso);
        const raw = localStorage.getItem('farmFreshDairyState_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.data.simulatedTimeISO = iso;
          localStorage.setItem('farmFreshDairyState_v1', JSON.stringify(parsed));
        }
      }, timeStr);
      await page.reload();
    };

    // 1. Add item to cart
    await page.goto('/');
    await page.getByText('Fresh Cow Milk').first().click();
    await page.getByRole('button', { name: /add to cart/i }).click();

    // 1. Morning Cutoff: Slot start 5:30 AM on 2026-09-01 -> Cutoff 10:30 PM (22:30) on 2026-08-31
    // Case A: 22:30:00 (exact boundary) -> AVAILABLE for tomorrow morning
    await setTime('2026-08-31T22:30:00+05:30');
    await page.goto('/checkout/slot');
    await page.getByRole('button', { name: /tmrw/i }).click();
    const morningCardBoundary = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningCardBoundary).toContainText('AVAILABLE');

    // Case B: 22:31:00 (1 minute past cutoff) -> CLOSED for tomorrow morning
    await setTime('2026-08-31T22:31:00+05:30');
    await page.goto('/checkout/slot');
    await page.getByRole('button', { name: /tmrw/i }).click();
    const morningCardClosed = page.getByRole('heading', { name: 'Morning Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(morningCardClosed).toContainText('CLOSED');

    // 2. Evening Cutoff: Slot start 17:30 (5:30 PM) on 2026-09-01 -> Cutoff 10:30 AM (10:30) on 2026-09-01
    // Case C: 10:30:00 (exact boundary) -> AVAILABLE for today evening
    await setTime('2026-09-01T10:30:00+05:30');
    await page.goto('/checkout/slot');
    await page.getByRole('button', { name: /today/i }).click();
    const eveningCardBoundary = page.getByRole('heading', { name: 'Evening Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(eveningCardBoundary).toContainText('AVAILABLE');

    // Case D: 10:31:00 (1 minute past cutoff) -> CLOSED for today evening
    await setTime('2026-09-01T10:31:00+05:30');
    await page.goto('/checkout/slot');
    await page.getByRole('button', { name: /today/i }).click();
    const eveningCardClosed = page.getByRole('heading', { name: 'Evening Slot' }).locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]');
    await expect(eveningCardClosed).toContainText('CLOSED');

    // Clean up prototype time
    await page.evaluate(() => {
      localStorage.removeItem('prototypeCurrentTime');
    });
  });

});
