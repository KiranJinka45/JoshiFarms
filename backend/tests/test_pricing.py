from app.domain.pricing import calculate_order_pricing, CartItemInput

def test_pricing_under_100():
    # Milk ₹60 (6000 paise) + Paneer ₹30 (3000 paise) = ₹90 (9000 paise)
    items = [
        CartItemInput(product_id="p1", unit_price_paise=6000, quantity=1),
        CartItemInput(product_id="p2", unit_price_paise=3000, quantity=1)
    ]
    res = calculate_order_pricing(items)
    assert res.subtotal_paise == 9000
    assert res.delivery_fee_paise == 1500  # ₹15 fee applied
    assert res.total_paise == 10500

def test_pricing_over_100_waived():
    # Milk ₹60 * 2 = ₹120 (12000 paise)
    items = [
        CartItemInput(product_id="p1", unit_price_paise=6000, quantity=2)
    ]
    res = calculate_order_pricing(items)
    assert res.subtotal_paise == 12000
    assert res.delivery_fee_paise == 0  # Fee waived
    assert res.total_paise == 12000
