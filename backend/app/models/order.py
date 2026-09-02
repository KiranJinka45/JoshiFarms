import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, BigInteger, Date, DateTime, SmallInteger, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    address_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=False)
    depot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("depots.id"), nullable=True)
    
    delivery_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    slot_id: Mapped[int] = mapped_column(SmallInteger, ForeignKey("delivery_slots.id"), nullable=False)
    
    status: Mapped[str] = mapped_column(String(30), default="placed", nullable=False, index=True)
    
    subtotal_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    delivery_fee_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    total_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    payment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    source: Mapped[str] = mapped_column(String(20), default="one_off", nullable=False)
    subscription_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)
    
    # Stored cutoff timestamp calculated at order placement time
    cutoff_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    unit_price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    line_total_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)

    order = relationship("Order", back_populates="items")
