import uuid
from datetime import datetime, date, timezone
from typing import List, Optional
from sqlalchemy import String, Date, DateTime, SmallInteger, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)
    frequency: Mapped[str] = mapped_column(String(20), default="daily", nullable=False)  # daily / custom_days
    
    # Use ARRAY for PostgreSQL with JSON fallback variant for SQLite testing compatibility
    days_of_week: Mapped[Optional[List[int]]] = mapped_column(
        ARRAY(SmallInteger).with_variant(JSON, "sqlite"), 
        nullable=True
    )
    
    slot_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("delivery_slots.id"), nullable=False)
    address_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=False)
    mandate_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active / paused / cancelled
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="subscriptions")
    skips = relationship("SubscriptionSkip", back_populates="subscription", cascade="all, delete-orphan")

class SubscriptionSkip(Base):
    __tablename__ = "subscription_skips"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subscription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscriptions.id", ondelete="CASCADE"), nullable=False)
    skip_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    subscription = relationship("Subscription", back_populates="skips")
