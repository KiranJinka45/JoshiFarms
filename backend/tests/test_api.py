import hmac
import hashlib
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_slot_availability_endpoint():
    response = client.get("/api/v1/delivery-slots/availability?date=2026-09-01")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["slot"] == "Morning"
    assert data[1]["slot"] == "Evening"

def test_order_creation_endpoint():
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=2)).strftime("%Y-%m-%d")
    payload = {
        "address_id": "addr-1",
        "slot_id": 1,
        "delivery_date": tomorrow_str,
        "items": [
            {"product_id": "p1", "quantity": 2}
        ]
    }
    response = client.post("/api/v1/orders", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "placed"
    assert data["subtotal_paise"] == 12000
    assert data["delivery_fee_paise"] == 0
    assert data["total_paise"] == 12000
    assert "cutoff_at_iso" in data

def test_order_creation_cutoff_conflict_revalidation():
    # Past delivery date must fail with 409 Conflict
    past_date_str = "2020-01-01"
    payload = {
        "address_id": "addr-1",
        "slot_id": 1,
        "delivery_date": past_date_str,
        "items": [
            {"product_id": "p1", "quantity": 1}
        ]
    }
    response = client.post("/api/v1/orders", json=payload)
    assert response.status_code == 409
    assert "Cannot book for past delivery dates" in response.json()["detail"]

def test_razorpay_order_creation_endpoint():
    payload = {"amount_paise": 50000, "type": "wallet_topup"}
    response = client.post("/api/v1/payments/create-order", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["amount_paise"] == 50000
    assert data["razorpay_order_id"].startswith("order_")
    assert data["key_id"] == settings.RAZORPAY_KEY_ID

def test_subscription_creation_and_pause():
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    create_payload = {
        "product_id": "p1",
        "quantity": 1,
        "frequency": "daily",
        "slot_id": 1,
        "address_id": "addr-1",
        "start_date": tomorrow_str
    }
    res1 = client.post("/api/v1/subscriptions", json=create_payload)
    assert res1.status_code == 201
    sub_data = res1.json()
    assert sub_data["status"] == "active"
    sub_id = sub_data["id"]

    # Pause subscription
    res2 = client.put(f"/api/v1/subscriptions/{sub_id}/status", json={"status": "paused"})
    assert res2.status_code == 200
    assert res2.json()["status"] == "paused"

def test_subscription_skip_date():
    # Create subscription first
    create_payload = {
        "product_id": "p1",
        "quantity": 1,
        "frequency": "daily",
        "slot_id": 1,
        "address_id": "addr-1",
        "start_date": "2026-09-01"
    }
    res1 = client.post("/api/v1/subscriptions", json=create_payload)
    sub_id = res1.json()["id"]

    # Skip specific date
    res2 = client.post(f"/api/v1/subscriptions/{sub_id}/skip", json={"skip_date": "2026-09-05"})
    assert res2.status_code == 200
    assert res2.json()["skipped_date"] == "2026-09-05"

def test_razorpay_webhook_signature_verification():
    raw_body = b'{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_verify_999"}}}}'
    signature = hmac.new(
        key=settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    headers = {"X-Razorpay-Signature": signature, "Content-Type": "application/json"}
    response = client.post("/api/v1/webhooks/razorpay", content=raw_body, headers=headers)
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["razorpay_payment_id"] == "pay_verify_999"

def test_razorpay_webhook_idempotent_replay():
    raw_body = b'{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_replay_777"}}}}'
    signature = hmac.new(
        key=settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha256
    ).hexdigest()

    headers = {"X-Razorpay-Signature": signature, "Content-Type": "application/json"}
    # 1. First webhook call
    res1 = client.post("/api/v1/webhooks/razorpay", content=raw_body, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"

    # 2. Duplicate webhook replay call
    res2 = client.post("/api/v1/webhooks/razorpay", content=raw_body, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["status"] == "already_processed"

def test_admin_depot_override_audit_log():
    payload = {
        "order_id": "ord-999",
        "target_depot_id": "depot-3",
        "target_depot_name": "Whitefield Distribution Center",
        "reason": "Rerouting due to Koramangala vehicle capacity constraint"
    }
    response = client.post("/api/v1/admin/depots/override", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["action"] == "depot_override"
    assert data["id"].startswith("AUD-")
    assert data["reason"] == payload["reason"]
