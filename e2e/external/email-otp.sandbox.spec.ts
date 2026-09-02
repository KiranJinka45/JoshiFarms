import { test, expect } from '@playwright/test';

test.describe('Email OTP Transactional Sandbox Verification', () => {
  test.skip(!process.env.RUN_EXTERNAL_TESTS, 'Skipped: Set RUN_EXTERNAL_TESTS=true with valid RESEND_API_KEY to run live sandbox email delivery.');

  test('request live Email OTP and verify receipt payload', async ({ request }) => {
    const testEmail = process.env.TEST_EMAIL || 'customer@joshidairy.com';
    const response = await request.post('http://localhost:8000/api/v1/auth/otp/request', {
      data: {
        email: testEmail
      }
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('otp_sent');
    expect(body.expires_in_seconds).toBe(300);
    expect(body.email).toBe(testEmail.toLowerCase());
  });
});
