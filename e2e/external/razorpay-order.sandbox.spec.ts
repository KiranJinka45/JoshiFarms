import { test, expect } from '@playwright/test';

test.describe('Razorpay Test Mode Order Creation & Checkout Contract', () => {
  test.skip(!process.env.RUN_EXTERNAL_TESTS, 'Skipped: Set RUN_EXTERNAL_TESTS=true with valid RAZORPAY_KEY_ID to run live sandbox order creation.');

  test('create live Razorpay test mode order entity via backend', async ({ request }) => {
    const response = await request.post('http://localhost:8000/api/v1/payments/create-order', {
      data: {
        amount_paise: 50000,
        currency: 'INR',
        receipt: 'rec_live_test_001'
      }
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.razorpay_order_id).toBeTruthy();
    expect(body.amount_paise).toBe(50000);
    expect(body.key_id).toBeTruthy();
  });
});
