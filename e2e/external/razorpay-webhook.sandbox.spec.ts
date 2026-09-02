import { test, expect } from '@playwright/test';
import crypto from 'crypto';

test.describe('Razorpay Live Webhook HMAC-SHA256 Sandbox Verification', () => {
  test.skip(!process.env.RUN_EXTERNAL_TESTS, 'Skipped: Set RUN_EXTERNAL_TESTS=true to run live webhook replay & tampering tests.');

  test('valid HMAC-SHA256 signature is accepted and idempotent replay is deduplicated', async ({ request }) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_mock_webhook_secret';
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_sandbox_test_' + Date.now(),
            amount: 50000,
            status: 'captured'
          }
        }
      }
    });

    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    // 1. Initial valid delivery
    const res1 = await request.post('http://localhost:8000/api/v1/webhooks/razorpay', {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
      }
    });

    expect(res1.status()).toBe(200);
    const body1 = await res1.json();
    expect(body1.status).toBe('success');

    // 2. Replay of identical payment entity -> Must return already_processed
    const res2 = await request.post('http://localhost:8000/api/v1/webhooks/razorpay', {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature
      }
    });

    expect(res2.status()).toBe(200);
    const body2 = await res2.json();
    expect(body2.status).toBe('already_processed');
  });

  test('tampered payload is rejected with HTTP 400 Bad Request', async ({ request }) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_mock_webhook_secret';
    const payload = JSON.stringify({ event: 'payment.captured' });
    const fakeSignature = 'invalid_tampered_signature_hex';

    const response = await request.post('http://localhost:8000/api/v1/webhooks/razorpay', {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': fakeSignature
      }
    });

    expect(response.status()).toBe(400);
  });
});
