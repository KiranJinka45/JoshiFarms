"""v1_initial_schema

Revision ID: v1_initial_schema
Revises: 
Create Date: 2026-08-31 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'v1_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('phone_number', sa.String(15), unique=True, nullable=False, index=True),
        sa.Column('name', sa.String(120), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('role', sa.String(20), server_default='customer', nullable=False),
        sa.Column('wallet_balance_paise', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('status', sa.String(20), server_default='active', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # OTP Requests table
    op.create_table(
        'otp_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('phone_number', sa.String(15), nullable=False, index=True),
        sa.Column('otp_hash', sa.String(255), nullable=False),
        sa.Column('purpose', sa.String(20), server_default='login', nullable=False),
        sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Addresses table
    op.create_table(
        'addresses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('label', sa.String(20), server_default='Home', nullable=False),
        sa.Column('line1', sa.Text(), nullable=False),
        sa.Column('line2', sa.Text(), nullable=True),
        sa.Column('landmark', sa.Text(), nullable=True),
        sa.Column('pincode', sa.String(6), nullable=False, index=True),
        sa.Column('lat', sa.Float(), nullable=True),
        sa.Column('lng', sa.Float(), nullable=True),
        sa.Column('is_default', sa.Boolean(), server_default='false', nullable=False),
    )

    # Depots table
    op.create_table(
        'depots',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('zone_code', sa.String(10), nullable=False),
        sa.Column('daily_capacity', sa.Integer(), server_default='60', nullable=False),
        sa.Column('status', sa.String(20), server_default='active', nullable=False),
    )

    # Depot Pincodes table
    op.create_table(
        'depot_pincodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('depot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('depots.id', ondelete='CASCADE'), nullable=False),
        sa.Column('pincode', sa.String(6), nullable=False, index=True),
        sa.Column('priority', sa.SmallInteger(), server_default='1', nullable=False),
    )

    # Products table
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('unit_label', sa.String(20), nullable=False),
        sa.Column('price_paise', sa.BigInteger(), nullable=False),
        sa.Column('image_url', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), server_default='true', nullable=False),
    )

    # Delivery Slots table
    op.create_table(
        'delivery_slots',
        sa.Column('id', sa.SmallInteger(), primary_key=True),
        sa.Column('name', sa.String(20), nullable=False),
        sa.Column('window_start', sa.String(5), nullable=False),
        sa.Column('window_end', sa.String(5), nullable=False),
    )

    # Payments table (unique constraint on razorpay_payment_id)
    op.create_table(
        'payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('razorpay_order_id', sa.String(100), nullable=False, index=True),
        sa.Column('razorpay_payment_id', sa.String(100), unique=True, nullable=True, index=True),
        sa.Column('type', sa.String(30), nullable=False),
        sa.Column('amount_paise', sa.BigInteger(), nullable=False),
        sa.Column('status', sa.String(30), server_default='created', nullable=False),
        sa.Column('webhook_verified_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('quantity', sa.SmallInteger(), server_default='1', nullable=False),
        sa.Column('frequency', sa.String(20), server_default='daily', nullable=False),
        sa.Column('days_of_week', postgresql.ARRAY(sa.SmallInteger()), nullable=True),
        sa.Column('slot_id', sa.SmallInteger(), sa.ForeignKey('delivery_slots.id'), nullable=False),
        sa.Column('address_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('addresses.id'), nullable=False),
        sa.Column('mandate_id', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), server_default='active', nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Orders table (with stored cutoff_at timestamp)
    op.create_table(
        'orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_number', sa.String(30), unique=True, nullable=False, index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('address_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('addresses.id'), nullable=False),
        sa.Column('depot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('depots.id'), nullable=True),
        sa.Column('delivery_date', sa.Date(), nullable=False, index=True),
        sa.Column('slot_id', sa.SmallInteger(), sa.ForeignKey('delivery_slots.id'), nullable=False),
        sa.Column('status', sa.String(30), server_default='placed', nullable=False, index=True),
        sa.Column('subtotal_paise', sa.BigInteger(), nullable=False),
        sa.Column('delivery_fee_paise', sa.BigInteger(), server_default='0', nullable=False),
        sa.Column('total_paise', sa.BigInteger(), nullable=False),
        sa.Column('payment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('payments.id'), nullable=True),
        sa.Column('source', sa.String(20), server_default='one_off', nullable=False),
        sa.Column('subscription_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscriptions.id'), nullable=True),
        sa.Column('cutoff_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # Order Items table
    op.create_table(
        'order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='CASCADE'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=False),
        sa.Column('quantity', sa.SmallInteger(), nullable=False),
        sa.Column('unit_price_paise', sa.BigInteger(), nullable=False),
        sa.Column('line_total_paise', sa.BigInteger(), nullable=False),
    )

    # Audit Log table
    op.create_table(
        'audit_log',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('action', sa.String(50), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', sa.String(100), nullable=False, index=True),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('audit_metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, index=True),
    )

def downgrade():
    op.drop_table('audit_log')
    op.drop_table('order_items')
    op.drop_table('orders')
    op.drop_table('subscriptions')
    op.drop_table('payments')
    op.drop_table('delivery_slots')
    op.drop_table('products')
    op.drop_table('depot_pincodes')
    op.drop_table('depots')
    op.drop_table('addresses')
    op.drop_table('otp_requests')
    op.drop_table('users')
