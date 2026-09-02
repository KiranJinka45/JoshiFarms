from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from app.domain.cutoff import get_slot_availability

def check_low_balance_subscriptions(
    subscriptions_list: List[Dict[str, Any]],
    user_wallets: Dict[str, int],
    lead_hours: int = 3
) -> List[Dict[str, Any]]:
    """
    Scheduled Job / Worker Function: Pre-Cutoff Low-Balance Checker & Nudge Trigger.
    Runs prior to the 7-hour cutoff boundary (e.g., at 7:30 PM for 10:30 PM morning slot cutoff).
    Checks upcoming subscription deliveries and flags users with insufficient wallet balance
    before the cutoff point, triggering WhatsApp/SMS nudges & Razorpay Autopay mandates.
    """
    current_time = datetime.now(timezone.utc)
    warnings_triggered = []

    for sub in subscriptions_list:
        if sub.get("status") != "active":
            continue

        user_id = sub.get("user_id")
        slot_name = sub.get("slot_name", "Morning")
        delivery_date_str = sub.get("next_delivery_date")
        subtotal_paise = sub.get("daily_cost_paise", 6000)  # Default ₹60

        if not delivery_date_str:
            continue

        # Calculate cutoff time for upcoming delivery
        slot_status = get_slot_availability(delivery_date_str, slot_name, current_time=current_time)
        
        # Calculate pre-cutoff warning window (e.g., 3 hours prior to 7-hour cutoff = 10 hours before slot)
        warning_window_start = slot_status.cutoff_time - timedelta(hours=lead_hours)

        wallet_balance = user_wallets.get(user_id, 0)
        insufficient = wallet_balance < subtotal_paise

        if insufficient:
            warning_entry = {
                "subscription_id": sub.get("id"),
                "user_id": user_id,
                "delivery_date": delivery_date_str,
                "slot_name": slot_name,
                "required_paise": subtotal_paise,
                "available_paise": wallet_balance,
                "cutoff_time_iso": slot_status.cutoff_time.isoformat(),
                "warning_triggered_at_iso": current_time.isoformat(),
                "nudge_channel": "WhatsApp + SMS",
                "autopay_retry_triggered": True if sub.get("mandate_id") else False,
                "message": (
                    f"Low Balance Warning! Your wallet balance (₹{wallet_balance/100:.2f}) is insufficient "
                    f"for tomorrow's milk delivery (₹{subtotal_paise/100:.2f}). Please top up before "
                    f"{slot_status.cutoff_time.strftime('%I:%M %p')} to prevent order cancellation."
                )
            }
            warnings_triggered.append(warning_entry)

    return warnings_triggered
