from datetime import datetime, timezone, timedelta
from app.services.subscription_scheduler import check_low_balance_subscriptions

def test_pre_cutoff_low_balance_warning_nudge():
    # User with ₹20 (2000 paise) wallet balance
    user_wallets = {"u-customer-001": 2000}

    # Upcoming subscription delivery tomorrow (Morning slot) costing ₹60 (6000 paise)
    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    subscriptions = [
        {
            "id": "sub_101",
            "user_id": "u-customer-001",
            "status": "active",
            "slot_name": "Morning",
            "next_delivery_date": tomorrow_str,
            "daily_cost_paise": 6000,
            "mandate_id": "mandate_rzp_mock_123"
        }
    ]

    # Run scheduled low-balance checker job 3 hours prior to cutoff
    warnings = check_low_balance_subscriptions(subscriptions, user_wallets, lead_hours=3)

    assert len(warnings) == 1
    warning = warnings[0]
    assert warning["subscription_id"] == "sub_101"
    assert warning["required_paise"] == 6000
    assert warning["available_paise"] == 2000
    assert warning["nudge_channel"] == "WhatsApp + SMS"
    assert warning["autopay_retry_triggered"] is True
    assert "Low Balance Warning!" in warning["message"]

def test_sufficient_balance_no_warning():
    # User with ₹500 (50000 paise) wallet balance
    user_wallets = {"u-customer-001": 50000}

    tomorrow_str = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")
    subscriptions = [
        {
            "id": "sub_101",
            "user_id": "u-customer-001",
            "status": "active",
            "slot_name": "Morning",
            "next_delivery_date": tomorrow_str,
            "daily_cost_paise": 6000
        }
    ]

    warnings = check_low_balance_subscriptions(subscriptions, user_wallets, lead_hours=3)
    assert len(warnings) == 0
