import { test, expect } from '@playwright/test';

test.describe('WhatsApp OTP Meta Cloud API Sandbox Verification', () => {
  test.skip(!process.env.RUN_EXTERNAL_TESTS, 'Skipped: Set RUN_EXTERNAL_TESTS=true with valid WHATSAPP_API_TOKEN to run live sandbox OTP delivery.');

  test('request live WhatsApp OTP and verify receipt payload', async ({ request }) => {
    const response = await request.post('http://localhost:8000/api/v1/auth/otp/request', {
      data: {
        phone_number: process.env.TEST_WHATSAPP_PHONE || '+919876543210'
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('otp_sent');
    expect(body.expires_in_seconds).toBe(300);
    expect(body.phone_number).toBeTruthy();
  });
});
