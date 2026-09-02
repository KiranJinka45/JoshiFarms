from typing import Optional
from pydantic import BaseModel, Field

class SlotAvailabilityResponse(BaseModel):
    slot: str
    delivery_date: str
    available: bool
    cutoff_time_iso: str
    slot_start_iso: str
    reason: Optional[str] = None
