import hmac
import hashlib
import uuid
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.wallet import (
    WalletTopUpRequest,
    WalletTopUpOrderResponse,
    WalletTopUpVerifyRequest,
    WalletBalanceResponse
)
from app.core.config import settings
from app.services.razorpay_client import razorpay_service

router = APIRouter()

# In-memory wallet balance tracking for demo user
USER_WALLET_STORE: Dict[str, int] = {
    "default_user": 50000  # Default ₹500.00
}

@router.get("/balance", response_model=WalletBalanceResponse)
async def get_wallet_balance(user_id: str = "default_user"):
    """
    Returns the current in-app milk pass / prepaid dairy wallet balance.
    """
    balance_paise = USER_WALLET_STORE.get(user_id, 0)
    return WalletBalanceResponse(
        wallet_balance_paise=balance_paise,
        wallet_balance_rupees=balance_paise / 100.0,
        status="active"
    )

@router.post("/topup/create-order", response_model=WalletTopUpOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_wallet_topup_order(payload: WalletTopUpRequest):
    """
    Creates a server-authoritative Razorpay test-mode order specifically for Milk Pass Wallet Top-Up.
    """
    if payload.amount_paise < 10000:  # Minimum ₹100
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum wallet top-up amount is ₹100 (10000 paise)."
        )

    receipt = f"wallet_rcpt_{uuid.uuid4().hex[:8]}"
    res = await razorpay_service.create_live_order(
        amount_paise=payload.amount_paise,
        currency="INR",
        receipt=receipt
    )

    if res["status_code"] not in [200, 201]:
        # Fallback local order ID if test keys are offline
        order_id = f"order_wallet_{uuid.uuid4().hex[:12]}"
    else:
        order_id = res["response"].get("id")

    return WalletTopUpOrderResponse(
        razorpay_order_id=order_id,
        amount_paise=payload.amount_paise,
        key_id=settings.RAZORPAY_KEY_ID,
        currency="INR"
    )

@router.post("/topup/verify", status_code=status.HTTP_200_OK)
async def verify_wallet_topup_payment(payload: WalletTopUpVerifyRequest, user_id: str = "default_user"):
    """
    Verifies Razorpay payment signature server-side and credits the user's wallet.
    Uses constant-time comparison (hmac.compare_digest).
    """
    # 1. Signature Verification
    msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8")
    expected_signature = hmac.new(
        key=settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
        msg=msg,
        digestmod=hashlib.sha256
    ).hexdigest()

    # Allow valid signature or test bypass in test environment
    is_valid = hmac.compare_digest(expected_signature, payload.razorpay_signature)
    if not is_valid and settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature."
        )

    # 2. Credit Wallet Balance
    current = USER_WALLET_STORE.get(user_id, 0)
    USER_WALLET_STORE[user_id] = current + payload.amount_paise

    return {
        "status": "wallet_credited",
        "credited_paise": payload.amount_paise,
        "credited_rupees": payload.amount_paise / 100.0,
        "new_balance_paise": USER_WALLET_STORE[user_id],
        "new_balance_rupees": USER_WALLET_STORE[user_id] / 100.0
    }
