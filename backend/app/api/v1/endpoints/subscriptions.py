import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.subscription import (
    SubscriptionCreate,
    SubscriptionStatusUpdate,
    SubscriptionSkipRequest,
    SubscriptionResponse
)

router = APIRouter()

# In-memory mock subscription store for API endpoint routing
MOCK_SUBSCRIPTIONS = {}

@router.post("", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(payload: SubscriptionCreate):
    """
    Create a new recurring milk/dairy subscription.
    """
    sub_id = f"sub_{uuid.uuid4().hex[:10]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    sub = SubscriptionResponse(
        id=sub_id,
        user_id="u-customer-001",
        product_id=payload.product_id,
        quantity=payload.quantity,
        frequency=payload.frequency,
        days_of_week=payload.days_of_week,
        slot_id=payload.slot_id,
        address_id=payload.address_id,
        status="active",
        start_date=payload.start_date,
        created_at_iso=now_iso
    )
    MOCK_SUBSCRIPTIONS[sub_id] = sub
    return sub

@router.get("", response_model=List[SubscriptionResponse])
async def list_subscriptions():
    """
    List active & paused subscriptions for the authenticated customer.
    """
    return list(MOCK_SUBSCRIPTIONS.values())

@router.put("/{subscription_id}/status", response_model=SubscriptionResponse)
async def update_subscription_status(subscription_id: str, payload: SubscriptionStatusUpdate):
    """
    Pause, resume, or cancel a subscription.
    """
    sub = MOCK_SUBSCRIPTIONS.get(subscription_id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription {subscription_id} not found."
        )

    if payload.status not in ["active", "paused", "cancelled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status. Must be 'active', 'paused', or 'cancelled'."
        )

    updated_sub = SubscriptionResponse(
        id=sub.id,
        user_id=sub.user_id,
        product_id=sub.product_id,
        quantity=sub.quantity,
        frequency=sub.frequency,
        days_of_week=sub.days_of_week,
        slot_id=sub.slot_id,
        address_id=sub.address_id,
        status=payload.status,
        start_date=sub.start_date,
        created_at_iso=sub.created_at_iso
    )
    MOCK_SUBSCRIPTIONS[subscription_id] = updated_sub
    return updated_sub

@router.post("/{subscription_id}/skip")
async def skip_subscription_delivery(subscription_id: str, payload: SubscriptionSkipRequest):
    """
    Skip delivery for a specific date (e.g. out of town).
    """
    sub = MOCK_SUBSCRIPTIONS.get(subscription_id)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Subscription {subscription_id} not found."
        )

    return {
        "status": "success",
        "subscription_id": subscription_id,
        "skipped_date": payload.skip_date,
        "message": f"Delivery on {payload.skip_date} successfully skipped."
    }
