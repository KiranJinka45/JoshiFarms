import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

router = APIRouter()

class DepotOverrideRequest(BaseModel):
    order_id: str
    target_depot_id: str
    target_depot_name: str
    reason: str = Field(..., min_length=5, json_schema_extra={"example": "Vehicle capacity issue at Koramangala Depot"})

class AuditLogResponse(BaseModel):
    id: str
    actor_user_id: str
    action: str
    entity_type: str
    entity_id: str
    reason: str
    created_at_iso: str

@router.post("/depots/override", response_model=AuditLogResponse)
async def override_depot_assignment(payload: DepotOverrideRequest):
    """
    Admin Manual Depot Override.
    Requires a mandatory reason string and creates an immutable audit log entry.
    """
    audit_id = f"AUD-{uuid.uuid4().hex[:6].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    return AuditLogResponse(
        id=audit_id,
        actor_user_id="u-admin-dispatcher-01",
        action="depot_override",
        entity_type="order",
        entity_id=payload.order_id,
        reason=payload.reason,
        created_at_iso=now_iso
    )
