from typing import List, Optional
from pydantic import BaseModel, Field

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class OrderCreate(BaseModel):
    address_id: str
    slot_id: int
    delivery_date: str = Field(..., json_schema_extra={"example": "2026-09-01"})
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    unit_price_paise: int
    line_total_paise: int

class OrderResponse(BaseModel):
    id: str
    order_number: str
    delivery_date: str
    slot_id: int
    status: str
    subtotal_paise: int
    delivery_fee_paise: int
    total_paise: int
    cutoff_at_iso: str
    created_at_iso: str
    items: List[OrderItemResponse]
