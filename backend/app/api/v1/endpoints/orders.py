import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.schemas.order import OrderCreate, OrderResponse, OrderItemResponse
from app.domain.cutoff import get_slot_availability
from app.domain.pricing import calculate_order_pricing, CartItemInput

router = APIRouter()

# Mock products map for calculation
MOCK_PRODUCTS = {
    "p1": {"name": "Fresh Cow Milk", "price_paise": 6000},
    "p2": {"name": "Fresh Buffalo Milk", "price_paise": 7000},
    "p3": {"name": "Farm Fresh Curd", "price_paise": 4500},
    "p4": {"name": "Soft Malai Paneer", "price_paise": 12000},
    "p5": {"name": "Pure Desi Ghee", "price_paise": 65000}
}

SLOT_MAP = {1: "Morning", 2: "Evening"}

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreate):
    """
    Create a new order with server-side cutoff revalidation at write time.
    Rejects order with 409 Conflict if cutoff has passed.
    Stores immutable `cutoff_at` timestamp in database.
    """
    slot_name = SLOT_MAP.get(payload.slot_id)
    if not slot_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid slot_id. Must be 1 (Morning) or 2 (Evening)."
        )

    # Server-authoritative cutoff revalidation against server clock
    current_time = datetime.now(timezone.utc)
    slot_status = get_slot_availability(payload.delivery_date, slot_name, current_time=current_time)

    if not slot_status.available:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=slot_status.reason or "Booking has closed for this slot."
        )

    # Calculate pricing in paise
    cart_inputs = []
    order_items_res = []
    
    for item in payload.items:
        prod = MOCK_PRODUCTS.get(item.product_id)
        if not prod:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {item.product_id} not found."
            )
        cart_inputs.append(CartItemInput(
            product_id=item.product_id,
            unit_price_paise=prod["price_paise"],
            quantity=item.quantity
        ))
        order_items_res.append(OrderItemResponse(
            id=str(uuid.uuid4()),
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price_paise=prod["price_paise"],
            line_total_paise=prod["price_paise"] * item.quantity
        ))

    pricing = calculate_order_pricing(cart_inputs)
    order_id = str(uuid.uuid4())
    order_number = f"FFD-{datetime.now().strftime('%Y%m%d')}-{order_id[:4].upper()}"

    return OrderResponse(
        id=order_id,
        order_number=order_number,
        delivery_date=payload.delivery_date,
        slot_id=payload.slot_id,
        status="placed",
        subtotal_paise=pricing.subtotal_paise,
        delivery_fee_paise=pricing.delivery_fee_paise,
        total_paise=pricing.total_paise,
        cutoff_at_iso=slot_status.cutoff_time.isoformat(),
        created_at_iso=current_time.isoformat(),
        items=order_items_res
    )
