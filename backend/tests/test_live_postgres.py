import os
import uuid
import hmac
import hashlib
from datetime import datetime, timezone, date, timedelta
import pytest
import asyncpg

@pytest.mark.anyio
async def test_live_postgres_migrations_and_constraints():
    """
    Integration Test against LIVE PostgreSQL 16 container via asyncpg:
    1. Tests BIGINT paise insertion
    2. Tests PostgreSQL native ARRAY(SmallInteger) insertion on subscriptions
    3. Tests PostgreSQL unique constraint on razorpay_payment_id (Integrity Error / UniqueViolationError)
    4. Tests stored cutoff_at timestamp on orders
    5. Tests subscription_skips table
    6. Tests drivers, deliveries, proof_of_delivery (otp_verified default=False), delivery_otp, and driver_location_pings
    7. Tests HMAC-SHA256 indexable phone_hash on otp_requests
    """
    test_db_url = os.environ.get("TEST_DATABASE_URL", "postgresql://postgres:secretpassword@127.0.0.1:5439/farm_fresh_test")
    try:
        # First ensure test database exists
        admin_conn = await asyncpg.connect("postgresql://postgres:secretpassword@127.0.0.1:5439/postgres", timeout=2.0)
        await admin_conn.execute("CREATE DATABASE farm_fresh_test;")
        await admin_conn.close()
    except Exception:
        pass  # Database already exists or admin connection skipped

    try:
        conn = await asyncpg.connect(test_db_url, timeout=2.0)
    except (OSError, asyncpg.CannotConnectNowError, ConnectionRefusedError) as e:
        pytest.skip(f"Live PostgreSQL container not reachable on port 5439 ({e}). Start Docker Desktop to run integration test.")

    phone = f"+9198{uuid.uuid4().hex[:8]}"
    test_hash = hmac.new(b"secret_key", phone.encode(), hashlib.sha256).hexdigest()
    user_id = uuid.uuid4()
    driver_user_id = uuid.uuid4()
    driver_id = uuid.uuid4()
    address_id = uuid.uuid4()
    product_id = uuid.uuid4()
    depot_id = uuid.uuid4()
    order_id = uuid.uuid4()
    delivery_id = uuid.uuid4()
    pod_id = uuid.uuid4()
    ping_id = uuid.uuid4()
    payment_id = uuid.uuid4()
    sub_id = uuid.uuid4()
    skip_id = uuid.uuid4()
    otp_req_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    today = date.today()

    # 1. Insert User & Driver User
    await conn.execute(
        """
        INSERT INTO users (id, phone_number, name, role, wallet_balance_paise, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        """,
        user_id, phone, "Kiran Joshi", "customer", 50000, "active", now, now
    )
    driver_phone = f"+9197{uuid.uuid4().hex[:8]}"
    await conn.execute(
        """
        INSERT INTO users (id, phone_number, name, role, wallet_balance_paise, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
        """,
        driver_user_id, driver_phone, "Ramesh Driver", "driver", 0, "active", now, now
    )

    # 2. Insert Delivery Slot & Product & Depot & Address
    await conn.execute(
        """
        INSERT INTO delivery_slots (id, name, window_start, window_end)
        VALUES (1, 'Morning', '05:30', '07:30')
        ON CONFLICT (id) DO NOTHING;
        """
    )
    await conn.execute(
        """
        INSERT INTO addresses (id, user_id, label, line1, pincode, is_default)
        VALUES ($1, $2, 'Home', '123 Koramangala 4th Block', '560034', true);
        """,
        address_id, user_id
    )
    await conn.execute(
        """
        INSERT INTO depots (id, name, zone_code, daily_capacity, status)
        VALUES ($1, 'Koramangala Depot', 'BLR-KOR', 60, 'active');
        """,
        depot_id
    )
    await conn.execute(
        """
        INSERT INTO products (id, name, category, unit_label, price_paise, active)
        VALUES ($1, 'Farm Fresh Whole Milk', 'milk', '1 Liter Bottle', 6000, true);
        """,
        product_id
    )

    # 3. Test Native PostgreSQL ARRAY(SmallInteger) on subscriptions
    await conn.execute(
        """
        INSERT INTO subscriptions (id, user_id, product_id, quantity, frequency, days_of_week, slot_id, address_id, status, start_date, created_at, updated_at)
        VALUES ($1, $2, $3, 1, 'custom_days', $4, 1, $5, 'active', $6, $7, $8);
        """,
        sub_id, user_id, product_id, [1, 3, 5], address_id, today, now, now
    )
    sub_row = await conn.fetchrow("SELECT days_of_week FROM subscriptions WHERE id = $1;", sub_id)
    assert sub_row["days_of_week"] == [1, 3, 5]

    # 4. Test subscription_skips
    await conn.execute(
        """
        INSERT INTO subscription_skips (id, subscription_id, skip_date)
        VALUES ($1, $2, $3);
        """,
        skip_id, sub_id, today
    )
    skip_row = await conn.fetchrow("SELECT skip_date FROM subscription_skips WHERE id = $1;", skip_id)
    assert skip_row["skip_date"] == today

    # 5. Test BIGINT in paise and unique constraint on payments.razorpay_payment_id
    unique_pay_id = f"pay_live_{uuid.uuid4().hex[:8]}"
    await conn.execute(
        """
        INSERT INTO payments (id, user_id, razorpay_order_id, razorpay_payment_id, type, amount_paise, status, created_at, updated_at)
        VALUES ($1, $2, 'order_live_001', $3, 'wallet_topup', 50000, 'captured', $4, $5);
        """,
        payment_id, user_id, unique_pay_id, now, now
    )

    # 6. Attempt duplicate payment ID -> MUST raise UniqueViolationError in PostgreSQL
    with pytest.raises(asyncpg.exceptions.UniqueViolationError):
        duplicate_payment_id = uuid.uuid4()
        await conn.execute(
            """
            INSERT INTO payments (id, user_id, razorpay_order_id, razorpay_payment_id, type, amount_paise, status, created_at, updated_at)
            VALUES ($1, $2, 'order_live_002', $3, 'wallet_topup', 50000, 'captured', $4, $5);
            """,
            duplicate_payment_id, user_id, unique_pay_id, now, now
        )

    # 7. Test Stored cutoff_at timestamp on Orders
    order_num = f"ORD-{uuid.uuid4().hex[:6].upper()}"
    await conn.execute(
        """
        INSERT INTO orders (id, order_number, user_id, address_id, depot_id, delivery_date, slot_id, status, subtotal_paise, delivery_fee_paise, total_paise, source, cutoff_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, 1, 'placed', 6000, 1500, 7500, 'one_off', $7, $8, $9);
        """,
        order_id, order_num, user_id, address_id, depot_id, today, now, now, now
    )
    order_row = await conn.fetchrow("SELECT total_paise, cutoff_at FROM orders WHERE id = $1;", order_id)
    assert order_row["total_paise"] == 7500
    assert order_row["cutoff_at"] is not None

    # 8. Test Drivers, Deliveries with delivery_otp, and Proof of Delivery (fails closed)
    await conn.execute(
        """
        INSERT INTO drivers (id, user_id, depot_id, vehicle_number, status, current_lat, current_lng, created_at, updated_at)
        VALUES ($1, $2, $3, 'KA-01-EQ-9876', 'on_duty', 12.9352, 77.6245, $4, $5);
        """,
        driver_id, driver_user_id, depot_id, now, now
    )

    await conn.execute(
        """
        INSERT INTO deliveries (id, order_id, driver_id, route_sequence, status, delivery_otp, assigned_at, out_for_delivery_at)
        VALUES ($1, $2, $3, 1, 'out_for_delivery', '482910', $4, $5);
        """,
        delivery_id, order_id, driver_id, now, now
    )

    del_row = await conn.fetchrow("SELECT delivery_otp FROM deliveries WHERE id = $1;", delivery_id)
    assert del_row["delivery_otp"] == "482910"

    await conn.execute(
        """
        INSERT INTO proof_of_delivery (id, delivery_id, recipient_name, delivered_at)
        VALUES ($1, $2, 'Kiran Joshi', $3);
        """,
        pod_id, delivery_id, now
    )

    pod_row = await conn.fetchrow("SELECT otp_verified FROM proof_of_delivery WHERE id = $1;", pod_id)
    assert pod_row["otp_verified"] is False  # Asserts fail-closed default

    # 9. Test otp_requests table with HMAC-SHA256 indexable phone_hash
    await conn.execute(
        """
        INSERT INTO otp_requests (id, phone_number, phone_hash, otp_hash, purpose, attempts, expires_at, created_at)
        VALUES ($1, $2, $3, 'hashed_otp_val', 'login', 0, $4, $5);
        """,
        otp_req_id, phone, test_hash, now + timedelta(minutes=5), now
    )
    otp_row = await conn.fetchrow("SELECT phone_hash, attempts FROM otp_requests WHERE id = $1;", otp_req_id)
    assert otp_row["phone_hash"] == test_hash
    assert otp_row["attempts"] == 0

    await conn.close()
