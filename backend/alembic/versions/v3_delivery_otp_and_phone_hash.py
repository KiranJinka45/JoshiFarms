"""v3_delivery_otp_and_phone_hash

Revision ID: v3_delivery_otp_and_phone_hash
Revises: v2_tracking_and_skips
Create Date: 2026-08-31 14:35:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'v3_delivery_otp_and_phone_hash'
down_revision = 'v2_tracking_and_skips'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Add delivery_otp column to deliveries table
    op.add_column('deliveries', sa.Column('delivery_otp', sa.String(length=6), nullable=True))
    
    # 2. Add otp_verified column to proof_of_delivery with default False (fails closed)
    op.add_column('proof_of_delivery', sa.Column('otp_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False))
    
    # 3. Add HMAC-SHA256 indexable phone_hash column to existing otp_requests table
    op.add_column('otp_requests', sa.Column('phone_hash', sa.String(length=64), nullable=True))
    op.create_index('ix_otp_requests_phone_hash', 'otp_requests', ['phone_hash'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_otp_requests_phone_hash', table_name='otp_requests')
    op.drop_column('otp_requests', 'phone_hash')
    op.drop_column('proof_of_delivery', 'otp_verified')
    op.drop_column('deliveries', 'delivery_otp')
