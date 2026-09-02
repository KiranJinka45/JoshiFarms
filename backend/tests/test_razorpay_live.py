import pytest
from app.services.razorpay_client import RazorpayService

@pytest.mark.anyio
async def test_razorpay_live_https_order_creation_contract():
    """
    Tests live HTTPS order creation call against Razorpay REST API:
    Endpoint: https://api.razorpay.com/v1/orders
    When mock credentials are provided, Razorpay returns 401 Unauthorized with official Razorpay JSON error structure.
    When live sandbox credentials (rzp_test_...) are provided in .env, Razorpay returns 200/201 with real order entity.
    """
    service = RazorpayService()
    res = await service.create_live_order(amount_paise=50000, currency="INR")
    
    # Assert HTTP communication occurred with api.razorpay.com
    assert res["status_code"] in [200, 201]
    assert res["response"]["entity"] == "order"
    assert res["response"]["amount"] == 50000
    assert res["response"]["status"] == "created"
