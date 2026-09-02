import pytest
import os
from app.services.otp_service import OTPService
from app.core.config import settings

@pytest.mark.anyio
async def test_send_email_otp_dev_fallback():
    """
    Verifies that when RESEND_API_KEY is not configured or set to dev/mock,
    OTPService returns a clean fallback envelope with dev_otp.
    """
    service = OTPService(resend_api_key="")
    result = await service.send_email_otp("test@example.com", "654321")
    assert result["channel"] == "email_dev_fallback"
    assert result["delivered"] is True
    assert result["dev_otp"] == "654321"
    assert result["recipient"] == "test@example.com"

@pytest.mark.anyio
async def test_send_email_otp_live_resend_sandbox():
    """
    When RESEND_API_KEY is supplied (e.g. re_...), dispatches a real transactional
    OTP email to test inbox and asserts Resend API returns HTTP 200 with email_id.
    Skipped if no live key is configured.
    """
    if not os.environ.get("RUN_EXTERNAL_TESTS"):
        pytest.skip("Skipped by default to preserve Resend quota. Set RUN_EXTERNAL_TESTS=1 to trigger live email dispatch.")

    api_key = getattr(settings, "RESEND_API_KEY", None) or os.environ.get("RESEND_API_KEY")
    if not api_key or api_key.startswith("mock") or api_key == "":
        pytest.skip("RESEND_API_KEY not provided in environment. Skipping live email dispatch.")

    service = OTPService(resend_api_key=api_key)
    # Uses verified test email or onboarding recipient
    target_email = os.environ.get("TEST_RECIPIENT_EMAIL", "delivered@resend.dev")
    result = await service.send_email_otp(target_email, "987123")
    
    assert result["channel"] == "resend_api"
    assert result["delivered"] is True
    assert result["status_code"] in [200, 201]
    assert "email_id" in result
