import uuid
from sqlalchemy import String, Text, Boolean, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(20), default="Home", nullable=False)
    line1: Mapped[str] = mapped_column(Text, nullable=False)
    line2: Mapped[str] = mapped_column(Text, nullable=True)
    landmark: Mapped[str] = mapped_column(Text, nullable=True)
    pincode: Mapped[str] = mapped_column(String(6), nullable=False, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=True)
    lng: Mapped[float] = mapped_column(Float, nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="addresses")
