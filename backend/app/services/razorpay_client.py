import uuid
import hmac
import hashlib
import base64
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

class RazorpayService:
    def __init__(self, key_id: Optional[str] = None, key_secret: Optional[str] = None):
        self.key_id = key_id or settings.RAZORPAY_KEY_ID
        self.key_secret = key_secret or settings.RAZORPAY_KEY_SECRET
        self.webhook_secret = settings.RAZORPAY_WEBHOOK_SECRET
        self.api_base_url = "https://api.razorpay.com/v1"

    async def create_live_order(self, amount_paise: int, currency: str = "INR", receipt: Optional[str] = None) -> Dict[str, Any]:
        """
        Creates a real Order on Razorpay via official HTTPS API (Sandbox / Production).
        Requires active RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.
        """
        if not receipt:
            receipt = f"rcpt_{uuid.uuid4().hex[:8]}"

        payload = {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "payment_capture": 1
        }

        auth_header = base64.b64encode(f"{self.key_id}:{self.key_secret}".encode()).decode()
        headers = {
            "Authorization": f"Basic {auth_header}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base_url}/orders",
                json=payload,
                headers=headers,
                timeout=10.0
            )
            return {
                "status_code": response.status_code,
                "response": response.json()
            }

    def create_order(self, amount_paise: int, currency: str = "INR", receipt: Optional[str] = None) -> Dict[str, Any]:
        """
        Local/Test helper for mock and deterministic test harnesses.
        """
        if not receipt:
            receipt = f"rcpt_{uuid.uuid4().hex[:8]}"

        order_id = f"order_{uuid.uuid4().hex[:14]}"
        return {
            "id": order_id,
            "entity": "order",
            "amount": amount_paise,
            "amount_paid": 0,
            "amount_due": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "status": "created",
            "key_id": self.key_id
        }

    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """
        Cryptographically verifies standard Razorpay Checkout Payment Signature:
        HMAC-SHA256(order_id + "|" + payment_id, key_secret) == razorpay_signature
        Prevents client-side spoofing / bypass of payment completion.
        """
        if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
            return False
            
        message = f"{razorpay_order_id}|{razorpay_payment_id}".encode("utf-8")
        expected_signature = hmac.new(
            key=self.key_secret.encode("utf-8"),
            msg=message,
            digestmod=hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, razorpay_signature)

    def verify_webhook_signature(self, body_bytes: bytes, signature: str) -> bool:
        """
        Verifies Razorpay HMAC SHA256 Webhook Signature.
        """
        expected_signature = hmac.new(
            key=self.webhook_secret.encode("utf-8"),
            msg=body_bytes,
            digestmod=hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, signature)

razorpay_service = RazorpayService()
