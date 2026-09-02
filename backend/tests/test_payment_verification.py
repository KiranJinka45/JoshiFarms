import hmac
import hashlib
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings

@pytest.mark.anyio
async def test_payment_verification_valid_signature():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        order_id = "order_test_12345"
        payment_id = "pay_test_67890"
        
        msg = f"{order_id}|{payment_id}".encode("utf-8")
        valid_signature = hmac.new(
            key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            msg=msg,
            digestmod=hashlib.sha256
        ).hexdigest()

        response = await ac.post("/api/v1/payments/verify-payment", json={
            "razorpay_order_id": order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": valid_signature,
            "purpose": "order_payment",
            "amount_paise": 15000
        })

        assert response.status_code == 200
        data = response.json()
        assert data["verified"] is True
        assert data["status"] == "verified"
        assert data["payment_id"] == payment_id

@pytest.mark.anyio
async def test_payment_verification_tampered_signature_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post("/api/v1/payments/verify-payment", json={
            "razorpay_order_id": "order_test_12345",
            "razorpay_payment_id": "pay_test_67890",
            "razorpay_signature": "fake_or_tampered_signature_string",
            "purpose": "wallet_topup",
            "amount_paise": 50000
        })

        assert response.status_code == 400
        assert "Invalid cryptographic signature" in response.json()["detail"]
