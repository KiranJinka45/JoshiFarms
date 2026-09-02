import uuid
from sqlalchemy import String, Text, BigInteger, Boolean, Time, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_label: Mapped[str] = mapped_column(String(20), nullable=False)
    price_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    image_url: Mapped[str] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class DeliverySlot(Base):
    __tablename__ = "delivery_slots"

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False)  # Morning / Evening
    window_start: Mapped[str] = mapped_column(String(5), nullable=False)  # 05:30
    window_end: Mapped[str] = mapped_column(String(5), nullable=False)    # 06:30
