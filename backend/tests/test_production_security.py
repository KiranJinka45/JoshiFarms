import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_security_headers_present():
    """
    Verifies that security headers middleware injects critical protection headers
    on every HTTP response (nosniff, clickjacking frame protection, XSS protection).
    """
    response = client.get("/health")
    assert response.status_code == 200
    headers = response.headers
    assert headers.get("x-content-type-options") == "nosniff"
    assert headers.get("x-frame-options") == "DENY"
    assert headers.get("x-xss-protection") == "1; mode=block"
    assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"

def test_cors_origin_lockdown():
    """
    Verifies that CORS origins are restricted to configured allowlist:
    - Allowed origin (e.g. http://localhost:5173) receives Access-Control-Allow-Origin header.
    - Malicious / arbitrary origin receives no Access-Control-Allow-Origin header.
    - Wildcard '*' is strictly absent.
    """
    # 1. Allowed origin
    res_allowed = client.options(
        "/api/v1/auth/otp/request",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST"
        }
    )
    assert res_allowed.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert res_allowed.headers.get("access-control-allow-origin") != "*"

    # 2. Disallowed external origin
    res_disallowed = client.options(
        "/api/v1/auth/otp/request",
        headers={
            "Origin": "https://malicious-attacker.com",
            "Access-Control-Request-Method": "POST"
        }
    )
    assert res_disallowed.headers.get("access-control-allow-origin") is None

def test_master_otp_fails_closed_in_production():
    """
    Verifies fail-closed authentication security:
    In ENVIRONMENT=production, master developer OTP '123456' is strictly rejected with 401.
    """
    with patch.object(settings, "ENVIRONMENT", "production"):
        res = client.post(
            "/api/v1/auth/otp/verify",
            json={"email": "kiranjinkakumar@gmail.com", "otp": "123456"}
        )
        assert res.status_code == 401
        assert "Invalid OTP code" in res.json()["detail"]

def test_otp_request_rate_limiting():
    """
    Verifies infrastructure-level rate limiting on /otp/request:
    Max 5 OTP requests per hour per email identifier. 6th attempt returns 429.
    """
    email = "spam.target@example.com"
    for _ in range(5):
        res = client.post("/api/v1/auth/otp/request", json={"email": email})
        assert res.status_code in [200, 502]

    # 6th attempt MUST return 429 Too Many Requests
    res6 = client.post("/api/v1/auth/otp/request", json={"email": email})
    assert res6.status_code == 429
    assert "Rate limit exceeded" in res6.json()["detail"]
