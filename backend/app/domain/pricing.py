from typing import List, NamedTuple
from app.core.config import settings

class CartItemInput(NamedTuple):
    product_id: str
    unit_price_paise: int
    quantity: int

class OrderPricingResult(NamedTuple):
    subtotal_paise: int
    delivery_fee_paise: int
    total_paise: int

def calculate_order_pricing(
    items: List[CartItemInput],
    free_delivery_threshold_paise: int = settings.FREE_DELIVERY_THRESHOLD_PAISE,
    default_delivery_fee_paise: int = settings.DEFAULT_DELIVERY_FEE_PAISE
) -> OrderPricingResult:
    """
    Pure pricing calculation in paise.
    Subtotal = sum(unit_price_paise * quantity).
    Delivery fee = ₹0 if subtotal >= ₹100 (10000 paise), else ₹15 (1500 paise).
    """
    subtotal_paise = sum(item.unit_price_paise * item.quantity for item in items)
    
    if subtotal_paise == 0:
        delivery_fee_paise = 0
    elif subtotal_paise >= free_delivery_threshold_paise:
        delivery_fee_paise = 0
    else:
        delivery_fee_paise = default_delivery_fee_paise

    total_paise = subtotal_paise + delivery_fee_paise

    return OrderPricingResult(
        subtotal_paise=subtotal_paise,
        delivery_fee_paise=delivery_fee_paise,
        total_paise=total_paise
    )
