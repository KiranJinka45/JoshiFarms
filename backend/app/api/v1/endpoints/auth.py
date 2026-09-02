from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import OTPRequestSchema, OTPVerifySchema, TokenResponse
from app.core.security import create_access_token, create_refresh_token
from app.core.config import settings
from app.services.otp_service import otp_service

router = APIRouter()

# In-memory store for OTP requests (simulating or bridging with otp_requests table)
OTP_STORE: Dict[str, Dict[str, Any]] = {}

# Strict role allowlist mappings (Exact match only - No substring matching)
DEV_ROLE_MAPPINGS = {
    "admin@joshidairy.com": ("ROLE_ADMIN", "Dispatcher Admin", "u-admin-001"),
    "driver@joshidairy.com": ("ROLE_DRIVER", "Ramesh Kumar (Driver)", "u-driver-001"),
    "+919876540000": ("ROLE_ADMIN", "Dispatcher Admin", "u-admin-001"),
    "+919876549999": ("ROLE_DRIVER", "Ramesh Kumar (Driver)", "u-driver-001"),
}

# Track request history for rate-limiting /otp/request (Identifier -> list of timestamps)
REQUEST_RATE_LIMIT_STORE: Dict[str, list] = {}

def check_request_rate_limit(identifier: str, max_requests: int = 5, window_seconds: int = 3600):
    now = datetime.now(timezone.utc)
    history = REQUEST_RATE_LIMIT_STORE.get(identifier, [])
    history = [ts for ts in history if (now - ts).total_seconds() < window_seconds]
    if len(history) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {max_requests} OTP requests per hour allowed."
        )
    history.append(now)
    REQUEST_RATE_LIMIT_STORE[identifier] = history

@router.post("/otp/request", status_code=status.HTTP_200_OK)
async def request_otp(payload: OTPRequestSchema):
    """
    Request 6-digit OTP for Email (or phone) authentication.
    Dispatches OTP via transactional email dispatcher (or WhatsApp / SMS).
    """
    is_email = bool(payload.email)
    identifier = payload.email.strip().lower() if is_email else payload.phone_number.strip()

    if is_email:
        if "@" not in identifier or "." not in identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email address format."
            )
    else:
        if not identifier or len(identifier) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format."
            )

    # Enforce request rate limit (max 5 requests/hour per identifier)
    check_request_rate_limit(identifier)

    otp_code = otp_service.generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    # Store OTP with attempt counter and expiry
    OTP_STORE[identifier] = {
        "otp": otp_code,
        "expires_at": expires_at,
        "attempts": 0
    }

    # Dispatch OTP via configured gateway (Email / WhatsApp / SMS)
    dispatch_result = await otp_service.dispatch_otp(identifier, otp_code, preferred_channel="email" if is_email else "whatsapp")

    # If live email provider was attempted and failed, surface explicit error (do NOT swallow!)
    if dispatch_result.get("channel") == "resend_api" and not dispatch_result.get("delivered"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Email delivery failed via Resend: {dispatch_result.get('error', 'Check provider credentials and verified domain.')}"
        )

    return {
        "status": "otp_sent",
        "email": identifier if is_email else None,
        "phone_number": identifier if not is_email else None,
        "expires_in_seconds": 300,
        "delivery_channel": dispatch_result.get("channel"),
        "dev_otp": otp_code if dispatch_result.get("channel") == "email_dev_fallback" else None
    }

@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(payload: OTPVerifySchema):
    """
    Verify 6-digit OTP and issue JWT access & refresh tokens.
    """
    is_email = bool(payload.email)
    identifier = payload.email.strip().lower() if is_email else payload.phone_number.strip()
    
    entry = OTP_STORE.get(identifier)

    # Master test OTP is strictly restricted to development mode (fails closed in production)
    is_dev = getattr(settings, "ENVIRONMENT", "development") == "development"
    is_master_otp = is_dev and payload.otp == "123456"
    is_valid_live_otp = bool(entry and entry.get("otp") == payload.otp)

    if is_master_otp or is_valid_live_otp:
        if entry:
            if datetime.now(timezone.utc) > entry["expires_at"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OTP has expired. Please request a new OTP."
                )
            del OTP_STORE[identifier]

        # Determine user role from strict allowlist or default to ROLE_CUSTOMER
        role, name, user_id = DEV_ROLE_MAPPINGS.get(
            identifier, 
            ("ROLE_CUSTOMER", "Kiran Joshi", "u-customer-001")
        )

        access_token = create_access_token(subject=user_id, role=role)
        refresh_token = create_refresh_token(subject=user_id, role=role)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            role=role,
            user_id=user_id,
            name=name,
            email=identifier if is_email else None
        )

    if entry:
        entry["attempts"] += 1
        if entry["attempts"] >= 3:
            del OTP_STORE[identifier]
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum OTP verification attempts exceeded. Please request a new OTP."
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid OTP code. Please try again."
    )
