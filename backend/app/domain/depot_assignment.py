from typing import List, Optional, NamedTuple
from dataclasses import dataclass

@dataclass
class DepotInfo:
    id: str
    name: str
    zone_code: str
    daily_capacity: int
    current_order_count: int
    pincodes: List[str]
    is_active: bool = True

class DepotAssignmentResult(NamedTuple):
    assigned_depot_id: Optional[str]
    assigned_depot_name: Optional[str]
    assignment_type: str  # 'primary', 'fallback', or 'unassigned'
    reason: str

def assign_depot_for_order(
    customer_pincode: str,
    available_depots: List[DepotInfo]
) -> DepotAssignmentResult:
    """
    Pure deterministic multi-depot routing engine.
    Matches customer pincode to active depots with daily capacity.
    Falls back to secondary depot if primary is full.
    Flags order as unassigned if no eligible depot is found.
    """
    active_depots = [d for d in available_depots if d.is_active]

    # Primary depot match by pincode
    primary_depots = [d for d in active_depots if customer_pincode in d.pincodes]

    for depot in primary_depots:
        if depot.current_order_count < depot.daily_capacity:
            return DepotAssignmentResult(
                assigned_depot_id=depot.id,
                assigned_depot_name=depot.name,
                assignment_type="primary",
                reason=f"Assigned to primary depot {depot.name} for pincode {customer_pincode}."
            )

    # Fallback: check other active depots with available capacity
    fallback_depots = [d for d in active_depots if d not in primary_depots]
    for depot in fallback_depots:
        if depot.current_order_count < depot.daily_capacity:
            return DepotAssignmentResult(
                assigned_depot_id=depot.id,
                assigned_depot_name=depot.name,
                assignment_type="fallback",
                reason=f"Primary depot at capacity; reassigned to secondary depot {depot.name}."
            )

    # Unassigned Exception
    return DepotAssignmentResult(
        assigned_depot_id=None,
        assigned_depot_name=None,
        assignment_type="unassigned",
        reason=f"No active depot has capacity for pincode {customer_pincode}. Routed to Admin Exceptions Queue."
    )
