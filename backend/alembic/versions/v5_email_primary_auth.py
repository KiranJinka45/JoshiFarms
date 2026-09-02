"""v5_email_primary_auth

Revision ID: v5_email_primary_auth
Revises: v4_pod_columns
Create Date: 2026-09-01 16:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'v5_email_primary_auth'
down_revision = 'v4_pod_columns'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Make users.phone_number nullable
    op.alter_column('users', 'phone_number', existing_type=sa.String(15), nullable=True)
    
    # 2. Add unique index on users.email
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    
    # 3. Add email column to otp_requests
    op.add_column('otp_requests', sa.Column('email', sa.String(length=255), nullable=True))
    op.create_index('ix_otp_requests_email', 'otp_requests', ['email'], unique=False)
    op.alter_column('otp_requests', 'phone_number', existing_type=sa.String(15), nullable=True)

def downgrade() -> None:
    op.alter_column('otp_requests', 'phone_number', existing_type=sa.String(15), nullable=False)
    op.drop_index('ix_otp_requests_email', table_name='otp_requests')
    op.drop_column('otp_requests', 'email')
    op.drop_index('ix_users_email', table_name='users')
    op.alter_column('users', 'phone_number', existing_type=sa.String(15), nullable=False)
