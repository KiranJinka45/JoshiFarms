from typing import List, Optional
from pydantic import BaseModel, Field

class SubscriptionCreate(BaseModel):
    product_id: str
    quantity: int = Field(1, gt=0)
    frequency: str = Field("daily", json_schema_extra={"example": "daily"})
    days_of_week: Optional[List[int]] = Field(None, json_schema_extra={"example": [1, 3, 5]})
    slot_id: int = Field(1, json_schema_extra={"example": 1})
    address_id: str
    start_date: str = Field(..., json_schema_extra={"example": "2026-09-01"})

class SubscriptionStatusUpdate(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "paused"})  # paused / active / cancelled

class SubscriptionSkipRequest(BaseModel):
    skip_date: str = Field(..., json_schema_extra={"example": "2026-09-03"})

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    quantity: int
    frequency: str
    days_of_week: Optional[List[int]] = None
    slot_id: int
    address_id: str
    status: str
    start_date: str
    created_at_iso: str
