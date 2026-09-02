import pytest
from sqlalchemy import create_engine
from app.db.base import Base

def test_sqlalchemy_models_ddl_and_foreign_keys():
    """
    Verifies that all 14 SQLAlchemy ORM models compile DDL table metadata,
    foreign key references, unique constraints, and indexes cleanly.
    Creates tables in SQLite in-memory engine to catch any DDL syntax or FK ordering bugs.
    """
    engine = create_engine("sqlite:///:memory:")
    
    # Base.metadata.create_all compiles DDL for all 14 tables:
    # users, otp_requests, addresses, depots, depot_pincodes, products,
    # delivery_slots, payments, subscriptions, orders, order_items,
    # drivers, deliveries, proof_of_delivery, driver_location_pings, audit_log
    Base.metadata.create_all(engine)

    table_names = list(Base.metadata.tables.keys())
    
    # Assert core tables are mapped
    expected_tables = [
        "users", "otp_requests", "addresses", "depots", "depot_pincodes",
        "products", "delivery_slots", "payments", "subscriptions", "orders",
        "order_items", "drivers", "deliveries", "proof_of_delivery",
        "driver_location_pings", "audit_log"
    ]
    for tbl in expected_tables:
        assert tbl in table_names, f"Table {tbl} missing from SQLAlchemy metadata."

def test_payments_unique_constraint_schema():
    """
    Verifies unique constraint on payments.razorpay_payment_id in metadata.
    """
    payments_tbl = Base.metadata.tables["payments"]
    payment_id_col = payments_tbl.columns["razorpay_payment_id"]
    assert payment_id_col.unique is True or any(c.name == "razorpay_payment_id" for c in payments_tbl.indexes if c.unique)
