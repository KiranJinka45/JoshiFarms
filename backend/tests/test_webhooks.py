import hmac
import hashlib
import json
import time
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.anyio
async def test_razorpay_webhook_valid_signature_and_idempotency():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payment_id = f"pay_test_wh_{int(time.time() * 1000)}"
        payload_dict = {
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": payment_id,
                        "amount": 50000,
                        "status": "captured"
                    }
                }
            }
        }
        raw_body = json.dumps(payload_dict).encode("utf-8")
        signature = hmac.new(
            key=settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
            msg=raw_body,
            digestmod=hashlib.sha256
        ).hexdigest()

        # First delivery -> success
        res1 = await ac.post(
            "/api/v1/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": signature
            }
        )
        assert res1.status_code == 200
        assert res1.json()["status"] == "success"
        assert res1.json()["razorpay_payment_id"] == payment_id

        # Replay -> already_processed
        res2 = await ac.post(
            "/api/v1/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": signature
            }
        )
        assert res2.status_code == 200
        assert res2.json()["status"] == "already_processed"

@pytest.mark.anyio
async def test_razorpay_webhook_tampered_signature_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        raw_body = b'{"event": "payment.captured"}'
        res = await ac.post(
            "/api/v1/webhooks/razorpay",
            content=raw_body,
            headers={
                "Content-Type": "application/json",
                "X-Razorpay-Signature": "forged_tampered_signature"
            }
        )
        assert res.status_code == 400
        assert "Invalid Razorpay webhook signature" in res.json()["detail"]
