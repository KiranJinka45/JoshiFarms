from datetime import datetime, timezone, timedelta
import pytest
from app.domain.cutoff import get_slot_availability

ist_tz = timezone(timedelta(hours=5, minutes=30))

def test_cutoff_boundary_exact_7_hours():
    # Morning slot start on 2026-09-01: 05:30 AM IST
    # Cutoff time: 2026-08-31 10:30 PM IST (22:30)
    
    # Exact 10:30 PM IST -> AVAILABLE
    at_2230 = datetime(2026, 8, 31, 22, 30, 0, tzinfo=ist_tz)
    res_2230 = get_slot_availability("2026-09-01", "Morning", current_time=at_2230)
    assert res_2230.available is True
    assert res_2230.reason is None

    # 10:31 PM IST (6h 59m before) -> CLOSED
    at_2231 = datetime(2026, 8, 31, 22, 31, 0, tzinfo=ist_tz)
    res_2231 = get_slot_availability("2026-09-01", "Morning", current_time=at_2231)
    assert res_2231.available is False
    assert "Strict 7-hour prior cutoff applies" in res_2231.reason

def test_evening_slot_cutoff_boundary():
    # Evening slot start on 2026-09-01: 05:30 PM IST (17:30)
    # Cutoff time: 2026-09-01 10:30 AM IST (10:30)

    # Exact 10:30 AM IST -> AVAILABLE
    at_1030 = datetime(2026, 9, 1, 10, 30, 0, tzinfo=ist_tz)
    res_1030 = get_slot_availability("2026-09-01", "Evening", current_time=at_1030)
    assert res_1030.available is True

    # 10:31 AM IST -> CLOSED
    at_1031 = datetime(2026, 9, 1, 10, 31, 0, tzinfo=ist_tz)
    res_1031 = get_slot_availability("2026-09-01", "Evening", current_time=at_1031)
    assert res_1031.available is False
