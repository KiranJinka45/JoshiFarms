from datetime import datetime, time, timedelta, timezone
from typing import NamedTuple, Optional

# Slot start times in IST (UTC+05:30)
SLOT_TIMES = {
    "Morning": time(5, 30),
    "Evening": time(17, 30)
}

class SlotAvailability(NamedTuple):
    slot: str
    delivery_date: str
    available: bool
    cutoff_time: datetime
    slot_start: datetime
    reason: Optional[str] = None

def get_slot_availability(
    delivery_date_str: str,
    slot_name: str,
    current_time: Optional[datetime] = None,
    cutoff_hours: int = 7
) -> SlotAvailability:
    """
    Pure server-authoritative cutoff calculation engine.
    Rule: currentTime <= cutoffTime -> AVAILABLE
    Exactly 7 hours before slot start is OPEN; 6 hours 59 minutes before is CLOSED.
    """
    if current_time is None:
        current_time = datetime.now(timezone.utc)
    
    # Ensure current_time is timezone-aware
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)

    # Parse delivery date YYYY-MM-DD
    delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
    
    if slot_name not in SLOT_TIMES:
        raise ValueError(f"Invalid slot name: {slot_name}. Must be 'Morning' or 'Evening'.")

    slot_time = SLOT_TIMES[slot_name]
    
    # Construct exact slot start datetime in IST (+05:30)
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    slot_start = datetime.combine(delivery_date, slot_time, tzinfo=ist_tz)

    # Calculate exact cutoff boundary (slot_start - 7 hours)
    cutoff_time = slot_start - timedelta(hours=cutoff_hours)

    # Convert current_time to IST for exact comparison
    current_time_ist = current_time.astimezone(ist_tz)

    # Check date boundary: Cannot book past dates
    today_ist = current_time_ist.date()
    if delivery_date < today_ist:
        return SlotAvailability(
            slot=slot_name,
            delivery_date=delivery_date_str,
            available=False,
            cutoff_time=cutoff_time,
            slot_start=slot_start,
            reason="Cannot book for past delivery dates."
        )

    # Check 7-hour cutoff boundary: currentTime <= cutoffTime -> AVAILABLE
    available = current_time_ist <= cutoff_time

    reason = None
    if not available:
        reason = (
            f"Booking for {slot_name} slot on {delivery_date_str} closed at "
            f"{cutoff_time.strftime('%I:%M %p')}. Strict {cutoff_hours}-hour prior cutoff applies."
        )

    return SlotAvailability(
        slot=slot_name,
        delivery_date=delivery_date_str,
        available=available,
        cutoff_time=cutoff_time,
        slot_start=slot_start,
        reason=reason
    )
