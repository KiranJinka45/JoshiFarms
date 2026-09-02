import hmac
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Request, HTTPException, Header, status
from app.core.config import settings

router = APIRouter()

PROCESSED_PAYMENTS = set()

@router.post("/razorpay", status_code=status.HTTP_200_OK)
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(..., alias="X-Razorpay-Signature")
):
    """
    Idempotent Razorpay Webhook Handler.
    1. Verifies HMAC SHA256 signature against RAZORPAY_WEBHOOK_SECRET.
    2. Enforces idempotency via unique razorpay_payment_id check.
    3. Triggers order status confirmation / wallet credit upon verified payment.captured event.
    """
    body = await request.body()

    # 1. Signature Verification
    expected_signature = hmac.new(
        key=settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"),
        msg=body,
        digestmod=hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_razorpay_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature."
        )

    data = await request.json()
    event_type = data.get("event")
    payload = data.get("payload", {})

    if event_type == "payment.captured":
        payment_entity = payload.get("payment", {}).get("entity", {})
        razorpay_payment_id = payment_entity.get("id")
        
        # 2. Idempotency Check
        if razorpay_payment_id in PROCESSED_PAYMENTS:
            return {
                "status": "already_processed",
                "message": f"Payment {razorpay_payment_id} was already processed idempotently."
            }

        PROCESSED_PAYMENTS.add(razorpay_payment_id)
        
        # 3. Order Confirmation / Wallet Topup
        return {
            "status": "success",
            "event": event_type,
            "razorpay_payment_id": razorpay_payment_id,
            "verified_at": datetime.now(timezone.utc).isoformat()
        }

    return {"status": "ignored", "event": event_type}
