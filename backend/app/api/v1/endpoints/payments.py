import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.schemas.payment import (
    RazorpayCreateOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyPaymentRequest,
    RazorpayVerifyPaymentResponse,
    RazorpayWebhookPayload,
)
from app.core.config import settings
from app.services.razorpay_client import razorpay_service

router = APIRouter()

@router.post("/create-order", response_model=RazorpayOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_razorpay_order(payload: RazorpayCreateOrderRequest):
    """
    Create a Razorpay order server-side for wallet top-up or direct order checkout.
    Uses live Razorpay API when configured with active credentials.
    Returns razorpay_order_id to hand over to Razorpay Checkout JS / SDK.
    """
    if payload.amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount in paise must be greater than zero."
        )

    # If live test or production keys are present, create a real order on Razorpay
    if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_ID.startswith("rzp_") and settings.RAZORPAY_KEY_SECRET:
        try:
            live_res = await razorpay_service.create_live_order(
                amount_paise=payload.amount_paise,
                currency="INR",
                receipt=f"rcpt_{uuid.uuid4().hex[:8]}"
            )
            if live_res["status_code"] in [200, 201]:
                rzp_data = live_res["response"]
                return RazorpayOrderResponse(
                    payment_id=f"pay_{uuid.uuid4().hex[:12]}",
                    razorpay_order_id=rzp_data["id"],
                    amount_paise=rzp_data["amount"],
                    key_id=settings.RAZORPAY_KEY_ID
                )
            else:
                desc = live_res.get("response", {}).get("error", {}).get("description", "Unknown error")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Razorpay order creation failed: {desc}"
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to communicate with Razorpay API: {str(e)}"
            )

    # Local fallback for mock tests without network credentials
    order_data = razorpay_service.create_order(payload.amount_paise)
    return RazorpayOrderResponse(
        payment_id=f"pay_{uuid.uuid4().hex[:12]}",
        razorpay_order_id=order_data["id"],
        amount_paise=payload.amount_paise,
        key_id=settings.RAZORPAY_KEY_ID
    )

@router.post("/verify-payment", response_model=RazorpayVerifyPaymentResponse, status_code=status.HTTP_200_OK)
async def verify_razorpay_payment(payload: RazorpayVerifyPaymentRequest):
    """
    Cryptographically verify the Razorpay payment signature server-side using HMAC-SHA256.
    Ensures that payment claims from the browser cannot be forged or tampered with.
    """
    is_valid = razorpay_service.verify_payment_signature(
        razorpay_order_id=payload.razorpay_order_id,
        razorpay_payment_id=payload.razorpay_payment_id,
        razorpay_signature=payload.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Invalid cryptographic signature. Transaction rejected."
        )

    return RazorpayVerifyPaymentResponse(
        verified=True,
        status="verified",
        payment_id=payload.razorpay_payment_id,
        order_id=payload.razorpay_order_id,
        message=f"Payment verified successfully for {payload.purpose}"
    )
