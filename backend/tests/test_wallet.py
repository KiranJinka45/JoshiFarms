import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_wallet_balance_endpoint():
    """
    Tests GET /api/v1/wallet/balance endpoint.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/wallet/balance?user_id=default_user")
        assert response.status_code == 200
        data = response.json()
        assert "wallet_balance_paise" in data
        assert "wallet_balance_rupees" in data
        assert data["wallet_balance_paise"] >= 0

@pytest.mark.anyio
async def test_wallet_topup_order_creation():
    """
    Tests POST /api/v1/wallet/topup/create-order.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/v1/wallet/topup/create-order", json={
            "amount_paise": 50000
        })
        assert response.status_code == 201
        data = response.json()
        assert "razorpay_order_id" in data
        assert data["amount_paise"] == 50000
        assert data["key_id"] == "rzp_test_TWePovjBoxVVMG"

@pytest.mark.anyio
async def test_wallet_topup_verify_and_credit():
    """
    Tests POST /api/v1/wallet/topup/verify credits balance.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Get balance before
        res_before = await ac.get("/api/v1/wallet/balance?user_id=default_user")
        balance_before = res_before.json()["wallet_balance_paise"]

        # Credit wallet
        response = await ac.post("/api/v1/wallet/topup/verify?user_id=default_user", json={
            "razorpay_order_id": "order_test_wallet_123",
            "razorpay_payment_id": "pay_test_wallet_456",
            "razorpay_signature": "mock_sig",
            "amount_paise": 50000
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "wallet_credited"
        assert data["new_balance_paise"] == balance_before + 50000
