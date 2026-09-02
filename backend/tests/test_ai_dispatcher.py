import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.anyio
async def test_ai_dispatcher_depot_failure_suggestion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/admin/ai/suggest-exception-resolution", json={
            "exception_id": "EXC-1001",
            "order_id": "ORD-9999",
            "exception_type": "Depot Assignment Failure",
            "reason": "No eligible depot serving pincode 560099",
            "description": "Order placed for remote pincode 560099 without an active depot zone match.",
            "pincode": "560099"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["exception_id"] == "EXC-1001"
        assert data["confidence_score"] >= 0.90
        assert data["requires_human_approval"] is True
        assert "depot-1" in data["recommended_depot_id"]

@pytest.mark.anyio
async def test_ai_dispatcher_failed_delivery_suggestion():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/admin/ai/suggest-exception-resolution", json={
            "exception_id": "EXC-2002",
            "order_id": "ORD-8888",
            "exception_type": "Failed Delivery",
            "reason": "Customer Unavailable",
            "description": "Door locked at 5:30 AM drop-off.",
            "pincode": "560034"
        })
        assert res.status_code == 200
        data = res.json()
        assert data["exception_id"] == "EXC-2002"
        assert data["requires_human_approval"] is True
        assert "Evening" in data["suggested_action"]
