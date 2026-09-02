from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException, status
from app.domain.cutoff import get_slot_availability
from app.schemas.slot import SlotAvailabilityResponse

router = APIRouter()

@router.get("/availability", response_model=List[SlotAvailabilityResponse])
async def get_slots_availability(
    date: str = Query(..., description="Target delivery date in YYYY-MM-DD format"),
    simulated_time: Optional[str] = Query(None, description="Optional simulated current time for testing override")
):
    """
    Server-authoritative cutoff availability check endpoint.
    Computes exact 7-hour cutoff boundary against server clock or simulated time override.
    """
    try:
        if simulated_time:
            # Handle URL decoding converting '+' to ' ' in ISO timezone string
            cleaned_time = simulated_time.replace(' ', '+')
            current_time = datetime.fromisoformat(cleaned_time)
            if current_time.tzinfo is None:
                current_time = current_time.replace(tzinfo=timezone.utc)
        else:
            current_time = datetime.now(timezone.utc)

        morning = get_slot_availability(date, "Morning", current_time=current_time)
        evening = get_slot_availability(date, "Evening", current_time=current_time)

        return [
            SlotAvailabilityResponse(
                slot=morning.slot,
                delivery_date=morning.delivery_date,
                available=morning.available,
                cutoff_time_iso=morning.cutoff_time.isoformat(),
                slot_start_iso=morning.slot_start.isoformat(),
                reason=morning.reason
            ),
            SlotAvailabilityResponse(
                slot=evening.slot,
                delivery_date=evening.delivery_date,
                available=evening.available,
                cutoff_time_iso=evening.cutoff_time.isoformat(),
                slot_start_iso=evening.slot_start.isoformat(),
                reason=evening.reason
            )
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
