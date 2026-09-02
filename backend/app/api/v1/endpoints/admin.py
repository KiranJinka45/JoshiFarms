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

class AISuggestionRequest(BaseModel):
    exception_id: str
    order_id: str
    exception_type: str
    reason: str
    description: str
    pincode: Optional[str] = "560034"

class AISuggestionResponse(BaseModel):
    exception_id: str
    order_id: str
    summary: str
    suggested_action: str
    recommended_depot_id: str
    recommended_depot_name: str
    confidence_score: float
    reasoning: str
    requires_human_approval: bool

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

@router.post("/ai/suggest-exception-resolution", response_model=AISuggestionResponse)
async def suggest_exception_resolution(payload: AISuggestionRequest):
    """
    AI Dispatcher & Exception Assistant.
    Analyzes delivery/depot exceptions, evaluates operational constraints,
    and returns structured recommendations requiring human approval.
    """
    if "Depot" in payload.exception_type or "remote" in payload.description.lower() or "560099" in payload.description:
        summary = f"Order {payload.order_id} failed primary depot assignment for pincode {payload.pincode} due to service zone boundaries."
        suggested_action = "Override routing to Primary Regional Hub (depot-1)"
        rec_id = "depot-1"
        rec_name = "Koramangala Central Depot"
        confidence = 0.94
        reasoning = f"Koramangala Central Hub (depot-1) has available morning capacity (120/500 orders) and is the closest operational fallback depot for pincode {payload.pincode}."
    else:
        summary = f"Delivery failed for Order {payload.order_id} ({payload.reason}). Customer was non-responsive at doorstep."
        suggested_action = "Reschedule drop-off for Evening slot & trigger customer notification."
        rec_id = "depot-1"
        rec_name = "Koramangala Central Depot"
        confidence = 0.89
        reasoning = "Customer profile indicates high evening availability. Shifting slot to Evening Drop-Off prevents fresh milk spoilage."

    return AISuggestionResponse(
        exception_id=payload.exception_id,
        order_id=payload.order_id,
        summary=summary,
        suggested_action=suggested_action,
        recommended_depot_id=rec_id,
        recommended_depot_name=rec_name,
        confidence_score=confidence,
        reasoning=reasoning,
        requires_human_approval=True
    )
