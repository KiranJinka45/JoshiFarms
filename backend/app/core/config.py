import os
from typing import List, Optional

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict
    
    class Settings(BaseSettings):
        PROJECT_NAME: str = "Farm Fresh Dairy API"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        
        ENVIRONMENT: str = "development"
        DEBUG: bool = True

        SECRET_KEY: str = "super-secret-production-key-change-in-env-file-min-32-chars"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30
        ALGORITHM: str = "HS256"

        DATABASE_URL: str = "postgresql+asyncpg://postgres:secretpassword@127.0.0.1:5439/farm_fresh_dairy"

        RAZORPAY_KEY_ID: str = "rzp_test_mock_key_id"
        RAZORPAY_KEY_SECRET: str = "rzp_test_mock_key_secret"
        RAZORPAY_WEBHOOK_SECRET: str = "whsec_mock_webhook_secret"

        SUPABASE_URL: str = "https://mock-project.supabase.co"
        SUPABASE_ANON_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_key"
        SUPABASE_JWT_SECRET: str = "super-secret-production-key-change-in-env-file-min-32-chars"

        CUTOFF_HOURS: int = 7
        FREE_DELIVERY_THRESHOLD_PAISE: int = 10000
        DEFAULT_DELIVERY_FEE_PAISE: int = 1500

        RESEND_API_KEY: Optional[str] = None
        EMAIL_FROM_ADDRESS: str = "Farm Fresh Dairy <onboarding@resend.dev>"

        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://localhost:4173",
            "http://localhost:3000"
        ]

        model_config = SettingsConfigDict(
            env_file=[".env", "backend/.env", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")],
            env_file_encoding="utf-8",
            case_sensitive=True,
            extra="ignore"
        )
except ImportError:
    class Settings:  # type: ignore
        PROJECT_NAME: str = "Farm Fresh Dairy API"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"
        ENVIRONMENT: str = "development"
        DEBUG: bool = True
        SECRET_KEY: str = "super-secret-production-key-change-in-env-file-min-32-chars"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
        REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30
        ALGORITHM: str = "HS256"
        DATABASE_URL: str = "postgresql+asyncpg://postgres:secretpassword@127.0.0.1:5439/farm_fresh_dairy"
        RAZORPAY_KEY_ID: str = "rzp_test_mock_key_id"
        RAZORPAY_KEY_SECRET: str = "rzp_test_mock_key_secret"
        RAZORPAY_WEBHOOK_SECRET: str = "whsec_mock_webhook_secret"
        CUTOFF_HOURS: int = 7
        FREE_DELIVERY_THRESHOLD_PAISE: int = 10000
        DEFAULT_DELIVERY_FEE_PAISE: int = 1500
        RESEND_API_KEY: Optional[str] = None
        EMAIL_FROM_ADDRESS: str = "Farm Fresh Dairy <onboarding@resend.dev>"
        BACKEND_CORS_ORIGINS: List[str] = [
            "http://localhost:5173",
            "http://localhost:4173"
        ]

settings = Settings()
