import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    vehicle_number: Mapped[str] = mapped_column(String(20), nullable=False)
    depot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("depots.id"), nullable=False)
    on_shift: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    shift_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, unique=True)
    driver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="assigned", nullable=False)  # assigned / arrived / delivered / failed
    delivery_otp: Mapped[str] = mapped_column(String(6), nullable=True)  # Per-delivery customer verification OTP
    failure_reason: Mapped[str] = mapped_column(Text, nullable=True)

class ProofOfDelivery(Base):
    __tablename__ = "proof_of_delivery"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    delivery_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("deliveries.id"), nullable=False, unique=True)
    recipient_name: Mapped[str] = mapped_column(String(120), nullable=False)
    otp_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class DriverLocationPing(Base):
    __tablename__ = "driver_location_pings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
