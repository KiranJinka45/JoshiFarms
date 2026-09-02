from typing import List, Optional
from pydantic import BaseModel, Field

class WalletTopUpRequest(BaseModel):
    amount_paise: int = Field(..., gt=0, description="Top-up amount in paise (e.g. 50000 for ₹500)")

class WalletTopUpOrderResponse(BaseModel):
    razorpay_order_id: str
    amount_paise: int
    key_id: str
    currency: str = "INR"

class WalletTopUpVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    amount_paise: int

class WalletBalanceResponse(BaseModel):
    wallet_balance_paise: int
    wallet_balance_rupees: float
    status: str = "active"
