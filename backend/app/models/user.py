import uuid
from datetime import datetime, timezone
from sqlalchemy import String, BigInteger, Enum, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.session import Base

class UserRole(str, Enum):
    CUSTOMER = "customer"
    DRIVER = "driver"
    ADMIN = "admin"

class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(15), unique=True, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=True)
    role: Mapped[UserRole] = mapped_column(String(20), default=UserRole.CUSTOMER, nullable=False)
    wallet_balance_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    status: Mapped[UserStatus] = mapped_column(String(20), default=UserStatus.ACTIVE, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    subscriptions = relationship("Subscription", back_populates="user")

class OTPRequest(Base):
    __tablename__ = "otp_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), nullable=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(15), nullable=True, index=True)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    purpose: Mapped[str] = mapped_column(String(20), default="login", nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
