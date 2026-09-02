from app.domain.depot_assignment import assign_depot_for_order, DepotInfo

def test_primary_depot_assignment():
    depots = [
        DepotInfo(id="d1", name="Koramangala Depot", zone_code="Z1", daily_capacity=100, current_order_count=10, pincodes=["560034"], is_active=True),
        DepotInfo(id="d2", name="Indiranagar Hub", zone_code="Z2", daily_capacity=100, current_order_count=5, pincodes=["560038"], is_active=True)
    ]
    res = assign_depot_for_order("560034", depots)
    assert res.assigned_depot_id == "d1"
    assert res.assignment_type == "primary"

def test_depot_capacity_fallback():
    depots = [
        DepotInfo(id="d1", name="Koramangala Depot", zone_code="Z1", daily_capacity=10, current_order_count=10, pincodes=["560034"], is_active=True),
        DepotInfo(id="d2", name="Indiranagar Hub", zone_code="Z2", daily_capacity=100, current_order_count=5, pincodes=["560038"], is_active=True)
    ]
    res = assign_depot_for_order("560034", depots)
    assert res.assigned_depot_id == "d2"
    assert res.assignment_type == "fallback"

def test_unassigned_exception():
    depots = [
        DepotInfo(id="d1", name="Koramangala Depot", zone_code="Z1", daily_capacity=10, current_order_count=10, pincodes=["560034"], is_active=True)
    ]
    res = assign_depot_for_order("560034", depots)
    assert res.assigned_depot_id is None
    assert res.assignment_type == "unassigned"
