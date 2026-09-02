"""v4_pod_columns

Revision ID: v4_pod_columns
Revises: v3_delivery_otp_and_phone_hash
Create Date: 2026-09-01 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'v4_pod_columns'
down_revision = 'v3_delivery_otp_and_phone_hash'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column('proof_of_delivery', sa.Column('recipient_name', sa.String(length=120), nullable=True))
    op.add_column('proof_of_delivery', sa.Column('delivered_at', sa.DateTime(timezone=True), nullable=True))
    op.alter_column('proof_of_delivery', 'recipient_type', existing_type=sa.String(30), nullable=True)
    op.alter_column('proof_of_delivery', 'created_at', existing_type=sa.DateTime(timezone=True), nullable=True, server_default=sa.func.now())

def downgrade() -> None:
    op.alter_column('proof_of_delivery', 'created_at', existing_type=sa.DateTime(timezone=True), nullable=False)
    op.alter_column('proof_of_delivery', 'recipient_type', existing_type=sa.String(30), nullable=False)
    op.drop_column('proof_of_delivery', 'delivered_at')
    op.drop_column('proof_of_delivery', 'recipient_name')
