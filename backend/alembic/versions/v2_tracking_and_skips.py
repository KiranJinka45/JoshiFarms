"""v2_tracking_and_skips

Revision ID: v2_tracking_and_skips
Revises: v1_initial_schema
Create Date: 2026-08-31 11:42:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'v2_tracking_and_skips'
down_revision = 'v1_initial_schema'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Subscription Skips table
    op.create_table(
        'subscription_skips',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('subscription_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscriptions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('skip_date', sa.Date(), nullable=False, index=True),
    )

    # 2. Drivers table
    op.create_table(
        'drivers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), unique=True, nullable=False),
        sa.Column('depot_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('depots.id'), nullable=False),
        sa.Column('vehicle_number', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), server_default='off_duty', nullable=False),
        sa.Column('current_lat', sa.Float(), nullable=True),
        sa.Column('current_lng', sa.Float(), nullable=True),
        sa.Column('last_ping_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 3. Deliveries table
    op.create_table(
        'deliveries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id'), unique=True, nullable=False),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('drivers.id'), nullable=True),
        sa.Column('route_sequence', sa.Integer(), server_default='0', nullable=False),
        sa.Column('status', sa.String(30), server_default='pending', nullable=False, index=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('out_for_delivery_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 4. Proof of Delivery table
    op.create_table(
        'proof_of_delivery',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('delivery_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deliveries.id'), unique=True, nullable=False),
        sa.Column('photo_url', sa.Text(), nullable=True),
        sa.Column('recipient_type', sa.String(30), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('delivered_lat', sa.Float(), nullable=True),
        sa.Column('delivered_lng', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 5. Driver Location Pings table
    op.create_table(
        'driver_location_pings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('driver_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('drivers.id'), nullable=False, index=True),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('accuracy_meters', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False, index=True),
    )

def downgrade():
    op.drop_table('driver_location_pings')
    op.drop_table('proof_of_delivery')
    op.drop_table('deliveries')
    op.drop_table('drivers')
    op.drop_table('subscription_skips')
