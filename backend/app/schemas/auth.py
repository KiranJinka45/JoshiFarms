from typing import Optional
from pydantic import BaseModel, Field, model_validator

class OTPRequestSchema(BaseModel):
    email: Optional[str] = Field(None, json_schema_extra={"example": "customer@joshidairy.com"})
    phone_number: Optional[str] = Field(None, json_schema_extra={"example": "+919876543210"})
    purpose: str = Field("login", json_schema_extra={"example": "login"})

    @model_validator(mode="after")
    def check_identifier(self):
        if not self.email and not self.phone_number:
            raise ValueError("Email is required.")
        return self

class OTPVerifySchema(BaseModel):
    email: Optional[str] = Field(None, json_schema_extra={"example": "customer@joshidairy.com"})
    phone_number: Optional[str] = Field(None, json_schema_extra={"example": "+919876543210"})
    otp: str = Field(..., json_schema_extra={"example": "123456"})

    @model_validator(mode="after")
    def check_identifier(self):
        if not self.email and not self.phone_number:
            raise ValueError("Email is required.")
        return self

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None
