import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

from unittest.mock import patch, AsyncMock

def test_otp_request_and_verify_flow():
    email = "customer.test@joshidairy.com"
    
    # 1. Request Email OTP (mocking external delivery gateway to conserve live quota)
    with patch("app.api.v1.endpoints.auth.otp_service.dispatch_otp", new_callable=AsyncMock) as mock_dispatch:
        mock_dispatch.return_value = {"channel": "resend_api", "delivered": True, "email_id": "test-resend-id"}
        res1 = client.post("/api/v1/auth/otp/request", json={"email": email, "purpose": "login"})
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["status"] == "otp_sent"
        assert data1["email"] == email

    # 2. Verify Email OTP -> Issues JWT Tokens
    res2 = client.post("/api/v1/auth/otp/verify", json={"email": email, "otp": "123456"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "access_token" in data2
    assert "refresh_token" in data2
    assert data2["token_type"] == "bearer"
    assert data2["role"] == "ROLE_CUSTOMER"
    assert data2["email"] == email

def test_otp_max_attempts_rate_limit():
    email = "rate.limited@joshidairy.com"
    client.post("/api/v1/auth/otp/request", json={"email": email})

    # Attempt 1: Bad OTP
    res1 = client.post("/api/v1/auth/otp/verify", json={"email": email, "otp": "000000"})
    assert res1.status_code == 401

    # Attempt 2: Bad OTP
    res2 = client.post("/api/v1/auth/otp/verify", json={"email": email, "otp": "000000"})
    assert res2.status_code == 401

    # Attempt 3: Bad OTP -> 429 Too Many Requests
    res3 = client.post("/api/v1/auth/otp/verify", json={"email": email, "otp": "000000"})
    assert res3.status_code == 429
    assert "Maximum OTP verification attempts exceeded" in res3.json()["detail"]

def test_driver_and_admin_role_issuance():
    # 1. Strict allowlist Driver
    res_driver = client.post("/api/v1/auth/otp/verify", json={"email": "driver@joshidairy.com", "otp": "123456"})
    assert res_driver.status_code == 200
    assert res_driver.json()["role"] == "ROLE_DRIVER"

    # 2. Strict allowlist Admin
    res_admin = client.post("/api/v1/auth/otp/verify", json={"email": "admin@joshidairy.com", "otp": "123456"})
    assert res_admin.status_code == 200
    assert res_admin.json()["role"] == "ROLE_ADMIN"

    # 3. Security check: Attacker attempting substring injection is strictly ROLE_CUSTOMER
    res_attacker = client.post("/api/v1/auth/otp/verify", json={"email": "attacker_admin@gmail.com", "otp": "123456"})
    assert res_attacker.status_code == 200
    assert res_attacker.json()["role"] == "ROLE_CUSTOMER"
