import uuid
from sqlalchemy import String, Integer, SmallInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Depot(Base):
    __tablename__ = "depots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    zone_code: Mapped[str] = mapped_column(String(10), nullable=False)
    daily_capacity: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)

    pincodes = relationship("DepotPincode", back_populates="depot", cascade="all, delete-orphan")

class DepotPincode(Base):
    __tablename__ = "depot_pincodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    depot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("depots.id", ondelete="CASCADE"), nullable=False)
    pincode: Mapped[str] = mapped_column(String(6), nullable=False, index=True)
    priority: Mapped[int] = mapped_column(SmallInteger, default=1, nullable=False)

    depot = relationship("Depot", back_populates="pincodes")
