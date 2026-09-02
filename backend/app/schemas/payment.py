from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class RazorpayCreateOrderRequest(BaseModel):
    amount_paise: int = Field(..., gt=0)
    type: str = Field("wallet_topup", json_schema_extra={"example": "wallet_topup"})

class RazorpayOrderResponse(BaseModel):
    payment_id: str
    razorpay_order_id: str
    amount_paise: int
    key_id: str

class RazorpayWebhookPayload(BaseModel):
    event: str
    payload: Dict[str, Any]

class RazorpayVerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    purpose: str = Field("order_payment", json_schema_extra={"example": "order_payment"})
    amount_paise: Optional[int] = None

class RazorpayVerifyPaymentResponse(BaseModel):
    verified: bool
    status: str
    payment_id: str
    order_id: str
    message: str
