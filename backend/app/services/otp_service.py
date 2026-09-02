import random
import uuid
import httpx
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from app.core.config import settings

class OTPService:
    def __init__(
        self,
        whatsapp_token: Optional[str] = None,
        whatsapp_phone_id: Optional[str] = None,
        msg91_auth_key: Optional[str] = None,
        resend_api_key: Optional[str] = None,
        email_from: Optional[str] = None
    ):
        self.whatsapp_token = whatsapp_token if whatsapp_token is not None else getattr(settings, "WHATSAPP_API_TOKEN", None)
        self.whatsapp_phone_id = whatsapp_phone_id if whatsapp_phone_id is not None else getattr(settings, "WHATSAPP_PHONE_NUMBER_ID", None)
        self.msg91_auth_key = msg91_auth_key if msg91_auth_key is not None else getattr(settings, "MSG91_AUTH_KEY", None)
        self.resend_api_key = resend_api_key if resend_api_key is not None else getattr(settings, "RESEND_API_KEY", None)
        self.email_from = email_from or getattr(settings, "EMAIL_FROM_ADDRESS", "Farm Fresh Dairy <onboarding@resend.dev>")

    def generate_otp(self) -> str:
        """Generates a secure 6-digit OTP."""
        return f"{random.randint(100000, 999999)}"

    async def send_whatsapp_otp(self, phone_number: str, otp: str) -> Dict[str, Any]:
        """
        Dispatches OTP via Meta Cloud WhatsApp API template message.
        """
        if not self.whatsapp_token or not self.whatsapp_phone_id:
            # Dev / Sandbox Fallback logging
            return {
                "channel": "whatsapp_dev_fallback",
                "delivered": False,
                "reason": "WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set. Check logs for dev OTP.",
                "dev_otp": otp
            }

        url = f"https://graph.facebook.com/v18.0/{self.whatsapp_phone_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.whatsapp_token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": phone_number.replace("+", ""),
            "type": "template",
            "template": {
                "name": "otp_verification",
                "language": {"code": "en_US"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [{"type": "text", "text": otp}]
                    },
                    {
                        "type": "button",
                        "sub_type": "url",
                        "index": "0",
                        "parameters": [{"type": "text", "text": otp}]
                    }
                ]
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, headers=headers, timeout=5.0)
                return {
                    "channel": "whatsapp_meta_cloud",
                    "status_code": response.status_code,
                    "delivered": response.status_code in [200, 201],
                    "response": response.json()
                }
            except Exception as e:
                return {
                    "channel": "whatsapp_meta_cloud",
                    "delivered": False,
                    "error": str(e)
                }

    async def send_email_otp(self, email: str, otp: str) -> Dict[str, Any]:
        """
        Dispatches OTP to user via Transactional Email (Resend API or Dev Log Fallback).
        """
        if self.resend_api_key and not self.resend_api_key.startswith("mock"):
            url = "https://api.resend.com/emails"
            headers = {
                "Authorization": f"Bearer {self.resend_api_key}",
                "Content-Type": "application/json"
            }
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Farm Fresh Dairy Login Code</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <tr>
                  <td style="padding: 32px 28px; text-align: center; background: #1b4332;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Farm Fresh Dairy</h1>
                    <p style="color: #bbf7d0; margin: 6px 0 0 0; font-size: 13px;">Doorstep Freshness Delivered Daily</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">Hello,</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                      Use the 6-digit verification code below to complete your login to Farm Fresh Dairy:
                    </p>
                    <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                      <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #166534; font-family: monospace; display: inline-block; margin-left: 8px;">{otp}</span>
                    </div>
                    <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 24px 0 0 0; text-align: center;">
                      This code is valid for <strong>5 minutes</strong> and can only be used once. Never share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">If you did not request this login, please ignore this email.</p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """
            payload = {
                "from": self.email_from,
                "to": [email],
                "subject": f"{otp} is your Farm Fresh Dairy verification code",
                "html": html_content
            }
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(url, json=payload, headers=headers, timeout=10.0)
                    is_success = response.status_code in [200, 201]
                    res_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    if is_success:
                        print(f"\n[RESEND SUCCESS] Sent live OTP email to {email}. Resend Email ID: {res_data.get('id')}\n")
                        return {
                            "channel": "resend_api",
                            "delivered": True,
                            "status_code": response.status_code,
                            "email_id": res_data.get("id"),
                            "recipient": email,
                            "response": res_data
                        }
                    else:
                        error_detail = res_data.get("message") or f"Resend API HTTP {response.status_code}: {response.text}"
                        print(f"\n[RESEND ERROR] Failed to send email to {email}: {error_detail}\n")
                        return {
                            "channel": "resend_api",
                            "delivered": False,
                            "status_code": response.status_code,
                            "error": error_detail,
                            "recipient": email,
                            "response": res_data
                        }
                except Exception as e:
                    print(f"\n[RESEND EXCEPTION] Network error connecting to Resend: {e}\n")
                    return {
                        "channel": "resend_api",
                        "delivered": False,
                        "error": str(e),
                        "recipient": email
                    }

        # In development / sandbox mode without live API key, log and return dev_otp envelope
        print(f"\n[DEV AUTH] No RESEND_API_KEY set. Running offline dev mode. Dev OTP for {email} is: {otp}\n")
        return {
            "channel": "email_dev_fallback",
            "delivered": True,
            "recipient": email,
            "dev_otp": otp,
            "message": f"Login OTP {otp} dispatched to {email}"
        }

    async def dispatch_otp(
        self, 
        identifier: str, 
        otp: str, 
        preferred_channel: str = "email"
    ) -> Dict[str, Any]:
        """
        Dispatches OTP to customer via Email, WhatsApp, or SMS.
        """
        if "@" in identifier or preferred_channel == "email":
            return await self.send_email_otp(identifier, otp)

        if preferred_channel == "whatsapp":
            return await self.send_whatsapp_otp(identifier, otp)
        
        # Fallback to SMS logging
        return {
            "channel": "sms_dev_fallback",
            "delivered": False,
            "dev_otp": otp,
            "message": f"OTP for {identifier} is {otp}"
        }

otp_service = OTPService()
